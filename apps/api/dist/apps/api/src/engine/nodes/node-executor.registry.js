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
var NodeExecutorRegistry_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeExecutorRegistry = void 0;
const common_1 = require("@nestjs/common");
const trigger_node_executor_1 = require("./trigger-node.executor");
const llm_node_executor_1 = require("./llm-node.executor");
const condition_node_executor_1 = require("./condition-node.executor");
const action_node_executor_1 = require("./action-node.executor");
const approval_node_executor_1 = require("./approval-node.executor");
let NodeExecutorRegistry = NodeExecutorRegistry_1 = class NodeExecutorRegistry {
    triggerExecutor;
    llmExecutor;
    conditionExecutor;
    actionExecutor;
    approvalExecutor;
    logger = new common_1.Logger(NodeExecutorRegistry_1.name);
    executors = new Map();
    constructor(triggerExecutor, llmExecutor, conditionExecutor, actionExecutor, approvalExecutor) {
        this.triggerExecutor = triggerExecutor;
        this.llmExecutor = llmExecutor;
        this.conditionExecutor = conditionExecutor;
        this.actionExecutor = actionExecutor;
        this.approvalExecutor = approvalExecutor;
        this.executors.set('trigger', this.triggerExecutor);
        this.executors.set('llm', this.llmExecutor);
        this.executors.set('condition', this.conditionExecutor);
        this.executors.set('action', this.actionExecutor);
        this.executors.set('approval', this.approvalExecutor);
    }
    getExecutor(type) {
        const executor = this.executors.get(type);
        if (!executor) {
            throw new Error(`No executor registered for node type: ${type}`);
        }
        return executor;
    }
};
exports.NodeExecutorRegistry = NodeExecutorRegistry;
exports.NodeExecutorRegistry = NodeExecutorRegistry = NodeExecutorRegistry_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [trigger_node_executor_1.TriggerNodeExecutor,
        llm_node_executor_1.LlmNodeExecutor,
        condition_node_executor_1.ConditionNodeExecutor,
        action_node_executor_1.ActionNodeExecutor,
        approval_node_executor_1.ApprovalNodeExecutor])
], NodeExecutorRegistry);
//# sourceMappingURL=node-executor.registry.js.map