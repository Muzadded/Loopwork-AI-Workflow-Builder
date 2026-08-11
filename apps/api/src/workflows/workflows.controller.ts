import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowRunsService } from '../runs/workflow-runs.service';
import { QueueService } from '../queue/queue.service';
import { CreateWorkflowDto, UpdateWorkflowDto, TriggerWorkflowRunDto } from '@repo/shared-types';

@Controller('workflows')
export class WorkflowsController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly runsService: WorkflowRunsService,
    private readonly queueService: QueueService,
  ) {}

  @Post()
  async create(@Body() dto: CreateWorkflowDto) {
    return this.workflowsService.create(dto);
  }

  @Get()
  async findAll() {
    return this.workflowsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.workflowsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateWorkflowDto) {
    return this.workflowsService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.workflowsService.delete(id);
  }

  @Post(':id/trigger')
  async triggerRun(@Param('id') id: string, @Body() body: TriggerWorkflowRunDto) {
    // 1. Verify workflow exists
    await this.workflowsService.findOne(id);

    // 2. Create pending run record in DB
    const inputPayload = body.input || {};
    const run = await this.runsService.createRun(id, inputPayload);

    // 3. Dispatch run job to async queue
    await this.queueService.enqueueWorkflowRun(run.id, id, inputPayload);

    return {
      runId: run.id,
      workflowId: id,
      status: run.status,
      message: 'Workflow execution triggered asynchronously',
    };
  }

  @Get(':id/runs')
  async getWorkflowRuns(@Param('id') id: string) {
    return this.runsService.getWorkflowRuns(id);
  }
}
