import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RunStatus,
  RunStepResult,
  WorkflowRunResponse,
  WorkflowResumeState,
  DashboardMetrics,
  RecentRunItem,
} from '@repo/shared-types';

interface UpdateRunStatusOptions {
  finishedAt?: Date | null;
  totalCostUsd?: number;
}

@Injectable()
export class WorkflowRunsService {
  private readonly logger = new Logger(WorkflowRunsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createRun(workflowId: string, input: Record<string, any> = {}) {
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

  async updateRunStatus(
    runId: string,
    status: RunStatus,
    options: UpdateRunStatusOptions = {},
  ) {
    const isTerminal = status === 'completed' || status === 'failed';
    const data: {
      status: string;
      finishedAt?: Date | null;
      totalCostUsd?: number;
    } = { status };

    if (options.totalCostUsd !== undefined) {
      data.totalCostUsd = options.totalCostUsd;
    }

    if (isTerminal) {
      data.finishedAt = options.finishedAt ?? new Date();
    } else if (status === 'running') {
      data.finishedAt = null;
    } else if (status === 'awaiting_approval') {
      data.finishedAt = null;
    }

    await this.prisma.workflowRun.update({
      where: { id: runId },
      data,
    });
    this.logger.log(`Updated Run [${runId}] status => ${status}`);
  }

  async upsertStepResult(runId: string, step: RunStepResult) {
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

  /** @deprecated Use upsertStepResult */
  async recordStepResult(runId: string, step: RunStepResult) {
    return this.upsertStepResult(runId, step);
  }

  buildResumeState(steps: RunStepResult[]): WorkflowResumeState | undefined {
    const successful = steps.filter((s) => s.status === 'success');
    if (successful.length === 0) return undefined;

    const nodeOutputs: Record<string, Record<string, any>> = {};
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

  async getRun(runId: string): Promise<WorkflowRunResponse> {
    const run = await this.prisma.workflowRun.findUnique({
      where: { id: runId },
      include: {
        steps: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!run) {
      throw new NotFoundException(`Run with ID ${runId} not found`);
    }

    let parsedInput: Record<string, any> = {};
    try {
      parsedInput = JSON.parse(run.input);
    } catch {}

    const steps: RunStepResult[] = run.steps.map((s) => {
      let parsedStepInput = {};
      let parsedStepOutput = undefined;

      try {
        parsedStepInput = JSON.parse(s.input);
      } catch {}

      if (s.output) {
        try {
          parsedStepOutput = JSON.parse(s.output);
        } catch {}
      }

      return {
        nodeId: s.nodeId,
        nodeType: s.nodeType as RunStepResult['nodeType'],
        input: parsedStepInput,
        output: parsedStepOutput,
        status: s.status as RunStepResult['status'],
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
      status: run.status as RunStatus,
      input: parsedInput,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt ? run.finishedAt.toISOString() : null,
      totalCostUsd: run.totalCostUsd ?? null,
      totalLatencyMs: this.computeTotalLatency(run.startedAt, run.finishedAt, steps),
      totalTokensUsed: steps.reduce((sum, s) => sum + (s.tokensUsed ?? 0), 0) || null,
      steps,
    };
  }

  async getWorkflowRuns(workflowId: string): Promise<WorkflowRunResponse[]> {
    const runs = await this.prisma.workflowRun.findMany({
      where: { workflowId },
      orderBy: { startedAt: 'desc' },
    });

    const results: WorkflowRunResponse[] = [];
    for (const run of runs) {
      results.push(await this.getRun(run.id));
    }
    return results;
  }

  async getRecentRuns(limit = 20): Promise<RecentRunItem[]> {
    const runs = await this.prisma.workflowRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: { workflow: { select: { name: true } }, steps: true },
    });

    return runs.map((run) => {
      const steps = run.steps;
      const latency = this.computeTotalLatency(run.startedAt, run.finishedAt, steps.map((s) => ({
        nodeId: s.nodeId,
        nodeType: s.nodeType as RunStepResult['nodeType'],
        input: {},
        status: s.status as RunStepResult['status'],
        latencyMs: s.latencyMs ?? undefined,
      })));

      return {
        id: run.id,
        workflowId: run.workflowId,
        workflowName: run.workflow.name,
        status: run.status as RunStatus,
        startedAt: run.startedAt.toISOString(),
        finishedAt: run.finishedAt?.toISOString() ?? null,
        totalCostUsd: run.totalCostUsd,
        totalLatencyMs: latency,
      };
    });
  }

  async getPlatformMetrics(): Promise<DashboardMetrics> {
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
        if (step.nodeType !== 'llm') continue;
        let model = '';
        try {
          const input = JSON.parse(step.input);
          model = String(input.model || input.tiersAttempted?.[0]?.model || '');
        } catch {}
        if (model.includes('flash')) flash++;
        else if (model.includes('pro')) pro++;
        else other++;
      }
    }

    const dayMap = new Map<string, { cost: number; count: number }>();
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

  private computeTotalLatency(
    startedAt: Date,
    finishedAt: Date | null,
    steps: RunStepResult[],
  ): number | null {
    const stepTotal = steps.reduce((sum, s) => sum + (s.latencyMs ?? 0), 0);
    if (stepTotal > 0) return stepTotal;
    if (finishedAt) return finishedAt.getTime() - startedAt.getTime();
    return null;
  }
}
