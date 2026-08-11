import { DynamicModule, Module, forwardRef } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { EngineModule } from '../engine/engine.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueService } from './queue.service';
import { WorkflowExecutionWorker } from './workflow-execution.worker';
import { WorkflowsService } from '../workflows/workflows.service';
import { WorkflowRunsService } from '../runs/workflow-runs.service';

const sharedProviders = [QueueService, WorkflowsService, WorkflowRunsService];

@Module({})
export class QueueModule {
  /** Used by the HTTP API — enqueues jobs only. */
  static forApi(): DynamicModule {
    return {
      module: QueueModule,
      imports: [RedisModule, forwardRef(() => EngineModule), PrismaModule],
      providers: sharedProviders,
      exports: [QueueService, WorkflowsService, WorkflowRunsService],
    };
  }

  /** Used by the standalone worker process — consumes jobs from BullMQ. */
  static forWorker(): DynamicModule {
    return {
      module: QueueModule,
      imports: [RedisModule, forwardRef(() => EngineModule), PrismaModule],
      providers: [...sharedProviders, WorkflowExecutionWorker],
      exports: [QueueService, WorkflowsService, WorkflowRunsService],
    };
  }
}
