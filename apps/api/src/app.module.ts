import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AiModule } from './ai/ai.module';
import { EngineModule } from './engine/engine.module';
import { QueueModule } from './queue/queue.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { RunsModule } from './runs/runs.module';
import { ApprovalsModule } from './approvals/approvals.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    RedisModule,
    HealthModule,
    AiModule,
    EngineModule,
    QueueModule.forApi(),
    WorkflowsModule,
    RunsModule,
    ApprovalsModule,
  ],
})
export class AppModule {}
