import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AiModule } from './ai/ai.module';
import { EngineModule } from './engine/engine.module';
import { QueueModule } from './queue/queue.module';
import { ApprovalsModule } from './approvals/approvals.module';

/**
 * Minimal Nest module for the standalone BullMQ worker process.
 * No HTTP controllers — only queue consumption and workflow execution.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    RedisModule,
    AiModule,
    EngineModule,
    ApprovalsModule,
    QueueModule.forWorker(),
  ],
})
export class WorkerAppModule {}
