import { INodeExecutor } from './node-executor.interface';
import { WorkflowNode, ExecutionContext, RunStepResult } from "@repo/shared-types";
export declare class ApprovalNodeExecutor implements INodeExecutor {
    private readonly logger;
    execute(node: WorkflowNode, context: ExecutionContext): Promise<RunStepResult>;
}
