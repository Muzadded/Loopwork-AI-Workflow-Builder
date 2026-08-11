import { WorkflowsService } from './workflows.service';
import { WorkflowRunsService } from '../runs/workflow-runs.service';
import { QueueService } from '../queue/queue.service';
import { CreateWorkflowDto, UpdateWorkflowDto, TriggerWorkflowRunDto } from "@repo/shared-types";
export declare class WorkflowsController {
    private readonly workflowsService;
    private readonly runsService;
    private readonly queueService;
    constructor(workflowsService: WorkflowsService, runsService: WorkflowRunsService, queueService: QueueService);
    create(dto: CreateWorkflowDto): Promise<{
        definition: import("@repo/shared-types").WorkflowDefinition;
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
        definition: import("@repo/shared-types").WorkflowDefinition;
        createdAt: string;
        updatedAt: string;
    }>;
    update(id: string, dto: UpdateWorkflowDto): Promise<{
        id: string;
        name: string;
        definition: import("@repo/shared-types").WorkflowDefinition;
        createdAt: string;
        updatedAt: string;
    }>;
    delete(id: string): Promise<{
        success: boolean;
        id: string;
    }>;
    triggerRun(id: string, body: TriggerWorkflowRunDto): Promise<{
        runId: string;
        workflowId: string;
        status: string;
        message: string;
    }>;
    getWorkflowRuns(id: string): Promise<import("@repo/shared-types").WorkflowRunResponse[]>;
}
