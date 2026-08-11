import { Controller, Get, Query } from '@nestjs/common';
import { WorkflowRunsService } from './workflow-runs.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly runsService: WorkflowRunsService) {}

  @Get('metrics')
  async getMetrics() {
    return this.runsService.getPlatformMetrics();
  }

  @Get('runs')
  async getRecentRuns(@Query('limit') limit?: string) {
    return this.runsService.getRecentRuns(limit ? parseInt(limit, 10) : 20);
  }
}
