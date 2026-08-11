import { Injectable, Logger } from '@nestjs/common';
import { INodeExecutor } from './node-executor.interface';
import { WorkflowNode, ExecutionContext, RunStepResult, LlmNodeConfig } from '@repo/shared-types';
import { GeminiProviderService } from '../../ai/gemini-provider.service';
import { resolveLlmNodeConfig } from '../utils/llm-config';
import { interpolateTemplate } from '../utils/template-interpolator';

const CONFIDENCE_INSTRUCTION =
  'Always respond with valid JSON including a numeric confidence field (0-1) reflecting your certainty.';

const FLASH_MODEL = 'gemini-2.5-flash';
const PRO_MODEL = 'gemini-2.5-pro';

@Injectable()
export class LlmNodeExecutor implements INodeExecutor {
  private readonly logger = new Logger(LlmNodeExecutor.name);

  constructor(private readonly geminiProvider: GeminiProviderService) {}

  async execute(node: WorkflowNode, context: ExecutionContext): Promise<RunStepResult> {
    const startTime = Date.now();
    const rawConfig = node.config as LlmNodeConfig;
    const config = resolveLlmNodeConfig(rawConfig);
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

    const interpolatedPrompt = interpolateTemplate(config.prompt, context);
    const systemInstruction = [config.systemInstruction, CONFIDENCE_INSTRUCTION]
      .filter(Boolean)
      .join('\n');

    const tiers = enableTiered
      ? config.model === PRO_MODEL
        ? [PRO_MODEL]
        : [FLASH_MODEL, PRO_MODEL]
      : [config.model];

    let lastError: string | undefined;
    let totalTokens = 0;
    let totalCost = 0;
    const attempts: { model: string; status: string; confidence?: number }[] = [];

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

        const parsed = (response.json || { text: response.text }) as Record<string, unknown>;
        const outputData: Record<string, unknown> = {
          ...parsed,
          modelTier: response.modelUsed,
          escalated: isRetry,
        };

        const confidence = Number(parsed.confidence);
        const threshold = Number(rawConfig.confidenceThreshold ?? 0);
        const shouldEscalate =
          enableTiered &&
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
      } catch (err) {
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
}
