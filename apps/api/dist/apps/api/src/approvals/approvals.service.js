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
var ApprovalsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ApprovalsService = ApprovalsService_1 = class ApprovalsService {
    prisma;
    logger = new common_1.Logger(ApprovalsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createApproval(runId, nodeId, payload = {}) {
        const approval = await this.prisma.approval.create({
            data: {
                runId,
                nodeId,
                status: 'pending',
                payload: JSON.stringify(payload),
            },
        });
        this.logger.log(`Created Pending Approval [${approval.id}] for Run [${runId}], Node [${nodeId}]`);
        return approval;
    }
    async findPending() {
        const approvals = await this.prisma.approval.findMany({
            where: { status: 'pending' },
            orderBy: { createdAt: 'desc' },
        });
        return approvals.map((a) => {
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
        });
    }
    async findOne(id) {
        const approval = await this.prisma.approval.findUnique({
            where: { id },
        });
        if (!approval) {
            throw new common_1.NotFoundException(`Approval with ID ${id} not found`);
        }
        let parsedPayload = {};
        try {
            parsedPayload = JSON.parse(approval.payload);
        }
        catch { }
        return {
            id: approval.id,
            runId: approval.runId,
            nodeId: approval.nodeId,
            status: approval.status,
            payload: parsedPayload,
            createdAt: approval.createdAt.toISOString(),
            resolvedAt: approval.resolvedAt ? approval.resolvedAt.toISOString() : null,
        };
    }
    async resolveApproval(id, dto) {
        const existing = await this.findOne(id);
        const updated = await this.prisma.approval.update({
            where: { id },
            data: {
                status: dto.status,
                resolvedAt: new Date(),
            },
        });
        this.logger.log(`Resolved Approval [${id}] => ${dto.status} (Feedback: "${dto.userFeedback || 'None'}")`);
        const runStatus = dto.status === 'approved' ? 'completed' : 'failed';
        await this.prisma.workflowRun.update({
            where: { id: existing.runId },
            data: {
                status: runStatus,
                finishedAt: new Date(),
            },
        });
        return this.findOne(id);
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = ApprovalsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map