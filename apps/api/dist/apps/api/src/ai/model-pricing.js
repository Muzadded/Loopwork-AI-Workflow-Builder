"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_PRICING = void 0;
exports.estimateCostUsd = estimateCostUsd;
exports.MODEL_PRICING = {
    'gemini-2.5-flash': { input: 0.000000075, output: 0.0000003 },
    'gemini-2.5-pro': { input: 0.00000035, output: 0.00000105 },
};
function estimateCostUsd(model, promptTokens, candidateTokens) {
    const rates = exports.MODEL_PRICING[model] ?? exports.MODEL_PRICING['gemini-2.5-flash'];
    return promptTokens * rates.input + candidateTokens * rates.output;
}
//# sourceMappingURL=model-pricing.js.map