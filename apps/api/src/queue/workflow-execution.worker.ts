import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import { QueueService, WorkflowRunJobData } from './queue.service';

@Injectable()
export class WorkflowExecutionWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkflowExecutionWorker.name);
  private worker: Worker<WorkflowRunJobData> | null = null;

  constructor(
    private readonly redisService: RedisService,
    private readonly queueService: QueueService,
  ) {}

  async onModuleInit() {
    if (this.redisService.isUsingRealClient()) {
      const client = this.redisService.getClient();
      this.worker = new Worker<WorkflowRunJobData>(
        'workflow-execution',
        async (job: Job<WorkflowRunJobData>) => {
          this.logger.log(`Worker received BullMQ Job ID [${job.id}] for Run [${job.data.runId}]`);
          await this.queueService.processJobDirectly(job.data);
        },
        { connection: client as any, concurrency: 5 },
      );

      this.worker.on('completed', (job) => {
        this.logger.log(`BullMQ Job [${job.id}] completed successfully`);
      });

      this.worker.on('failed', (job, err) => {
        this.logger.error(`BullMQ Job [${job?.id}] failed: ${err.message}`);
      });

      this.logger.log('Started BullMQ Worker for queue "workflow-execution"');
    }
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
