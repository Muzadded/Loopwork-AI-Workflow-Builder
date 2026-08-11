import { Injectable } from '@nestjs/common';
import { INodeExecutor } from './node-executor.interface';
import { WorkflowNode, ExecutionContext, RunStepResult } from '@repo/shared-types';

@Injectable()
export class TriggerNodeExecutor implements INodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<RunStepResult> {
    const startTime = Date.now();

    // Trigger node passes through initial workflow input
    const output = {
      triggeredAt: new Date().toISOString(),
      ...context.initialInput,
    };

    return {
      nodeId: node.id,
      nodeType: 'trigger',
      input: context.initialInput,
      output,
      status: 'success',
      latencyMs: Date.now() - startTime,
    };
  }
}
