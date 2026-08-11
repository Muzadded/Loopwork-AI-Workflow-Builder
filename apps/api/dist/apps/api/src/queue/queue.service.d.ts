import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { WorkflowRunsService } from '../runs/workflow-runs.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { WorkflowEngineService } from '../engine/workflow-engine.service';
export interface WorkflowRunJobData {
    runId: string;
    workflowId: string;
    initialInput: Record<string, any>;
}
export declare class QueueService implements OnModuleInit, OnModuleDestroy {
    private readonly redisService;
    private readonly runsService;
    private readonly workflowsService;
    private readonly engineService;
    private readonly logger;
    private queue;
    constructor(redisService: RedisService, runsService: WorkflowRunsService, workflowsService: WorkflowsService, engineService: WorkflowEngineService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    enqueueWorkflowRun(runId: string, workflowId: string, initialInput?: Record<string, any>): Promise<void>;
    processJobDirectly(data: WorkflowRunJobData): Promise<void>;
}
