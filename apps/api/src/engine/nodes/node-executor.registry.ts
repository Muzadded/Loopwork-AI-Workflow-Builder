import { Injectable, Logger } from '@nestjs/common';
import { NodeType } from '@repo/shared-types';
import { INodeExecutor } from './node-executor.interface';
import { TriggerNodeExecutor } from './trigger-node.executor';
import { LlmNodeExecutor } from './llm-node.executor';
import { ConditionNodeExecutor } from './condition-node.executor';
import { ActionNodeExecutor } from './action-node.executor';
import { ApprovalNodeExecutor } from './approval-node.executor';

@Injectable()
export class NodeExecutorRegistry {
  private readonly logger = new Logger(NodeExecutorRegistry.name);
  private readonly executors = new Map<NodeType, INodeExecutor>();

  constructor(
    private readonly triggerExecutor: TriggerNodeExecutor,
    private readonly llmExecutor: LlmNodeExecutor,
    private readonly conditionExecutor: ConditionNodeExecutor,
    private readonly actionExecutor: ActionNodeExecutor,
    private readonly approvalExecutor: ApprovalNodeExecutor,
  ) {
    this.executors.set('trigger', this.triggerExecutor);
    this.executors.set('llm', this.llmExecutor);
    this.executors.set('condition', this.conditionExecutor);
    this.executors.set('action', this.actionExecutor);
    this.executors.set('approval', this.approvalExecutor);
  }

  getExecutor(type: NodeType): INodeExecutor {
    const executor = this.executors.get(type);
    if (!executor) {
      throw new Error(`No executor registered for node type: ${type}`);
    }
    return executor;
  }
}
