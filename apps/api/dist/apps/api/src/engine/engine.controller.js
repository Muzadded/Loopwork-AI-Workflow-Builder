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
exports.EngineController = void 0;
const common_1 = require("@nestjs/common");
const workflow_engine_service_1 = require("./workflow-engine.service");
let EngineController = class EngineController {
    engineService;
    constructor(engineService) {
        this.engineService = engineService;
    }
    async testRun(body) {
        const input = body.initialInput || {
            ticket_id: 'TCK-8902',
            ticket_text: 'Urgent system outage on production database cluster! Server down.',
            submitted_by: 'alex@company.com',
        };
        const defaultWorkflow = {
            id: 'demo-workflow-01',
            name: 'Support Ticket AI Triage & Routing',
            nodes: [
                {
                    id: 'trigger_1',
                    type: 'trigger',
                    config: {},
                },
                {
                    id: 'llm_1',
                    type: 'llm',
                    config: {
                        prompt: `Classify the following customer ticket by urgency (urgent or normal) and include a confidence score (0 to 1). Ticket text: "{{input.ticket_text}}"`,
                        model: 'gemini-2.5-flash',
                        jsonOutput: true,
                        systemInstruction: 'You are an AI support classifier. Return JSON with keys: category, confidence, summary, reasoning.',
                    },
                },
                {
                    id: 'condition_1',
                    type: 'condition',
                    config: {
                        field: 'llm_1.category',
                        operator: 'equals',
                        value: 'urgent',
                    },
                },
                {
                    id: 'action_urgent',
                    type: 'action',
                    config: {
                        actionType: 'log',
                        url: 'https://httpbin.org/post',
                        method: 'POST',
                        body: {
                            status: 'ESCALATED',
                            reason: 'High urgency ticket detected by Gemini AI',
                            details: '{{llm_1.summary}}',
                        },
                    },
                },
                {
                    id: 'action_normal',
                    type: 'action',
                    config: {
                        actionType: 'log',
                        body: {
                            status: 'QUEUED',
                            reason: 'Standard priority workflow',
                        },
                    },
                },
            ],
            edges: [
                { id: 'e1', source: 'trigger_1', target: 'llm_1' },
                { id: 'e2', source: 'llm_1', target: 'condition_1' },
                { id: 'e3', source: 'condition_1', target: 'action_urgent', condition: 'true' },
                { id: 'e4', source: 'condition_1', target: 'action_normal', condition: 'false' },
            ],
        };
        const workflowToRun = body.workflow || defaultWorkflow;
        return this.engineService.executeWorkflow(workflowToRun, input);
    }
};
exports.EngineController = EngineController;
__decorate([
    (0, common_1.Post)('test-run'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EngineController.prototype, "testRun", null);
exports.EngineController = EngineController = __decorate([
    (0, common_1.Controller)('engine'),
    __metadata("design:paramtypes", [workflow_engine_service_1.WorkflowEngineService])
], EngineController);
//# sourceMappingURL=engine.controller.js.map