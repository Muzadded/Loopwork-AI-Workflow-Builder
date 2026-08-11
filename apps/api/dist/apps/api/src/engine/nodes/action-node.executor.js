"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ActionNodeExecutor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionNodeExecutor = void 0;
const common_1 = require("@nestjs/common");
const template_interpolator_1 = require("../utils/template-interpolator");
let ActionNodeExecutor = ActionNodeExecutor_1 = class ActionNodeExecutor {
    logger = new common_1.Logger(ActionNodeExecutor_1.name);
    async execute(node, context) {
        const startTime = Date.now();
        const config = node.config;
        const actionType = config.actionType || 'log';
        this.logger.log(`Executing Action Node [${node.id}] (Type: ${actionType})`);
        if (actionType === 'http' && config.url) {
            const interpolatedUrl = (0, template_interpolator_1.interpolateTemplate)(config.url, context);
            const method = config.method || 'POST';
            try {
                const interpolatedBody = {};
                if (config.body) {
                    for (const [key, val] of Object.entries(config.body)) {
                        interpolatedBody[key] = typeof val === 'string' ? (0, template_interpolator_1.interpolateTemplate)(val, context) : val;
                    }
                }
                else {
                    Object.assign(interpolatedBody, context.nodeOutputs);
                }
                this.logger.log(`HTTP Action [${node.id}] ${method} -> ${interpolatedUrl}`);
                let fetchResult = { status: 200, statusText: 'OK', sentPayload: interpolatedBody };
                if (interpolatedUrl.startsWith('http')) {
                    const response = await fetch(interpolatedUrl, {
                        method,
                        headers: { 'Content-Type': 'application/json', ...config.headers },
                        body: method !== 'GET' ? JSON.stringify(interpolatedBody) : undefined,
                    });
                    const responseData = await response.json().catch(() => ({ status: response.statusText }));
                    fetchResult = { status: response.status, statusText: response.statusText, ...responseData };
                }
                return {
                    nodeId: node.id,
                    nodeType: 'action',
                    input: { url: interpolatedUrl, method, body: interpolatedBody },
                    output: fetchResult,
                    status: 'success',
                    latencyMs: Date.now() - startTime,
                };
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                return {
                    nodeId: node.id,
                    nodeType: 'action',
                    input: { url: config.url, method: config.method },
                    status: 'failed',
                    error: errorMessage,
                    latencyMs: Date.now() - startTime,
                };
            }
        }
        const logData = {
            timestamp: new Date().toISOString(),
            nodeId: node.id,
            executedAction: 'CONSOLE_LOG',
            contextData: { ...context.nodeOutputs },
        };
        this.logger.log(`Action Node [${node.id}] Logged Output: ${JSON.stringify(logData)}`);
        return {
            nodeId: node.id,
            nodeType: 'action',
            input: { actionType: 'log' },
            output: logData,
            status: 'success',
            latencyMs: Date.now() - startTime,
        };
    }
};
exports.ActionNodeExecutor = ActionNodeExecutor;
exports.ActionNodeExecutor = ActionNodeExecutor = ActionNodeExecutor_1 = __decorate([
    (0, common_1.Injectable)()
], ActionNodeExecutor);
//# sourceMappingURL=action-node.executor.js.map