"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ApprovalNodeExecutor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalNodeExecutor = void 0;
const common_1 = require("@nestjs/common");
const template_interpolator_1 = require("../utils/template-interpolator");
let ApprovalNodeExecutor = ApprovalNodeExecutor_1 = class ApprovalNodeExecutor {
    logger = new common_1.Logger(ApprovalNodeExecutor_1.name);
    async execute(node, context) {
        const startTime = Date.now();
        const config = node.config;
        const rawMessage = config.message || 'Action requires human approval before proceeding.';
        const interpolatedMessage = (0, template_interpolator_1.interpolateTemplate)(rawMessage, context);
        this.logger.log(`Executing Approval Node [${node.id}] - Awaiting Human Decision`);
        return {
            nodeId: node.id,
            nodeType: 'approval',
            input: { message: interpolatedMessage, assigneeRole: config.assigneeRole || 'admin' },
            output: {
                requiresApproval: true,
                message: interpolatedMessage,
                assigneeRole: config.assigneeRole || 'admin',
                contextSnapshot: { ...context.nodeOutputs },
            },
            status: 'success',
            latencyMs: Date.now() - startTime,
        };
    }
};
exports.ApprovalNodeExecutor = ApprovalNodeExecutor;
exports.ApprovalNodeExecutor = ApprovalNodeExecutor = ApprovalNodeExecutor_1 = __decorate([
    (0, common_1.Injectable)()
], ApprovalNodeExecutor);
//# sourceMappingURL=approval-node.executor.js.map