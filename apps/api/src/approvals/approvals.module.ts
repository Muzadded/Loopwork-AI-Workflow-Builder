import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ApprovalsService } from './approvals.service';
import { ApprovalsController } from './approvals.controller';
import { QueueModule } from '../queue/queue.module';
import { RunsCoreModule } from '../runs/runs-core.module';

@Module({
  imports: [PrismaModule, RunsCoreModule, QueueModule.forApi()],
  providers: [ApprovalsService],
  controllers: [ApprovalsController],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
