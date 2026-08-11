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
var WorkflowRunsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowRunsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WorkflowRunsService = WorkflowRunsService_1 = class WorkflowRunsService {
    prisma;
    logger = new common_1.Logger(WorkflowRunsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRun(workflowId, input = {}) {
        const run = await this.prisma.workflowRun.create({
            data: {
                workflowId,
                status: 'pending',
                input: JSON.stringify(input),
            },
        });
        this.logger.log(`Created Workflow Run [${run.id}] for Workflow [${workflowId}]`);
        return run;
    }
    async updateRunStatus(runId, status, finishedAt, totalCostUsd) {
        await this.prisma.workflowRun.update({
            where: { id: runId },
            data: {
                status,
                finishedAt: finishedAt || (['completed', 'failed'].includes(status) ? new Date() : undefined),
                totalCostUsd: totalCostUsd !== undefined ? totalCostUsd : undefined,
            },
        });
        this.logger.log(`Updated Run [${runId}] status => ${status}`);
    }
    async recordStepResult(runId, step) {
        await this.prisma.runStep.create({
            data: {
                runId,
                nodeId: step.nodeId,
                nodeType: step.nodeType,
                input: JSON.stringify(step.input),
                output: step.output ? JSON.stringify(step.output) : null,
                status: step.status,
                latencyMs: step.latencyMs,
                tokensUsed: step.tokensUsed,
                costUsd: step.costUsd,
            },
        });
    }
    async getRun(runId) {
        const run = await this.prisma.workflowRun.findUnique({
            where: { id: runId },
            include: {
                steps: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!run) {
            throw new common_1.NotFoundException(`Run with ID ${runId} not found`);
        }
        let parsedInput = {};
        try {
            parsedInput = JSON.parse(run.input);
        }
        catch { }
        const steps = run.steps.map((s) => {
            let parsedStepInput = {};
            let parsedStepOutput = undefined;
            try {
                parsedStepInput = JSON.parse(s.input);
            }
            catch { }
            if (s.output) {
                try {
                    parsedStepOutput = JSON.parse(s.output);
                }
                catch { }
            }
            return {
                nodeId: s.nodeId,
                nodeType: s.nodeType,
                input: parsedStepInput,
                output: parsedStepOutput,
                status: s.status,
                latencyMs: s.latencyMs || undefined,
                tokensUsed: s.tokensUsed || undefined,
                costUsd: s.costUsd || undefined,
                createdAt: s.createdAt.toISOString(),
            };
        });
        return {
            id: run.id,
            workflowId: run.workflowId,
            status: run.status,
            input: parsedInput,
            startedAt: run.startedAt.toISOString(),
            finishedAt: run.finishedAt ? run.finishedAt.toISOString() : null,
            totalCostUsd: run.totalCostUsd ?? null,
            totalLatencyMs: this.computeTotalLatency(run.startedAt, run.finishedAt, steps),
            totalTokensUsed: steps.reduce((sum, s) => sum + (s.tokensUsed ?? 0), 0) || null,
            steps,
        };
    }
    async getWorkflowRuns(workflowId) {
        const runs = await this.prisma.workflowRun.findMany({
            where: { workflowId },
            orderBy: { startedAt: 'desc' },
        });
        const results = [];
        for (const run of runs) {
            results.push(await this.getRun(run.id));
        }
        return results;
    }
    computeTotalLatency(startedAt, finishedAt, steps) {
        const stepTotal = steps.reduce((sum, s) => sum + (s.latencyMs ?? 0), 0);
        if (stepTotal > 0)
            return stepTotal;
        if (finishedAt)
            return finishedAt.getTime() - startedAt.getTime();
        return null;
    }
};
exports.WorkflowRunsService = WorkflowRunsService;
exports.WorkflowRunsService = WorkflowRunsService = WorkflowRunsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkflowRunsService);
//# sourceMappingURL=workflow-runs.service.js.map