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
var LlmNodeExecutor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmNodeExecutor = void 0;
const common_1 = require("@nestjs/common");
const gemini_provider_service_1 = require("../../ai/gemini-provider.service");
const llm_config_1 = require("../utils/llm-config");
const template_interpolator_1 = require("../utils/template-interpolator");
let LlmNodeExecutor = LlmNodeExecutor_1 = class LlmNodeExecutor {
    geminiProvider;
    logger = new common_1.Logger(LlmNodeExecutor_1.name);
    constructor(geminiProvider) {
        this.geminiProvider = geminiProvider;
    }
    async execute(node, context) {
        const startTime = Date.now();
        const config = (0, llm_config_1.resolveLlmNodeConfig)(node.config);
        if (!config.prompt.trim()) {
            return {
                nodeId: node.id,
                nodeType: 'llm',
                input: { model: config.model },
                status: 'failed',
                error: 'LLM node requires a prompt (config.prompt or config.systemPrompt)',
                latencyMs: Date.now() - startTime,
            };
        }
        const interpolatedPrompt = (0, template_interpolator_1.interpolateTemplate)(config.prompt, context);
        this.logger.log(`Executing LLM Node [${node.id}] with model "${config.model}"`);
        try {
            const response = await this.geminiProvider.complete(interpolatedPrompt, {
                model: config.model,
                jsonOutput: config.jsonOutput,
                systemInstruction: config.systemInstruction,
            });
            const outputData = response.json || { text: response.text };
            return {
                nodeId: node.id,
                nodeType: 'llm',
                input: { prompt: interpolatedPrompt, model: response.modelUsed },
                output: outputData,
                status: 'success',
                latencyMs: Date.now() - startTime,
                tokensUsed: response.tokensUsed,
                costUsd: response.costUsd,
            };
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            this.logger.error(`LLM Node [${node.id}] failed: ${errorMessage}`);
            return {
                nodeId: node.id,
                nodeType: 'llm',
                input: { prompt: interpolatedPrompt, model: config.model },
                status: 'failed',
                error: errorMessage,
                latencyMs: Date.now() - startTime,
            };
        }
    }
};
exports.LlmNodeExecutor = LlmNodeExecutor;
exports.LlmNodeExecutor = LlmNodeExecutor = LlmNodeExecutor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gemini_provider_service_1.GeminiProviderService])
], LlmNodeExecutor);
//# sourceMappingURL=llm-node.executor.js.map