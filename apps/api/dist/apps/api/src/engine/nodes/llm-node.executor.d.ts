import { INodeExecutor } from './node-executor.interface';
import { WorkflowNode, ExecutionContext, RunStepResult } from "@repo/shared-types";
import { GeminiProviderService } from '../../ai/gemini-provider.service';
export declare class LlmNodeExecutor implements INodeExecutor {
    private readonly geminiProvider;
    private readonly logger;
    constructor(geminiProvider: GeminiProviderService);
    execute(node: WorkflowNode, context: ExecutionContext): Promise<RunStepResult>;
}
