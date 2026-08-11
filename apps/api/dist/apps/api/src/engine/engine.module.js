"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineModule = void 0;
const common_1 = require("@nestjs/common");
const ai_module_1 = require("../ai/ai.module");
const approvals_module_1 = require("../approvals/approvals.module");
const trigger_node_executor_1 = require("./nodes/trigger-node.executor");
const llm_node_executor_1 = require("./nodes/llm-node.executor");
const condition_node_executor_1 = require("./nodes/condition-node.executor");
const action_node_executor_1 = require("./nodes/action-node.executor");
const approval_node_executor_1 = require("./nodes/approval-node.executor");
const node_executor_registry_1 = require("./nodes/node-executor.registry");
const workflow_engine_service_1 = require("./workflow-engine.service");
const engine_controller_1 = require("./engine.controller");
let EngineModule = class EngineModule {
};
exports.EngineModule = EngineModule;
exports.EngineModule = EngineModule = __decorate([
    (0, common_1.Module)({
        imports: [ai_module_1.AiModule, (0, common_1.forwardRef)(() => approvals_module_1.ApprovalsModule)],
        providers: [
            trigger_node_executor_1.TriggerNodeExecutor,
            llm_node_executor_1.LlmNodeExecutor,
            condition_node_executor_1.ConditionNodeExecutor,
            action_node_executor_1.ActionNodeExecutor,
            approval_node_executor_1.ApprovalNodeExecutor,
            node_executor_registry_1.NodeExecutorRegistry,
            workflow_engine_service_1.WorkflowEngineService,
        ],
        controllers: [engine_controller_1.EngineController],
        exports: [workflow_engine_service_1.WorkflowEngineService],
    })
], EngineModule);
//# sourceMappingURL=engine.module.js.map