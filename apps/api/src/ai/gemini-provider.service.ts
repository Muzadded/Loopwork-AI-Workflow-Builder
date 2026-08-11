import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAiProvider } from './ai-provider.interface';
import { AiOptions, AiResponse } from '@repo/shared-types';

@Injectable()
export class GeminiProviderService implements IAiProvider {
  private readonly logger = new Logger(GeminiProviderService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'your_key_here' && apiKey !== 'your_gemini_api_key_here' && apiKey !== 'mock_gemini_key_for_dev') {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.logger.log('Initialized Google Gemini AI SDK provider');
      } catch (err) {
        this.logger.warn(`Failed to initialize GoogleGenerativeAI: ${err}`);
      }
    } else {
      this.logger.log('No production GEMINI_API_KEY configured. Running GeminiProviderService with intelligent development fallback mode.');
    }
  }

  async complete(prompt: string, options: AiOptions = {}): Promise<AiResponse> {
    const startTime = Date.now();
    const modelName = options.model || 'gemini-2.5-flash';

    if (this.genAI) {
      try {
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

        // Pricing estimate (Flash model rate)
        const costUsd = (promptTokens * 0.000000075) + (candidateTokens * 0.0000003);

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
      } catch (err) {
        this.logger.warn(`Gemini API call failed (${err instanceof Error ? err.message : err}). Escalating/falling back to dev mock execution.`);
      }
    }

    // Development Mock Logic (Intelligent Mocking for Testing Workflow Traces)
    const promptLower = prompt.toLowerCase();
    const mockLatency = 150;
    await new Promise((r) => setTimeout(r, mockLatency));

    let mockText = 'Sample generated response from AI provider.';
    let mockJson: Record<string, any> = { result: 'processed', confidence: 0.95 };

    if (promptLower.includes('urgency') || promptLower.includes('ticket') || promptLower.includes('classify')) {
      const isUrgent = promptLower.includes('urgent') || promptLower.includes('critical') || promptLower.includes('error') || promptLower.includes('fail');
      mockJson = {
        category: isUrgent ? 'urgent' : 'normal',
        confidence: isUrgent ? 0.92 : 0.88,
        summary: `Classified ticket as ${isUrgent ? 'urgent' : 'normal'}.`,
        reasoning: `Extracted key priority flags from input text.`,
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
