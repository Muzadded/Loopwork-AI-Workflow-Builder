import { PrismaService } from '../prisma/prisma.service';
import { RunStatus, RunStepResult, WorkflowRunResponse } from "@repo/shared-types";
export declare class WorkflowRunsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createRun(workflowId: string, input?: Record<string, any>): Promise<{
        status: string;
        id: string;
        workflowId: string;
        input: string;
        startedAt: Date;
        finishedAt: Date | null;
        totalCostUsd: number | null;
    }>;
    updateRunStatus(runId: string, status: RunStatus, finishedAt?: Date, totalCostUsd?: number): Promise<void>;
    recordStepResult(runId: string, step: RunStepResult): Promise<void>;
    getRun(runId: string): Promise<WorkflowRunResponse>;
    getWorkflowRuns(workflowId: string): Promise<WorkflowRunResponse[]>;
    private computeTotalLatency;
}
