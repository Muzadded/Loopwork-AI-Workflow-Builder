import { Injectable, Logger } from '@nestjs/common';
import { INodeExecutor } from './node-executor.interface';
import { WorkflowNode, ExecutionContext, RunStepResult, LlmNodeConfig } from '@repo/shared-types';
import { GeminiProviderService } from '../../ai/gemini-provider.service';
import { resolveLlmNodeConfig } from '../utils/llm-config';
import { interpolateTemplate } from '../utils/template-interpolator';

@Injectable()
export class LlmNodeExecutor implements INodeExecutor {
  private readonly logger = new Logger(LlmNodeExecutor.name);

  constructor(private readonly geminiProvider: GeminiProviderService) {}

  async execute(node: WorkflowNode, context: ExecutionContext): Promise<RunStepResult> {
    const startTime = Date.now();
    const config = resolveLlmNodeConfig(node.config as LlmNodeConfig);

    if (!config.prompt.trim()) {
      return {
        nodeId: node.id,
        nodeType: 'llm',
        input: { model: config.model },
        status: 'failed',
        error: 'LLM node requires a prompt (config.prompt or config.systemPrompt)',
        latencyMs: Date.now() - startTime,
      };
    }

    const interpolatedPrompt = interpolateTemplate(config.prompt, context);

    this.logger.log(`Executing LLM Node [${node.id}] with model "${config.model}"`);

    try {
      const response = await this.geminiProvider.complete(interpolatedPrompt, {
        model: config.model,
        jsonOutput: config.jsonOutput,
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
        input: { prompt: interpolatedPrompt, model: config.model },
        status: 'failed',
        error: errorMessage,
        latencyMs: Date.now() - startTime,
      };
    }
  }
}
