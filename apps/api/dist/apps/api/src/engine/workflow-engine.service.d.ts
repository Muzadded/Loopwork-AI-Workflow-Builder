import { WorkflowDefinition, WorkflowNode, EngineTestRunResponse, WorkflowExecutionOptions } from "@repo/shared-types";
import { NodeExecutorRegistry } from './nodes/node-executor.registry';
import { ApprovalsService } from '../approvals/approvals.service';
export declare class WorkflowEngineService {
    private readonly executorRegistry;
    private readonly approvalsService;
    private readonly logger;
    constructor(executorRegistry: NodeExecutorRegistry, approvalsService: ApprovalsService);
    topologicalSort(definition: WorkflowDefinition): WorkflowNode[];
    executeWorkflow(definition: WorkflowDefinition, initialInput?: Record<string, any>, runId?: string, options?: WorkflowExecutionOptions): Promise<EngineTestRunResponse>;
}
