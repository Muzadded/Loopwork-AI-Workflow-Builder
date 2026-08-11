import { Module } from '@nestjs/common';
import { RunsController } from './runs.controller';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule.forApi()],
  controllers: [RunsController],
})
export class RunsModule {}
