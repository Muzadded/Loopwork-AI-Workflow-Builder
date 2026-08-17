import { Controller, Get, Param, Post } from '@nestjs/common';
import { WorkflowRunsService } from './workflow-runs.service';

@Controller('runs')
export class RunsController {
  constructor(private readonly runsService: WorkflowRunsService) {}

  @Get(':id')
  async getRun(@Param('id') id: string) {
    return this.runsService.getRun(id);
  }

  @Post(':id/cancel')
  async cancelRun(@Param('id') id: string) {
    return this.runsService.cancelRun(id);
  }
}
