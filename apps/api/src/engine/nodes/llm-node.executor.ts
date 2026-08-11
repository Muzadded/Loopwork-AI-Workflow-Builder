import { Injectable, Logger } from '@nestjs/common';
import { INodeExecutor } from './node-executor.interface';
import { WorkflowNode, ExecutionContext, RunStepResult, LlmNodeConfig } from '@repo/shared-types';
import { GeminiProviderService } from '../../ai/gemini-provider.service';
import { interpolateTemplate } from '../utils/template-interpolator';

@Injectable()
export class LlmNodeExecutor implements INodeExecutor {
  private readonly logger = new Logger(LlmNodeExecutor.name);

  constructor(private readonly geminiProvider: GeminiProviderService) {}

  async execute(node: WorkflowNode, context: ExecutionContext): Promise<RunStepResult> {
    const startTime = Date.now();
    const config = node.config as LlmNodeConfig;

    const rawPrompt = config.prompt || '';
    const interpolatedPrompt = interpolateTemplate(rawPrompt, context);

    this.logger.log(`Executing LLM Node [${node.id}] with prompt template interpolation`);

    try {
      const response = await this.geminiProvider.complete(interpolatedPrompt, {
        model: config.model || 'gemini-2.5-flash',
        jsonOutput: config.jsonOutput !== false, // default true for structured output
        systemInstruction: config.systemInstruction,
      });

      const outputData = response.json || { text: response.text };

      return {
        nodeId: node.id,
        nodeType: 'llm',
        input: { prompt: interpolatedPrompt, model: response.modelUsed },
        output: outputData,
        status: 'success',
        latencyMs: Date.now() - startTime,
        tokensUsed: response.tokensUsed,
        costUsd: response.costUsd,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`LLM Node [${node.id}] failed: ${errorMessage}`);

      return {
        nodeId: node.id,
        nodeType: 'llm',
        input: { prompt: interpolatedPrompt },
        status: 'failed',
        error: errorMessage,
        latencyMs: Date.now() - startTime,
      };
    }
  }
}
