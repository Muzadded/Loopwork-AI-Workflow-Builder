"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var QueueModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const common_1 = require("@nestjs/common");
const redis_module_1 = require("../redis/redis.module");
const engine_module_1 = require("../engine/engine.module");
const prisma_module_1 = require("../prisma/prisma.module");
const queue_service_1 = require("./queue.service");
const workflow_execution_worker_1 = require("./workflow-execution.worker");
const workflows_service_1 = require("../workflows/workflows.service");
const workflow_runs_service_1 = require("../runs/workflow-runs.service");
const sharedProviders = [queue_service_1.QueueService, workflows_service_1.WorkflowsService, workflow_runs_service_1.WorkflowRunsService];
let QueueModule = QueueModule_1 = class QueueModule {
    static forApi() {
        return {
            module: QueueModule_1,
            imports: [redis_module_1.RedisModule, engine_module_1.EngineModule, prisma_module_1.PrismaModule],
            providers: sharedProviders,
            exports: [queue_service_1.QueueService, workflows_service_1.WorkflowsService, workflow_runs_service_1.WorkflowRunsService],
        };
    }
    static forWorker() {
        return {
            module: QueueModule_1,
            imports: [redis_module_1.RedisModule, engine_module_1.EngineModule, prisma_module_1.PrismaModule],
            providers: [...sharedProviders, workflow_execution_worker_1.WorkflowExecutionWorker],
            exports: [queue_service_1.QueueService, workflows_service_1.WorkflowsService, workflow_runs_service_1.WorkflowRunsService],
        };
    }
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = QueueModule_1 = __decorate([
    (0, common_1.Module)({})
], QueueModule);
//# sourceMappingURL=queue.module.js.map