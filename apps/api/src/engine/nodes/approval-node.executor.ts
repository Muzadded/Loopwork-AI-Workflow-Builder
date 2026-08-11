import { Injectable, Logger } from '@nestjs/common';
import { INodeExecutor } from './node-executor.interface';
import { WorkflowNode, ExecutionContext, RunStepResult, ApprovalNodeConfig } from '@repo/shared-types';
import { interpolateTemplate } from '../utils/template-interpolator';

@Injectable()
export class ApprovalNodeExecutor implements INodeExecutor {
  private readonly logger = new Logger(ApprovalNodeExecutor.name);

  async execute(node: WorkflowNode, context: ExecutionContext): Promise<RunStepResult> {
    const startTime = Date.now();
    const config = node.config as ApprovalNodeConfig;

    const rawMessage = config.message || 'Action requires human approval before proceeding.';
    const interpolatedMessage = interpolateTemplate(rawMessage, context);

    this.logger.log(`Executing Approval Node [${node.id}] - Awaiting Human Decision`);

    return {
      nodeId: node.id,
      nodeType: 'approval',
      input: { message: interpolatedMessage, assigneeRole: config.assigneeRole || 'admin' },
      output: {
        requiresApproval: true,
        message: interpolatedMessage,
        assigneeRole: config.assigneeRole || 'admin',
        contextSnapshot: context.nodeOutputs,
      },
      status: 'success',
      latencyMs: Date.now() - startTime,
    };
  }
}
