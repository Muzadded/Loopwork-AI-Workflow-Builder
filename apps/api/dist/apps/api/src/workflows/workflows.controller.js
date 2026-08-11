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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsController = void 0;
const common_1 = require("@nestjs/common");
const workflows_service_1 = require("./workflows.service");
const workflow_runs_service_1 = require("../runs/workflow-runs.service");
const queue_service_1 = require("../queue/queue.service");
let WorkflowsController = class WorkflowsController {
    workflowsService;
    runsService;
    queueService;
    constructor(workflowsService, runsService, queueService) {
        this.workflowsService = workflowsService;
        this.runsService = runsService;
        this.queueService = queueService;
    }
    async create(dto) {
        return this.workflowsService.create(dto);
    }
    async findAll() {
        return this.workflowsService.findAll();
    }
    async findOne(id) {
        return this.workflowsService.findOne(id);
    }
    async update(id, dto) {
        return this.workflowsService.update(id, dto);
    }
    async delete(id) {
        return this.workflowsService.delete(id);
    }
    async triggerRun(id, body) {
        await this.workflowsService.findOne(id);
        const inputPayload = body.input || {};
        const run = await this.runsService.createRun(id, inputPayload);
        await this.queueService.enqueueWorkflowRun(run.id, id, inputPayload);
        return {
            runId: run.id,
            workflowId: id,
            status: run.status,
            message: 'Workflow execution triggered asynchronously',
        };
    }
    async getWorkflowRuns(id) {
        return this.runsService.getWorkflowRuns(id);
    }
};
exports.WorkflowsController = WorkflowsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/trigger'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "triggerRun", null);
__decorate([
    (0, common_1.Get)(':id/runs'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getWorkflowRuns", null);
exports.WorkflowsController = WorkflowsController = __decorate([
    (0, common_1.Controller)('workflows'),
    __metadata("design:paramtypes", [workflows_service_1.WorkflowsService,
        workflow_runs_service_1.WorkflowRunsService,
        queue_service_1.QueueService])
], WorkflowsController);
//# sourceMappingURL=workflows.controller.js.map