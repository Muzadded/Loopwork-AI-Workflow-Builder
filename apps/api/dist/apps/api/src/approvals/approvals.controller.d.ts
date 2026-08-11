import { ApprovalsService } from './approvals.service';
export declare class ApprovalsController {
    private readonly approvalsService;
    constructor(approvalsService: ApprovalsService);
    findPending(): Promise<import("@repo/shared-types").ApprovalItem[]>;
    findOne(id: string): Promise<import("@repo/shared-types").ApprovalItem>;
    approve(id: string, body: {
        userFeedback?: string;
    }): Promise<import("@repo/shared-types").ApprovalItem>;
    reject(id: string, body: {
        userFeedback?: string;
    }): Promise<import("@repo/shared-types").ApprovalItem>;
}
