import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { ResolveApprovalDto } from '@repo/shared-types';

@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  async findPending() {
    return this.approvalsService.findPending();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.approvalsService.findOne(id);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Body() body: { userFeedback?: string }) {
    return this.approvalsService.resolveApproval(id, {
      status: 'approved',
      userFeedback: body.userFeedback,
    });
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Body() body: { userFeedback?: string }) {
    return this.approvalsService.resolveApproval(id, {
      status: 'rejected',
      userFeedback: body.userFeedback,
    });
  }
}
