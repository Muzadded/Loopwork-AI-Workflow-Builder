import { LlmNodeConfig } from '@repo/shared-types';
import { normalizeGeminiModel } from './model-normalizer';

type LlmNodeConfigInput = LlmNodeConfig & { systemPrompt?: string };

/** Resolves prompt and model from node config, supporting legacy `systemPrompt` field. */
export function resolveLlmNodeConfig(config: LlmNodeConfigInput) {
  const prompt = config.prompt || config.systemPrompt || '';
  const model = normalizeGeminiModel(config.model);

  return {
    prompt,
    model,
    jsonOutput: config.jsonOutput !== false,
    systemInstruction: config.systemInstruction,
    confidenceThreshold: config.confidenceThreshold,
  };
}
