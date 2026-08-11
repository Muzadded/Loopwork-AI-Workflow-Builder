import { PrismaService } from '../prisma/prisma.service';
import { ApprovalItem, ResolveApprovalDto } from "@repo/shared-types";
import { QueueService } from '../queue/queue.service';
import { WorkflowRunsService } from '../runs/workflow-runs.service';
export declare class ApprovalsService {
    private readonly prisma;
    private readonly queueService;
    private readonly runsService;
    private readonly logger;
    constructor(prisma: PrismaService, queueService: QueueService, runsService: WorkflowRunsService);
    createApproval(runId: string, nodeId: string, payload?: Record<string, any>): Promise<{
        status: string;
        id: string;
        runId: string;
        nodeId: string;
        createdAt: Date;
        payload: string;
        resolvedAt: Date | null;
    }>;
    private notifyApproval;
    findPending(): Promise<ApprovalItem[]>;
    findOne(id: string): Promise<ApprovalItem>;
    resolveApproval(id: string, dto: ResolveApprovalDto): Promise<ApprovalItem>;
    private mapApproval;
}
