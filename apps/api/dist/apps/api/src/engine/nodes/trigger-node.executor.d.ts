import { INodeExecutor } from './node-executor.interface';
import { WorkflowNode, ExecutionContext, RunStepResult } from "@repo/shared-types";
export declare class TriggerNodeExecutor implements INodeExecutor {
    execute(node: WorkflowNode, context: ExecutionContext): Promise<RunStepResult>;
}
