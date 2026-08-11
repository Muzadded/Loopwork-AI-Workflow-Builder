import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalItem, ResolveApprovalDto } from '@repo/shared-types';

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createApproval(runId: string, nodeId: string, payload: Record<string, any> = {}) {
    const approval = await this.prisma.approval.create({
      data: {
        runId,
        nodeId,
        status: 'pending',
        payload: JSON.stringify(payload),
      },
    });

    this.logger.log(`Created Pending Approval [${approval.id}] for Run [${runId}], Node [${nodeId}]`);
    return approval;
  }

  async findPending(): Promise<ApprovalItem[]> {
    const approvals = await this.prisma.approval.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });

    return approvals.map((a) => {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(a.payload);
      } catch {}

      return {
        id: a.id,
        runId: a.runId,
        nodeId: a.nodeId,
        status: a.status as any,
        payload: parsedPayload,
        createdAt: a.createdAt.toISOString(),
        resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
      };
    });
  }

  async findOne(id: string): Promise<ApprovalItem> {
    const approval = await this.prisma.approval.findUnique({
      where: { id },
    });

    if (!approval) {
      throw new NotFoundException(`Approval with ID ${id} not found`);
    }

    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(approval.payload);
    } catch {}

    return {
      id: approval.id,
      runId: approval.runId,
      nodeId: approval.nodeId,
      status: approval.status as any,
      payload: parsedPayload,
      createdAt: approval.createdAt.toISOString(),
      resolvedAt: approval.resolvedAt ? approval.resolvedAt.toISOString() : null,
    };
  }

  async resolveApproval(id: string, dto: ResolveApprovalDto) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.approval.update({
      where: { id },
      data: {
        status: dto.status,
        resolvedAt: new Date(),
      },
    });

    this.logger.log(`Resolved Approval [${id}] => ${dto.status} (Feedback: "${dto.userFeedback || 'None'}")`);

    // Update parent WorkflowRun status
    const runStatus = dto.status === 'approved' ? 'completed' : 'failed';
    await this.prisma.workflowRun.update({
      where: { id: existing.runId },
      data: {
        status: runStatus,
        finishedAt: new Date(),
      },
    });

    return this.findOne(id);
  }
}
