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
    async updateRunStatus(runId, status, options = {}) {
        const isTerminal = status === 'completed' || status === 'failed';
        const data = { status };
        if (options.totalCostUsd !== undefined) {
            data.totalCostUsd = options.totalCostUsd;
        }
        if (isTerminal) {
            data.finishedAt = options.finishedAt ?? new Date();
        }
        else if (status === 'running') {
            data.finishedAt = null;
        }
        else if (status === 'awaiting_approval') {
            data.finishedAt = null;
        }
        await this.prisma.workflowRun.update({
            where: { id: runId },
            data,
        });
        this.logger.log(`Updated Run [${runId}] status => ${status}`);
    }
    async upsertStepResult(runId, step) {
        await this.prisma.runStep.upsert({
            where: {
                runId_nodeId: { runId, nodeId: step.nodeId },
            },
            create: {
                runId,
                nodeId: step.nodeId,
                nodeType: step.nodeType,
                input: JSON.stringify(step.input ?? {}),
                output: step.output ? JSON.stringify(step.output) : null,
                status: step.status,
                latencyMs: step.latencyMs,
                tokensUsed: step.tokensUsed,
                costUsd: step.costUsd,
                error: step.error ?? null,
            },
            update: {
                nodeType: step.nodeType,
                input: JSON.stringify(step.input ?? {}),
                output: step.output ? JSON.stringify(step.output) : null,
                status: step.status,
                latencyMs: step.latencyMs,
                tokensUsed: step.tokensUsed,
                costUsd: step.costUsd,
                error: step.error ?? null,
            },
        });
    }
    async recordStepResult(runId, step) {
        return this.upsertStepResult(runId, step);
    }
    buildResumeState(steps) {
        const successful = steps.filter((s) => s.status === 'success');
        if (successful.length === 0)
            return undefined;
        const nodeOutputs = {};
        for (const step of successful) {
            if (step.output) {
                nodeOutputs[step.nodeId] = step.output;
            }
        }
        return {
            nodeOutputs,
            completedNodeIds: successful.map((s) => s.nodeId),
        };
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
                error: s.error || undefined,
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
    async getRecentRuns(limit = 20) {
        const runs = await this.prisma.workflowRun.findMany({
            orderBy: { startedAt: 'desc' },
            take: limit,
            include: { workflow: { select: { name: true } }, steps: true },
        });
        return runs.map((run) => {
            const steps = run.steps;
            const latency = this.computeTotalLatency(run.startedAt, run.finishedAt, steps.map((s) => ({
                nodeId: s.nodeId,
                nodeType: s.nodeType,
                input: {},
                status: s.status,
                latencyMs: s.latencyMs ?? undefined,
            })));
            return {
                id: run.id,
                workflowId: run.workflowId,
                workflowName: run.workflow.name,
                status: run.status,
                startedAt: run.startedAt.toISOString(),
                finishedAt: run.finishedAt?.toISOString() ?? null,
                totalCostUsd: run.totalCostUsd,
                totalLatencyMs: latency,
            };
        });
    }
    async getPlatformMetrics() {
        const [runs, pendingApprovals] = await Promise.all([
            this.prisma.workflowRun.findMany({ include: { steps: true } }),
            this.prisma.approval.count({ where: { status: 'pending' } }),
        ]);
        const totalRuns = runs.length;
        const completed = runs.filter((r) => r.status === 'completed').length;
        const successRate = totalRuns ? (completed / totalRuns) * 100 : 0;
        const totalCostUsd = runs.reduce((sum, r) => sum + (r.totalCostUsd ?? 0), 0);
        let latencySum = 0;
        let latencyCount = 0;
        for (const run of runs) {
            const ms = run.finishedAt
                ? run.finishedAt.getTime() - run.startedAt.getTime()
                : run.steps.reduce((s, step) => s + (step.latencyMs ?? 0), 0);
            if (ms > 0) {
                latencySum += ms;
                latencyCount++;
            }
        }
        const avgLatencyMs = latencyCount ? Math.round(latencySum / latencyCount) : 0;
        let flash = 0;
        let pro = 0;
        let other = 0;
        for (const run of runs) {
            for (const step of run.steps) {
                if (step.nodeType !== 'llm')
                    continue;
                let model = '';
                try {
                    const input = JSON.parse(step.input);
                    model = String(input.model || input.tiersAttempted?.[0]?.model || '');
                }
                catch { }
                if (model.includes('flash'))
                    flash++;
                else if (model.includes('pro'))
                    pro++;
                else
                    other++;
            }
        }
        const dayMap = new Map();
        for (const run of runs) {
            const day = run.startedAt.toISOString().slice(0, 10);
            const entry = dayMap.get(day) ?? { cost: 0, count: 0 };
            entry.cost += run.totalCostUsd ?? 0;
            entry.count += 1;
            dayMap.set(day, entry);
        }
        const sortedDays = [...dayMap.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-7);
        return {
            totalRuns,
            successRate: Math.round(successRate * 10) / 10,
            totalCostUsd: Math.round(totalCostUsd * 1000000) / 1000000,
            avgLatencyMs,
            pendingApprovals,
            modelUsage: { flash, pro, other },
            costOverTime: sortedDays.map(([date, v]) => ({ date, costUsd: v.cost })),
            runsByDay: sortedDays.map(([date, v]) => ({ date, count: v.count })),
        };
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