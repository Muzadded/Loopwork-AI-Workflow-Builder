import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAiProvider } from './ai-provider.interface';
import { AiOptions, AiResponse } from '@repo/shared-types';
import { normalizeGeminiModel } from '../engine/utils/model-normalizer';
import { estimateCostUsd } from './model-pricing';

const PLACEHOLDER_KEYS = new Set([
  'your_key_here',
  'your_gemini_api_key_here',
  'mock_gemini_key_for_dev',
]);

@Injectable()
export class GeminiProviderService implements IAiProvider {
  private readonly logger = new Logger(GeminiProviderService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private readonly mockModeEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const isProduction = process.env.NODE_ENV === 'production';
    const allowMock = this.configService.get<string>('GEMINI_MOCK') === 'true';
    const hasRealKey = Boolean(apiKey && !PLACEHOLDER_KEYS.has(apiKey));

    this.mockModeEnabled = !isProduction && (allowMock || !hasRealKey);

    if (hasRealKey) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey!);
        this.logger.log('Initialized Google Gemini AI SDK provider');
      } catch (err) {
        this.logger.warn(`Failed to initialize GoogleGenerativeAI: ${err}`);
      }
    } else if (this.mockModeEnabled) {
      this.logger.log('GEMINI_API_KEY not configured — using development mock responses');
    } else {
      this.logger.error('GEMINI_API_KEY is required in production');
    }
  }

  async complete(prompt: string, options: AiOptions = {}): Promise<AiResponse> {
    const modelName = normalizeGeminiModel(options.model);

    if (this.genAI) {
      try {
        return await this.callGeminiApi(prompt, modelName, options);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!this.mockModeEnabled) {
          throw new Error(`Gemini API call failed: ${message}`);
        }
        this.logger.warn(`Gemini API call failed (${message}). Falling back to dev mock.`);
      }
    }

    if (!this.mockModeEnabled) {
      throw new Error(
        'Gemini provider is not configured. Set GEMINI_API_KEY or enable GEMINI_MOCK=true in development.',
      );
    }

    return this.completeWithMock(prompt, modelName, options);
  }

  private async callGeminiApi(
    prompt: string,
    modelName: string,
    options: AiOptions,
  ): Promise<AiResponse> {
    const model = this.genAI!.getGenerativeModel({
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

    const costUsd = estimateCostUsd(modelName, promptTokens, candidateTokens);

    let parsedJson: Record<string, any> | undefined;
    if (options.jsonOutput) {
      try {
        parsedJson = JSON.parse(responseText);
      } catch {
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

  private async completeWithMock(
    prompt: string,
    modelName: string,
    options: AiOptions,
  ): Promise<AiResponse> {
    const promptLower = prompt.toLowerCase();
    const mockLatency = 150;
    await new Promise((r) => setTimeout(r, mockLatency));

    let mockText = 'Sample generated response from AI provider.';
    let mockJson: Record<string, any> = { result: 'processed', confidence: 0.95 };

    if (promptLower.includes('urgency') || promptLower.includes('ticket') || promptLower.includes('classify')) {
      const isUrgent =
        promptLower.includes('urgent') ||
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
    } else if (promptLower.includes('summary') || promptLower.includes('summarize')) {
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
}
