import { PrismaService } from '../prisma/prisma.service';
import { RunStatus, RunStepResult, WorkflowRunResponse, WorkflowResumeState, DashboardMetrics, RecentRunItem } from "@repo/shared-types";
interface UpdateRunStatusOptions {
    finishedAt?: Date | null;
    totalCostUsd?: number;
}
export declare class WorkflowRunsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createRun(workflowId: string, input?: Record<string, any>): Promise<{
        status: string;
        id: string;
        input: string;
        startedAt: Date;
        finishedAt: Date | null;
        totalCostUsd: number | null;
        workflowId: string;
    }>;
    updateRunStatus(runId: string, status: RunStatus, options?: UpdateRunStatusOptions): Promise<void>;
    upsertStepResult(runId: string, step: RunStepResult): Promise<void>;
    recordStepResult(runId: string, step: RunStepResult): Promise<void>;
    buildResumeState(steps: RunStepResult[]): WorkflowResumeState | undefined;
    getRun(runId: string): Promise<WorkflowRunResponse>;
    getWorkflowRuns(workflowId: string): Promise<WorkflowRunResponse[]>;
    getRecentRuns(limit?: number): Promise<RecentRunItem[]>;
    getPlatformMetrics(): Promise<DashboardMetrics>;
    private computeTotalLatency;
}
export {};
