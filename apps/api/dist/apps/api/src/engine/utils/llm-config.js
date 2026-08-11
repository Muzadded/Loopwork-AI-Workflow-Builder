"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLlmNodeConfig = resolveLlmNodeConfig;
const model_normalizer_1 = require("./model-normalizer");
function resolveLlmNodeConfig(config) {
    const prompt = config.prompt || config.systemPrompt || '';
    const model = (0, model_normalizer_1.normalizeGeminiModel)(config.model);
    return {
        prompt,
        model,
        jsonOutput: config.jsonOutput !== false,
        systemInstruction: config.systemInstruction,
        confidenceThreshold: config.confidenceThreshold,
    };
}
//# sourceMappingURL=llm-config.js.map