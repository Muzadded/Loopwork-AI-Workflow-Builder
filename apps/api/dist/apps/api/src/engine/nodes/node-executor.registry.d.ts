import { NodeType } from "@repo/shared-types";
import { INodeExecutor } from './node-executor.interface';
import { TriggerNodeExecutor } from './trigger-node.executor';
import { LlmNodeExecutor } from './llm-node.executor';
import { ConditionNodeExecutor } from './condition-node.executor';
import { ActionNodeExecutor } from './action-node.executor';
import { ApprovalNodeExecutor } from './approval-node.executor';
export declare class NodeExecutorRegistry {
    private readonly triggerExecutor;
    private readonly llmExecutor;
    private readonly conditionExecutor;
    private readonly actionExecutor;
    private readonly approvalExecutor;
    private readonly logger;
    private readonly executors;
    constructor(triggerExecutor: TriggerNodeExecutor, llmExecutor: LlmNodeExecutor, conditionExecutor: ConditionNodeExecutor, actionExecutor: ActionNodeExecutor, approvalExecutor: ApprovalNodeExecutor);
    getExecutor(type: NodeType): INodeExecutor;
}
