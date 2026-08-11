"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var QueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const redis_service_1 = require("../redis/redis.service");
const workflow_runs_service_1 = require("../runs/workflow-runs.service");
const workflows_service_1 = require("../workflows/workflows.service");
const workflow_engine_service_1 = require("../engine/workflow-engine.service");
let QueueService = QueueService_1 = class QueueService {
    redisService;
    runsService;
    workflowsService;
    engineService;
    logger = new common_1.Logger(QueueService_1.name);
    queue = null;
    constructor(redisService, runsService, workflowsService, engineService) {
        this.redisService = redisService;
        this.runsService = runsService;
        this.workflowsService = workflowsService;
        this.engineService = engineService;
    }
    async onModuleInit() {
        try {
            const client = this.redisService.getClient();
            if (this.redisService.isUsingRealClient()) {
                this.queue = new bullmq_1.Queue('workflow-execution', {
                    connection: client,
                });
                this.logger.log('Initialized BullMQ Queue "workflow-execution"');
            }
            else {
                this.logger.log('Running QueueService in Async In-Memory fallback mode (Dev Redis Mock)');
            }
        }
        catch (err) {
            this.logger.warn(`Failed to initialize BullMQ queue: ${err}`);
        }
    }
    async onModuleDestroy() {
        if (this.queue) {
            await this.queue.close();
        }
    }
    async enqueueWorkflowRun(runId, workflowId, initialInput = {}) {
        this.logger.log(`Enqueuing Workflow Run [${runId}] for Workflow [${workflowId}]`);
        if (this.queue) {
            await this.queue.add('execute-workflow', { runId, workflowId, initialInput }, {
                jobId: runId,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
                removeOnComplete: 100,
                removeOnFail: 500,
            });
            return;
        }
        setImmediate(async () => {
            await this.processJobDirectly({ runId, workflowId, initialInput });
        });
    }
    async processJobDirectly(data) {
        const { runId, workflowId, initialInput } = data;
        this.logger.log(`Processing Workflow Execution Job for Run [${runId}]`);
        try {
            const workflow = await this.workflowsService.findOne(workflowId);
            await this.runsService.updateRunStatus(runId, 'running');
            const result = await this.engineService.executeWorkflow(workflow.definition, initialInput, runId);
            for (const step of result.executionTrace) {
                await this.runsService.recordStepResult(runId, step);
            }
            await this.runsService.updateRunStatus(runId, result.status, new Date(), result.totalCostUsd);
            this.logger.log(`Finished processing Job for Run [${runId}] with status "${result.status}"`);
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            this.logger.error(`Job processing failed for Run [${runId}]: ${errorMsg}`);
            await this.runsService.updateRunStatus(runId, 'failed', new Date());
        }
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = QueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        workflow_runs_service_1.WorkflowRunsService,
        workflows_service_1.WorkflowsService,
        workflow_engine_service_1.WorkflowEngineService])
], QueueService);
//# sourceMappingURL=queue.service.js.map