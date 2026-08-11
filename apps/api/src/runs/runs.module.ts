import { Module } from '@nestjs/common';
import { RunsController } from './runs.controller';
import { DashboardController } from './dashboard.controller';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule.forApi()],
  controllers: [RunsController, DashboardController],
})
export class RunsModule {}
