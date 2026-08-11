import { WorkflowRunsService } from './workflow-runs.service';
export declare class DashboardController {
    private readonly runsService;
    constructor(runsService: WorkflowRunsService);
    getMetrics(): Promise<import("@repo/shared-types").DashboardMetrics>;
    getRecentRuns(limit?: string): Promise<import("@repo/shared-types").RecentRunItem[]>;
}
