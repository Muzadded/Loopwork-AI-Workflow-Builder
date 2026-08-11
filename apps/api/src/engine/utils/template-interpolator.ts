import { ExecutionContext } from '@repo/shared-types';

/**
 * Resolves dot-notation path like "input.ticket_text" or "llm_1.confidence"
 * against the current ExecutionContext.
 */
export function getValueFromPath(path: string, context: ExecutionContext): any {
  const parts = path.trim().split('.');
  const root = parts[0];

  let current: any;
  if (root === 'input') {
    current = context.initialInput;
  } else if (context.nodeOutputs[root]) {
    current = context.nodeOutputs[root];
  } else {
    return undefined;
  }

  for (let i = 1; i < parts.length; i++) {
    if (current === undefined || current === null) return undefined;
    current = current[parts[i]];
  }

  return current;
}

/**
 * Replaces {{path.to.var}} strings in template text with actual context values.
 */
export function interpolateTemplate(template: string, context: ExecutionContext): string {
  if (!template) return '';
  return template.replace(/\{\{\s*([\w\.-]+)\s*\}\}/g, (match, path) => {
    const val = getValueFromPath(path, context);
    if (val === undefined || val === null) return '';
    return typeof val === 'object' ? JSON.stringify(val) : String(val);
  });
}
