import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import { WorkflowRunsService } from '../runs/workflow-runs.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { WorkflowEngineService } from '../engine/workflow-engine.service';

export interface WorkflowRunJobData {
  runId: string;
  workflowId: string;
  initialInput: Record<string, any>;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queue: Queue<WorkflowRunJobData> | null = null;

  constructor(
    private readonly redisService: RedisService,
    private readonly runsService: WorkflowRunsService,
    private readonly workflowsService: WorkflowsService,
    private readonly engineService: WorkflowEngineService,
  ) {}

  async onModuleInit() {
    try {
      const client = this.redisService.getClient();
      if (this.redisService.isUsingRealClient()) {
        this.queue = new Queue<WorkflowRunJobData>('workflow-execution', {
          connection: client as any,
        });
        this.logger.log('Initialized BullMQ Queue "workflow-execution"');
      } else {
        this.logger.log('Running QueueService in Async In-Memory fallback mode (Dev Redis Mock)');
      }
    } catch (err) {
      this.logger.warn(`Failed to initialize BullMQ queue: ${err}`);
    }
  }

  async onModuleDestroy() {
    if (this.queue) {
      await this.queue.close();
    }
  }

  async enqueueWorkflowRun(runId: string, workflowId: string, initialInput: Record<string, any> = {}) {
    this.logger.log(`Enqueuing Workflow Run [${runId}] for Workflow [${workflowId}]`);

    if (this.queue) {
      await this.queue.add(
        'execute-workflow',
        { runId, workflowId, initialInput },
        {
          jobId: runId,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      );
      return;
    }

    setImmediate(async () => {
      await this.processJobDirectly({ runId, workflowId, initialInput });
    });
  }

  /**
   * Internal job processor used directly in dev fallback mode or by BullMQ worker.
   * Persists each step as it completes and supports idempotent retries.
   */
  async processJobDirectly(data: WorkflowRunJobData) {
    const { runId, workflowId, initialInput } = data;
    this.logger.log(`Processing Workflow Execution Job for Run [${runId}]`);

    try {
      const workflow = await this.workflowsService.findOne(workflowId);
      const existingRun = await this.runsService.getRun(runId);
      const resumeState = this.runsService.buildResumeState(existingRun.steps);

      await this.runsService.updateRunStatus(runId, 'running');

      const result = await this.engineService.executeWorkflow(
        workflow.definition,
        initialInput,
        runId,
        {
          resumeState,
          onStepComplete: async (step) => {
            await this.runsService.upsertStepResult(runId, step);
          },
        },
      );

      const isTerminal = result.status === 'completed' || result.status === 'failed';
      const finalRun = await this.runsService.getRun(runId);
      const totalCostUsd = finalRun.steps.reduce((sum, s) => sum + (s.costUsd ?? 0), 0);

      await this.runsService.updateRunStatus(runId, result.status, {
        finishedAt: isTerminal ? new Date() : undefined,
        totalCostUsd,
      });

      this.logger.log(`Finished processing Job for Run [${runId}] with status "${result.status}"`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Job processing failed for Run [${runId}]: ${errorMsg}`);
      await this.runsService.updateRunStatus(runId, 'failed', { finishedAt: new Date() });
      throw err;
    }
  }
}
