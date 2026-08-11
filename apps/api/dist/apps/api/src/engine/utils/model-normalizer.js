"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeGeminiModel = normalizeGeminiModel;
const MODEL_ALIASES = {
    'gemini 1.5 pro': 'gemini-2.5-pro',
    'gemini 1.5 flash': 'gemini-2.5-flash',
    'gemini 2.5 pro': 'gemini-2.5-pro',
    'gemini 2.5 flash': 'gemini-2.5-flash',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.5-flash': 'gemini-2.5-flash',
};
function normalizeGeminiModel(model) {
    if (!model)
        return 'gemini-2.5-flash';
    const normalized = model.trim().toLowerCase();
    if (MODEL_ALIASES[normalized])
        return MODEL_ALIASES[normalized];
    if (normalized.startsWith('gemini-'))
        return normalized;
    return normalized.replace(/\s+/g, '-');
}
//# sourceMappingURL=model-normalizer.js.map