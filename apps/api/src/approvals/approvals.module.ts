import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ApprovalsService } from './approvals.service';
import { ApprovalsController } from './approvals.controller';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [PrismaModule, forwardRef(() => QueueModule.forApi())],
  providers: [ApprovalsService],
  controllers: [ApprovalsController],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
