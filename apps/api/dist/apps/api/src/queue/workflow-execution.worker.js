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
var WorkflowExecutionWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowExecutionWorker = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const redis_service_1 = require("../redis/redis.service");
const queue_service_1 = require("./queue.service");
let WorkflowExecutionWorker = WorkflowExecutionWorker_1 = class WorkflowExecutionWorker {
    redisService;
    queueService;
    logger = new common_1.Logger(WorkflowExecutionWorker_1.name);
    worker = null;
    constructor(redisService, queueService) {
        this.redisService = redisService;
        this.queueService = queueService;
    }
    async onModuleInit() {
        if (this.redisService.isUsingRealClient()) {
            const client = this.redisService.getClient();
            this.worker = new bullmq_1.Worker('workflow-execution', async (job) => {
                this.logger.log(`Worker received BullMQ Job ID [${job.id}] for Run [${job.data.runId}]`);
                await this.queueService.processJobDirectly(job.data);
            }, { connection: client, concurrency: 5 });
            this.worker.on('completed', (job) => {
                this.logger.log(`BullMQ Job [${job.id}] completed successfully`);
            });
            this.worker.on('failed', (job, err) => {
                this.logger.error(`BullMQ Job [${job?.id}] failed: ${err.message}`);
            });
            this.logger.log('Started BullMQ Worker for queue "workflow-execution"');
        }
    }
    async onModuleDestroy() {
        if (this.worker) {
            await this.worker.close();
        }
    }
};
exports.WorkflowExecutionWorker = WorkflowExecutionWorker;
exports.WorkflowExecutionWorker = WorkflowExecutionWorker = WorkflowExecutionWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        queue_service_1.QueueService])
], WorkflowExecutionWorker);
//# sourceMappingURL=workflow-execution.worker.js.map