import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RunStatus, RunStepResult, WorkflowRunResponse } from '@repo/shared-types';

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

  async updateRunStatus(runId: string, status: RunStatus, finishedAt?: Date, totalCostUsd?: number) {
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

  async recordStepResult(runId: string, step: RunStepResult) {
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
        nodeType: s.nodeType as any,
        input: parsedStepInput,
        output: parsedStepOutput,
        status: s.status as any,
        latencyMs: s.latencyMs || undefined,
        tokensUsed: s.tokensUsed || undefined,
        costUsd: s.costUsd || undefined,
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
