import { PrismaService } from '../prisma/prisma.service';
import { ApprovalItem, ResolveApprovalDto } from "@repo/shared-types";
export declare class ApprovalsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createApproval(runId: string, nodeId: string, payload?: Record<string, any>): Promise<{
        status: string;
        id: string;
        nodeId: string;
        payload: string;
        createdAt: Date;
        resolvedAt: Date | null;
        runId: string;
    }>;
    findPending(): Promise<ApprovalItem[]>;
    findOne(id: string): Promise<ApprovalItem>;
    resolveApproval(id: string, dto: ResolveApprovalDto): Promise<ApprovalItem>;
}
