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
var GeminiProviderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProviderService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const generative_ai_1 = require("@google/generative-ai");
const model_normalizer_1 = require("../engine/utils/model-normalizer");
const PLACEHOLDER_KEYS = new Set([
    'your_key_here',
    'your_gemini_api_key_here',
    'mock_gemini_key_for_dev',
]);
let GeminiProviderService = GeminiProviderService_1 = class GeminiProviderService {
    configService;
    logger = new common_1.Logger(GeminiProviderService_1.name);
    genAI = null;
    mockModeEnabled;
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('GEMINI_API_KEY');
        const isProduction = process.env.NODE_ENV === 'production';
        const allowMock = this.configService.get('GEMINI_MOCK') === 'true';
        const hasRealKey = Boolean(apiKey && !PLACEHOLDER_KEYS.has(apiKey));
        this.mockModeEnabled = !isProduction && (allowMock || !hasRealKey);
        if (hasRealKey) {
            try {
                this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
                this.logger.log('Initialized Google Gemini AI SDK provider');
            }
            catch (err) {
                this.logger.warn(`Failed to initialize GoogleGenerativeAI: ${err}`);
            }
        }
        else if (this.mockModeEnabled) {
            this.logger.log('GEMINI_API_KEY not configured — using development mock responses');
        }
        else {
            this.logger.error('GEMINI_API_KEY is required in production');
        }
    }
    async complete(prompt, options = {}) {
        const modelName = (0, model_normalizer_1.normalizeGeminiModel)(options.model);
        if (this.genAI) {
            try {
                return await this.callGeminiApi(prompt, modelName, options);
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                if (!this.mockModeEnabled) {
                    throw new Error(`Gemini API call failed: ${message}`);
                }
                this.logger.warn(`Gemini API call failed (${message}). Falling back to dev mock.`);
            }
        }
        if (!this.mockModeEnabled) {
            throw new Error('Gemini provider is not configured. Set GEMINI_API_KEY or enable GEMINI_MOCK=true in development.');
        }
        return this.completeWithMock(prompt, modelName, options);
    }
    async callGeminiApi(prompt, modelName, options) {
        const model = this.genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: options.systemInstruction,
            generationConfig: options.jsonOutput
                ? { responseMimeType: 'application/json' }
                : undefined,
        });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const usage = result.response.usageMetadata;
        const promptTokens = usage?.promptTokenCount || Math.ceil(prompt.length / 4);
        const candidateTokens = usage?.candidatesTokenCount || Math.ceil(responseText.length / 4);
        const totalTokens = promptTokens + candidateTokens;
        const costUsd = promptTokens * 0.000000075 + candidateTokens * 0.0000003;
        let parsedJson;
        if (options.jsonOutput) {
            try {
                parsedJson = JSON.parse(responseText);
            }
            catch {
                this.logger.warn('Failed to parse JSON response from Gemini model');
            }
        }
        return {
            text: responseText,
            json: parsedJson,
            tokensUsed: totalTokens,
            promptTokens,
            candidateTokens,
            costUsd,
            modelUsed: modelName,
        };
    }
    async completeWithMock(prompt, modelName, options) {
        const promptLower = prompt.toLowerCase();
        const mockLatency = 150;
        await new Promise((r) => setTimeout(r, mockLatency));
        let mockText = 'Sample generated response from AI provider.';
        let mockJson = { result: 'processed', confidence: 0.95 };
        if (promptLower.includes('urgency') || promptLower.includes('ticket') || promptLower.includes('classify')) {
            const isUrgent = promptLower.includes('urgent') ||
                promptLower.includes('critical') ||
                promptLower.includes('error') ||
                promptLower.includes('fail') ||
                promptLower.includes('outage');
            mockJson = {
                category: isUrgent ? 'urgent' : 'normal',
                confidence: isUrgent ? 0.92 : 0.88,
                summary: `Classified ticket as ${isUrgent ? 'urgent' : 'normal'}.`,
                reasoning: 'Extracted key priority flags from input text.',
            };
            mockText = JSON.stringify(mockJson);
        }
        else if (promptLower.includes('summary') || promptLower.includes('summarize')) {
            mockJson = {
                summary: 'Key meeting points: API engine scaffolded, BullMQ integration complete.',
                actionItems: ['Deploy to Railway', 'Add React Flow UI'],
                confidence: 0.96,
            };
            mockText = JSON.stringify(mockJson);
        }
        const mockPromptTokens = Math.ceil(prompt.length / 4);
        const mockCandidateTokens = Math.ceil(mockText.length / 4);
        const mockTotalTokens = mockPromptTokens + mockCandidateTokens;
        const mockCost = mockTotalTokens * 0.0000001;
        return {
            text: mockText,
            json: options.jsonOutput ? mockJson : undefined,
            tokensUsed: mockTotalTokens,
            promptTokens: mockPromptTokens,
            candidateTokens: mockCandidateTokens,
            costUsd: mockCost,
            modelUsed: `${modelName}-dev-mock`,
        };
    }
};
exports.GeminiProviderService = GeminiProviderService;
exports.GeminiProviderService = GeminiProviderService = GeminiProviderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GeminiProviderService);
//# sourceMappingURL=gemini-provider.service.js.map