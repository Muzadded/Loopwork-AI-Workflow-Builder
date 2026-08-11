/** Approximate USD cost per token (input / output) by Gemini model id. */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.5-flash': { input: 0.000000075, output: 0.0000003 },
  'gemini-2.5-pro': { input: 0.00000035, output: 0.00000105 },
};

export function estimateCostUsd(
  model: string,
  promptTokens: number,
  candidateTokens: number,
): number {
  const rates = MODEL_PRICING[model] ?? MODEL_PRICING['gemini-2.5-flash'];
  return promptTokens * rates.input + candidateTokens * rates.output;
}
