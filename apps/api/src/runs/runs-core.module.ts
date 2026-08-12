import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkflowRunsService } from './workflow-runs.service';

@Module({
  imports: [PrismaModule],
  providers: [WorkflowRunsService],
  exports: [WorkflowRunsService],
})
export class RunsCoreModule {}
