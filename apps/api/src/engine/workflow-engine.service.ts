import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  WorkflowDefinition,
  WorkflowNode,
  ExecutionContext,
  RunStepResult,
  EngineTestRunResponse,
  RunStatus,
  WorkflowExecutionOptions,
} from '@repo/shared-types';
import { NodeExecutorRegistry } from './nodes/node-executor.registry';
import { randomUUID } from 'node:crypto';

import { ApprovalsService } from '../approvals/approvals.service';

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(
    private readonly executorRegistry: NodeExecutorRegistry,
    private readonly approvalsService: ApprovalsService,
  ) {}

  /**
   * Sorts nodes topologically using Kahn's algorithm and verifies DAG structure (cycle detection).
   */
  public topologicalSort(definition: WorkflowDefinition): WorkflowNode[] {
    const { nodes, edges } = definition;
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      graph.set(n.id, []);
    });

    edges.forEach((e) => {
      if (inDegree.has(e.target)) {
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      }
      if (graph.has(e.source)) {
        graph.get(e.source)?.push(e.target);
      }
    });

    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) queue.push(nodeId);
    });

    const sortedNodes: WorkflowNode[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentNode = nodeMap.get(currentId);
      if (currentNode) sortedNodes.push(currentNode);

      const neighbors = graph.get(currentId) || [];
      for (const neighborId of neighbors) {
        const newDegree = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, newDegree);
        if (newDegree === 0) {
          queue.push(neighborId);
        }
      }
    }

    if (sortedNodes.length !== nodes.length) {
      throw new BadRequestException(
        'Workflow graph contains a cycle or unreachable nodes. Must be a valid Directed Acyclic Graph (DAG).',
      );
    }

    return sortedNodes;
  }

  /**
   * Executes a workflow DAG step by step.
   * @param runId Optional DB-assigned run ID. When omitted, a new UUID is generated (test-run only).
   * @param options Persistence callback and resume state for async/retry execution.
   */
  async executeWorkflow(
    definition: WorkflowDefinition,
    initialInput: Record<string, any> = {},
    runId?: string,
    options: WorkflowExecutionOptions = {},
  ): Promise<EngineTestRunResponse> {
    const startTime = Date.now();
    const effectiveRunId = runId ?? randomUUID();
    const completedNodeIds = new Set(options.resumeState?.completedNodeIds ?? []);

    this.logger.log(
      `Starting Workflow Run [${effectiveRunId}] for Workflow "${definition.name}" (${definition.nodes.length} nodes)${
        completedNodeIds.size > 0 ? ` — resuming after ${completedNodeIds.size} completed step(s)` : ''
      }`,
    );

    const sortedNodes = this.topologicalSort(definition);
    const context: ExecutionContext = {
      workflowId: definition.id,
      runId: effectiveRunId,
      initialInput,
      nodeOutputs: { ...(options.resumeState?.nodeOutputs ?? {}) },
    };

    const executionTrace: RunStepResult[] = [];
    const disabledNodes = new Set<string>();

    let totalTokens = 0;
    let totalCost = 0;
    let overallStatus: RunStatus = 'completed';

    for (const node of sortedNodes) {
      if (completedNodeIds.has(node.id)) {
        this.logger.log(`Skipping Node [${node.id}] (${node.type}) — already completed in a prior attempt`);
        continue;
      }

      if (disabledNodes.has(node.id)) {
        this.logger.log(`Skipping Node [${node.id}] (${node.type}) - Disabled by upstream branch condition`);
        continue;
      }

      try {
        const executor = this.executorRegistry.getExecutor(node.type);
        const stepResult = await executor.execute(node, context);

        executionTrace.push(stepResult);
        await options.onStepComplete?.(stepResult);

        if (stepResult.status === 'failed') {
          overallStatus = 'failed';
          this.logger.error(`Workflow Run [${effectiveRunId}] failed at node [${node.id}]`);
          break;
        }

        if (stepResult.output) {
          context.nodeOutputs[node.id] = stepResult.output;
        }

        if (stepResult.tokensUsed) totalTokens += stepResult.tokensUsed;
        if (stepResult.costUsd) totalCost += stepResult.costUsd;

        const isApprovalNode = node.type === 'approval';
        const lowConfidence =
          node.type === 'llm' &&
          stepResult.output?.confidence !== undefined &&
          node.config?.confidenceThreshold !== undefined &&
          Number(stepResult.output.confidence) < Number(node.config.confidenceThreshold);

        if (isApprovalNode || lowConfidence) {
          overallStatus = 'awaiting_approval';
          this.logger.warn(
            `Workflow Run [${effectiveRunId}] paused at node [${node.id}] - ${
              isApprovalNode ? 'Explicit Approval Node reached' : `Low AI confidence score (${stepResult.output?.confidence})`
            }`,
          );

          await this.approvalsService.createApproval(effectiveRunId, node.id, {
            stepResult,
            nodeOutputs: context.nodeOutputs,
            reason: isApprovalNode ? 'Manual approval step' : 'Low AI confidence score below threshold',
          });

          break;
        }

        if (node.type === 'condition' && stepResult.output) {
          const selectedBranch = stepResult.output.branch;
          const outgoingEdges = definition.edges.filter((e) => e.source === node.id);

          for (const edge of outgoingEdges) {
            if (edge.condition && edge.condition !== selectedBranch) {
              disabledNodes.add(edge.target);
              this.logger.log(
                `Branching: Disabling target node [${edge.target}] on non-matching edge condition "${edge.condition}"`,
              );
            }
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Exception during execution of node [${node.id}]: ${errorMsg}`);

        const failedStep: RunStepResult = {
          nodeId: node.id,
          nodeType: node.type,
          input: {},
          status: 'failed',
          error: errorMsg,
        };

        executionTrace.push(failedStep);
        await options.onStepComplete?.(failedStep);

        overallStatus = 'failed';
        break;
      }
    }

    const totalLatency = Date.now() - startTime;
    this.logger.log(
      `Workflow Run [${effectiveRunId}] finished with status "${overallStatus}" in ${totalLatency}ms (Tokens: ${totalTokens}, Cost: $${totalCost.toFixed(6)})`,
    );

    return {
      runId: effectiveRunId,
      status: overallStatus,
      executionTrace,
      finalOutput: context.nodeOutputs,
      totalLatencyMs: totalLatency,
      totalCostUsd: totalCost,
      totalTokensUsed: totalTokens,
    };
  }
}
