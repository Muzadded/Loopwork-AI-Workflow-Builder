import { WorkflowRunsService } from './workflow-runs.service';
export declare class RunsController {
    private readonly runsService;
    constructor(runsService: WorkflowRunsService);
    getRun(id: string): Promise<import("@repo/shared-types").WorkflowRunResponse>;
}
