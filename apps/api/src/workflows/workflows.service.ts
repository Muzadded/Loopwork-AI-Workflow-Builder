import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowDto, UpdateWorkflowDto, WorkflowDefinition } from '@repo/shared-types';

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkflowDto) {
    const definitionString = JSON.stringify(dto.definition);
    const created = await this.prisma.workflow.create({
      data: {
        name: dto.name,
        definition: definitionString,
      },
    });

    this.logger.log(`Created Workflow [${created.id}] - "${created.name}"`);

    return {
      ...created,
      definition: dto.definition,
    };
  }

  async findAll() {
    const workflows = await this.prisma.workflow.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return workflows.map((w) => ({
      id: w.id,
      name: w.name,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    }));
  }

  async findOne(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    let parsedDefinition: WorkflowDefinition;
    try {
      parsedDefinition = JSON.parse(workflow.definition);
    } catch {
      parsedDefinition = { id: workflow.id, name: workflow.name, nodes: [], edges: [] };
    }

    return {
      id: workflow.id,
      name: workflow.name,
      definition: parsedDefinition,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString(),
    };
  }

  async update(id: string, dto: UpdateWorkflowDto) {
    await this.findOne(id);

    const updated = await this.prisma.workflow.update({
      where: { id },
      data: {
        name: dto.name,
        definition: dto.definition ? JSON.stringify(dto.definition) : undefined,
      },
    });

    this.logger.log(`Updated Workflow [${id}]`);
    return this.findOne(id);
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.workflow.delete({ where: { id } });
    this.logger.log(`Deleted Workflow [${id}]`);
    return { success: true, id };
  }
}
