"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerAppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const ai_module_1 = require("./ai/ai.module");
const engine_module_1 = require("./engine/engine.module");
const queue_module_1 = require("./queue/queue.module");
const approvals_module_1 = require("./approvals/approvals.module");
let WorkerAppModule = class WorkerAppModule {
};
exports.WorkerAppModule = WorkerAppModule;
exports.WorkerAppModule = WorkerAppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '../../.env'],
            }),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            ai_module_1.AiModule,
            engine_module_1.EngineModule,
            approvals_module_1.ApprovalsModule,
            queue_module_1.QueueModule.forWorker(),
        ],
    })
], WorkerAppModule);
//# sourceMappingURL=worker-app.module.js.map