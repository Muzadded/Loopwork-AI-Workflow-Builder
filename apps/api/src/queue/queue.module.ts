import { DynamicModule, Module, forwardRef } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { EngineModule } from '../engine/engine.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RunsCoreModule } from '../runs/runs-core.module';
import { QueueService } from './queue.service';
import { WorkflowExecutionWorker } from './workflow-execution.worker';
import { WorkflowsService } from '../workflows/workflows.service';

const apiProviders = [QueueService, WorkflowsService];

@Module({})
export class QueueModule {
  /** Used by the HTTP API — enqueues jobs only. */
  static forApi(): DynamicModule {
    return {
      module: QueueModule,
      imports: [RedisModule, forwardRef(() => EngineModule), PrismaModule, RunsCoreModule],
      providers: apiProviders,
      exports: [QueueService, WorkflowsService, RunsCoreModule],
    };
  }

  /** Used by the standalone worker process — consumes jobs from BullMQ. */
  static forWorker(): DynamicModule {
    return {
      module: QueueModule,
      imports: [RedisModule, forwardRef(() => EngineModule), PrismaModule, RunsCoreModule],
      providers: [...apiProviders, WorkflowExecutionWorker],
      exports: [QueueService, WorkflowsService, RunsCoreModule],
    };
  }
}
