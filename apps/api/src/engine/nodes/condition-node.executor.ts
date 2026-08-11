import { Injectable, Logger } from '@nestjs/common';
import { INodeExecutor } from './node-executor.interface';
import { WorkflowNode, ExecutionContext, RunStepResult, ConditionNodeConfig } from '@repo/shared-types';
import { getValueFromPath } from '../utils/template-interpolator';

@Injectable()
export class ConditionNodeExecutor implements INodeExecutor {
  private readonly logger = new Logger(ConditionNodeExecutor.name);

  async execute(node: WorkflowNode, context: ExecutionContext): Promise<RunStepResult> {
    const startTime = Date.now();
    const config = node.config as ConditionNodeConfig;

    const actualValue = getValueFromPath(config.field || '', context);
    let conditionMet = false;
    let operator = config.operator || 'equals';
    const targetValue = config.value;

    if (config.mode === 'confidence_threshold') {
      const confidence = Number(actualValue);
      const threshold = Number(config.threshold ?? config.value ?? 0.85);
      conditionMet = confidence >= threshold;
      operator = 'greater_than';
      this.logger.log(
        `Condition Node [${node.id}] confidence_threshold: ${confidence} >= ${threshold} => ${conditionMet}`,
      );
    } else {
      switch (operator) {
        case 'equals':
          conditionMet = String(actualValue) === String(targetValue);
          break;
        case 'not_equals':
          conditionMet = String(actualValue) !== String(targetValue);
          break;
        case 'greater_than':
          conditionMet = Number(actualValue) > Number(targetValue);
          break;
        case 'less_than':
          conditionMet = Number(actualValue) < Number(targetValue);
          break;
        case 'contains':
          conditionMet = String(actualValue).toLowerCase().includes(String(targetValue).toLowerCase());
          break;
        case 'truthy':
          conditionMet = Boolean(actualValue);
          break;
        default:
          conditionMet = Boolean(actualValue);
      }
      this.logger.log(
        `Condition Node [${node.id}] evaluated (${config.field} ${operator} ${targetValue}) => ${conditionMet}`,
      );
    }

    const branch = conditionMet ? 'true' : 'false';

    return {
      nodeId: node.id,
      nodeType: 'condition',
      input: { field: config.field, operator, targetValue, actualValue, mode: config.mode },
      output: { conditionMet, branch, actualValue },
      status: 'success',
      latencyMs: Date.now() - startTime,
    };
  }
}
