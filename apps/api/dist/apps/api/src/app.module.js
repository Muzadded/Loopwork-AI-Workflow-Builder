"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const health_module_1 = require("./health/health.module");
const ai_module_1 = require("./ai/ai.module");
const engine_module_1 = require("./engine/engine.module");
const queue_module_1 = require("./queue/queue.module");
const workflows_module_1 = require("./workflows/workflows.module");
const runs_module_1 = require("./runs/runs.module");
const approvals_module_1 = require("./approvals/approvals.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '../../.env'],
            }),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            health_module_1.HealthModule,
            ai_module_1.AiModule,
            engine_module_1.EngineModule,
            queue_module_1.QueueModule.forApi(),
            workflows_module_1.WorkflowsModule,
            runs_module_1.RunsModule,
            approvals_module_1.ApprovalsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map