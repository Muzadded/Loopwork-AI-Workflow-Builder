import { Controller, Get, Param } from '@nestjs/common';
import { WorkflowRunsService } from './workflow-runs.service';

@Controller('runs')
export class RunsController {
  constructor(private readonly runsService: WorkflowRunsService) {}

  @Get(':id')
  async getRun(@Param('id') id: string) {
    return this.runsService.getRun(id);
  }
}
