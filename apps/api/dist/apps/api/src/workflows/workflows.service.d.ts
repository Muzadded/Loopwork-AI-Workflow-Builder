import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowDto, UpdateWorkflowDto, WorkflowDefinition } from "@repo/shared-types";
export declare class WorkflowsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateWorkflowDto): Promise<{
        definition: WorkflowDefinition;
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        definition: WorkflowDefinition;
        createdAt: string;
        updatedAt: string;
    }>;
    update(id: string, dto: UpdateWorkflowDto): Promise<{
        id: string;
        name: string;
        definition: WorkflowDefinition;
        createdAt: string;
        updatedAt: string;
    }>;
    delete(id: string): Promise<{
        success: boolean;
        id: string;
    }>;
}
