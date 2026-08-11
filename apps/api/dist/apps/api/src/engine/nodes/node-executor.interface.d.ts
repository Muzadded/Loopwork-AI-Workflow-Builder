import { WorkflowNode, ExecutionContext, RunStepResult } from "@repo/shared-types";
export interface INodeExecutor {
    execute(node: WorkflowNode, context: ExecutionContext): Promise<RunStepResult>;
}
