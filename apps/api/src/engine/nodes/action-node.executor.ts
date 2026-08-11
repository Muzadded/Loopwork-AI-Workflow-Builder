import { Injectable, Logger } from '@nestjs/common';
import { INodeExecutor } from './node-executor.interface';
import { WorkflowNode, ExecutionContext, RunStepResult, ActionNodeConfig } from '@repo/shared-types';
import { interpolateTemplate } from '../utils/template-interpolator';

@Injectable()
export class ActionNodeExecutor implements INodeExecutor {
  private readonly logger = new Logger(ActionNodeExecutor.name);

  async execute(node: WorkflowNode, context: ExecutionContext): Promise<RunStepResult> {
    const startTime = Date.now();
    const config = node.config as ActionNodeConfig;
    const actionType = config.actionType || 'log';

    this.logger.log(`Executing Action Node [${node.id}] (Type: ${actionType})`);

    if (actionType === 'http' && config.url) {
      const interpolatedUrl = interpolateTemplate(config.url, context);
      const method = config.method || 'POST';

      try {
        const interpolatedBody: Record<string, any> = {};
        if (config.body) {
          for (const [key, val] of Object.entries(config.body)) {
            interpolatedBody[key] = typeof val === 'string' ? interpolateTemplate(val, context) : val;
          }
        } else {
          // Default to sending current node outputs
          Object.assign(interpolatedBody, context.nodeOutputs);
        }

        this.logger.log(`HTTP Action [${node.id}] ${method} -> ${interpolatedUrl}`);
        
        // Mock / actual fetch side effect
        let fetchResult = { status: 200, statusText: 'OK', sentPayload: interpolatedBody };
        if (config.url.startsWith('http')) {
          const response = await fetch(interpolatedUrl, {
            method,
            headers: { 'Content-Type': 'application/json', ...config.headers },
            body: method !== 'GET' ? JSON.stringify(interpolatedBody) : undefined,
          });
          const responseData = await response.json().catch(() => ({ status: response.statusText }));
          fetchResult = { status: response.status, statusText: response.statusText, ...responseData };
        }

        return {
          nodeId: node.id,
          nodeType: 'action',
          input: { url: interpolatedUrl, method, body: interpolatedBody },
          output: fetchResult,
          status: 'success',
          latencyMs: Date.now() - startTime,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return {
          nodeId: node.id,
          nodeType: 'action',
          input: { url: config.url, method: config.method },
          status: 'failed',
          error: errorMessage,
          latencyMs: Date.now() - startTime,
        };
      }
    }

    // Default Log Action
    const logData = {
      timestamp: new Date().toISOString(),
      nodeId: node.id,
      executedAction: 'CONSOLE_LOG',
      contextData: context.nodeOutputs,
    };
    this.logger.log(`Action Node [${node.id}] Logged Output: ${JSON.stringify(logData)}`);

    return {
      nodeId: node.id,
      nodeType: 'action',
      input: { actionType: 'log' },
      output: logData,
      status: 'success',
      latencyMs: Date.now() - startTime,
    };
  }
}
