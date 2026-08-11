const MODEL_ALIASES: Record<string, string> = {
  'gemini 1.5 pro': 'gemini-2.5-pro',
  'gemini 1.5 flash': 'gemini-2.5-flash',
  'gemini 2.5 pro': 'gemini-2.5-pro',
  'gemini 2.5 flash': 'gemini-2.5-flash',
  'gemini-2.5-pro': 'gemini-2.5-pro',
  'gemini-2.5-flash': 'gemini-2.5-flash',
};

/** Maps UI-friendly model labels to Gemini API model IDs. */
export function normalizeGeminiModel(model?: string): string {
  if (!model) return 'gemini-2.5-flash';

  const normalized = model.trim().toLowerCase();
  if (MODEL_ALIASES[normalized]) return MODEL_ALIASES[normalized];
  if (normalized.startsWith('gemini-')) return normalized;

  return normalized.replace(/\s+/g, '-');
}
