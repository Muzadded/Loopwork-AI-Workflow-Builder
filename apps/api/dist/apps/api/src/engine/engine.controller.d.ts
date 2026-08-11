import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowDefinition, EngineTestRunResponse } from "@repo/shared-types";
export declare class EngineController {
    private readonly engineService;
    constructor(engineService: WorkflowEngineService);
    testRun(body: {
        workflow?: WorkflowDefinition;
        initialInput?: Record<string, any>;
    }): Promise<EngineTestRunResponse>;
}
