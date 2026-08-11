import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule.forApi()],
  controllers: [WorkflowsController],
})
export class WorkflowsModule {}
