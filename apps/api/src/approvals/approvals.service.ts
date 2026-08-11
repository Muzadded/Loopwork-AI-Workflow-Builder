import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalItem, ResolveApprovalDto } from '@repo/shared-types';
import { QueueService } from '../queue/queue.service';
import { WorkflowRunsService } from '../runs/workflow-runs.service';

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
    private readonly runsService: WorkflowRunsService,
  ) {}

  async createApproval(runId: string, nodeId: string, payload: Record<string, any> = {}) {
    const existing = await this.prisma.approval.findFirst({
      where: { runId, nodeId, status: 'pending' },
    });
    if (existing) {
      return existing;
    }

    const approval = await this.prisma.approval.create({
      data: {
        runId,
        nodeId,
        status: 'pending',
        payload: JSON.stringify(payload),
      },
    });

    this.logger.log(`Created Pending Approval [${approval.id}] for Run [${runId}], Node [${nodeId}]`);
    this.notifyApproval(approval.id, runId, nodeId, payload);
    return approval;
  }

  private notifyApproval(
    approvalId: string,
    runId: string,
    nodeId: string,
    payload: Record<string, any>,
  ) {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) return;

    const reason = payload.reason || 'Workflow requires human review';
    fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🔔 Approval needed: Run \`${runId.slice(0, 8)}\` at node \`${nodeId}\` — ${reason}`,
      }),
    }).catch((err) => this.logger.warn(`Slack notification failed: ${err}`));
  }

  async findPending(): Promise<ApprovalItem[]> {
    const approvals = await this.prisma.approval.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });

    return approvals.map((a) => this.mapApproval(a));
  }

  async findOne(id: string): Promise<ApprovalItem> {
    const approval = await this.prisma.approval.findUnique({ where: { id } });
    if (!approval) {
      throw new NotFoundException(`Approval with ID ${id} not found`);
    }
    return this.mapApproval(approval);
  }

  async resolveApproval(id: string, dto: ResolveApprovalDto) {
    const existing = await this.findOne(id);

    await this.prisma.approval.update({
      where: { id },
      data: { status: dto.status, resolvedAt: new Date() },
    });

    this.logger.log(`Resolved Approval [${id}] => ${dto.status}`);

    const run = await this.runsService.getRun(existing.runId);

    if (dto.status === 'rejected') {
      await this.runsService.updateRunStatus(existing.runId, 'failed', { finishedAt: new Date() });
      return this.findOne(id);
    }

    await this.runsService.updateRunStatus(existing.runId, 'running', { finishedAt: null });
    await this.queueService.enqueueWorkflowRun(existing.runId, run.workflowId, run.input);

    this.logger.log(`Re-enqueued Run [${existing.runId}] after approval [${id}]`);
    return this.findOne(id);
  }

  private mapApproval(a: {
    id: string;
    runId: string;
    nodeId: string;
    status: string;
    payload: string;
    createdAt: Date;
    resolvedAt: Date | null;
  }): ApprovalItem {
    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(a.payload);
    } catch {}

    return {
      id: a.id,
      runId: a.runId,
      nodeId: a.nodeId,
      status: a.status as ApprovalItem['status'],
      payload: parsedPayload,
      createdAt: a.createdAt.toISOString(),
      resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
    };
  }
}
