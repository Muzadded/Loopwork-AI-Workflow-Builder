"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ApprovalsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const queue_service_1 = require("../queue/queue.service");
const workflow_runs_service_1 = require("../runs/workflow-runs.service");
let ApprovalsService = ApprovalsService_1 = class ApprovalsService {
    prisma;
    queueService;
    runsService;
    logger = new common_1.Logger(ApprovalsService_1.name);
    constructor(prisma, queueService, runsService) {
        this.prisma = prisma;
        this.queueService = queueService;
        this.runsService = runsService;
    }
    async createApproval(runId, nodeId, payload = {}) {
        const existing = await this.prisma.approval.findFirst({
            where: { runId, nodeId, status: 'pending' },
        });
        if (existing) {
            return existing;
        }
        const approval = await this.prisma.approval.create({
            data: {
                runId,
                nodeId,
                status: 'pending',
                payload: JSON.stringify(payload),
            },
        });
        this.logger.log(`Created Pending Approval [${approval.id}] for Run [${runId}], Node [${nodeId}]`);
        this.notifyApproval(approval.id, runId, nodeId, payload);
        return approval;
    }
    notifyApproval(approvalId, runId, nodeId, payload) {
        const webhook = process.env.SLACK_WEBHOOK_URL;
        if (!webhook)
            return;
        const reason = payload.reason || 'Workflow requires human review';
        fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `🔔 Approval needed: Run \`${runId.slice(0, 8)}\` at node \`${nodeId}\` — ${reason}`,
            }),
        }).catch((err) => this.logger.warn(`Slack notification failed: ${err}`));
    }
    async findPending() {
        const approvals = await this.prisma.approval.findMany({
            where: { status: 'pending' },
            orderBy: { createdAt: 'desc' },
        });
        return approvals.map((a) => this.mapApproval(a));
    }
    async findOne(id) {
        const approval = await this.prisma.approval.findUnique({ where: { id } });
        if (!approval) {
            throw new common_1.NotFoundException(`Approval with ID ${id} not found`);
        }
        return this.mapApproval(approval);
    }
    async resolveApproval(id, dto) {
        const existing = await this.findOne(id);
        await this.prisma.approval.update({
            where: { id },
            data: { status: dto.status, resolvedAt: new Date() },
        });
        this.logger.log(`Resolved Approval [${id}] => ${dto.status}`);
        const run = await this.runsService.getRun(existing.runId);
        if (dto.status === 'rejected') {
            await this.runsService.updateRunStatus(existing.runId, 'failed', { finishedAt: new Date() });
            return this.findOne(id);
        }
        await this.runsService.updateRunStatus(existing.runId, 'running', { finishedAt: null });
        await this.queueService.enqueueWorkflowRun(existing.runId, run.workflowId, run.input);
        this.logger.log(`Re-enqueued Run [${existing.runId}] after approval [${id}]`);
        return this.findOne(id);
    }
    mapApproval(a) {
        let parsedPayload = {};
        try {
            parsedPayload = JSON.parse(a.payload);
        }
        catch { }
        return {
            id: a.id,
            runId: a.runId,
            nodeId: a.nodeId,
            status: a.status,
            payload: parsedPayload,
            createdAt: a.createdAt.toISOString(),
            resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
        };
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = ApprovalsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => queue_service_1.QueueService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        queue_service_1.QueueService,
        workflow_runs_service_1.WorkflowRunsService])
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map