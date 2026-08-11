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
const CONFIDENCE_INSTRUCTION = 'Always respond with valid JSON including a numeric confidence field (0-1) reflecting your certainty.';
const FLASH_MODEL = 'gemini-2.5-flash';
const PRO_MODEL = 'gemini-2.5-pro';
let LlmNodeExecutor = LlmNodeExecutor_1 = class LlmNodeExecutor {
    geminiProvider;
    logger = new common_1.Logger(LlmNodeExecutor_1.name);
    constructor(geminiProvider) {
        this.geminiProvider = geminiProvider;
    }
    async execute(node, context) {
        const startTime = Date.now();
        const rawConfig = node.config;
        const config = (0, llm_config_1.resolveLlmNodeConfig)(rawConfig);
        const enableTiered = rawConfig.enableTieredFallback !== false;
        if (!config.prompt.trim()) {
            return {
                nodeId: node.id,
                nodeType: 'llm',
                input: { model: config.model },
                status: 'failed',
                error: 'LLM node requires a prompt',
                latencyMs: Date.now() - startTime,
            };
        }
        const interpolatedPrompt = (0, template_interpolator_1.interpolateTemplate)(config.prompt, context);
        const systemInstruction = [config.systemInstruction, CONFIDENCE_INSTRUCTION]
            .filter(Boolean)
            .join('\n');
        const tiers = enableTiered
            ? config.model === PRO_MODEL
                ? [PRO_MODEL]
                : [FLASH_MODEL, PRO_MODEL]
            : [config.model];
        let lastError;
        let totalTokens = 0;
        let totalCost = 0;
        const attempts = [];
        for (let i = 0; i < tiers.length; i++) {
            const model = tiers[i];
            const isRetry = i > 0;
            if (isRetry) {
                this.logger.warn(`LLM Node [${node.id}] escalating to tier "${model}"`);
                attempts.push({ model, status: 'retrying' });
            }
            try {
                const response = await this.geminiProvider.complete(interpolatedPrompt, {
                    model,
                    jsonOutput: config.jsonOutput,
                    systemInstruction,
                });
                totalTokens += response.tokensUsed ?? 0;
                totalCost += response.costUsd ?? 0;
                const parsed = (response.json || { text: response.text });
                const outputData = {
                    ...parsed,
                    modelTier: response.modelUsed,
                    escalated: isRetry,
                };
                const confidence = Number(parsed.confidence);
                const threshold = Number(rawConfig.confidenceThreshold ?? 0);
                const shouldEscalate = enableTiered &&
                    i < tiers.length - 1 &&
                    !Number.isNaN(confidence) &&
                    threshold > 0 &&
                    confidence < threshold;
                if (shouldEscalate) {
                    attempts.push({ model, status: 'low_confidence', confidence });
                    continue;
                }
                attempts.push({ model, status: 'success', confidence: Number.isNaN(confidence) ? undefined : confidence });
                return {
                    nodeId: node.id,
                    nodeType: 'llm',
                    input: {
                        prompt: interpolatedPrompt,
                        model: response.modelUsed,
                        tiersAttempted: attempts,
                    },
                    output: outputData,
                    status: 'success',
                    latencyMs: Date.now() - startTime,
                    tokensUsed: totalTokens,
                    costUsd: totalCost,
                };
            }
            catch (err) {
                lastError = err instanceof Error ? err.message : String(err);
                attempts.push({ model, status: 'failed' });
                this.logger.warn(`LLM Node [${node.id}] tier "${model}" failed: ${lastError}`);
            }
        }
        return {
            nodeId: node.id,
            nodeType: 'llm',
            input: { prompt: interpolatedPrompt, tiersAttempted: attempts },
            status: 'failed',
            error: lastError || 'All model tiers failed',
            latencyMs: Date.now() - startTime,
            tokensUsed: totalTokens || undefined,
            costUsd: totalCost || undefined,
        };
    }
};
exports.LlmNodeExecutor = LlmNodeExecutor;
exports.LlmNodeExecutor = LlmNodeExecutor = LlmNodeExecutor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gemini_provider_service_1.GeminiProviderService])
], LlmNodeExecutor);
//# sourceMappingURL=llm-node.executor.js.map