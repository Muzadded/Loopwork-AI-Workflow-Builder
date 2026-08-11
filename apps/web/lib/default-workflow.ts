import { WorkflowDefinition } from '@repo/shared-types';

export function createDefaultWorkflow(): WorkflowDefinition {
  return {
    id: `wf-${Date.now()}`,
    name: 'Support Ticket Triage v1',
    nodes: [
      {
        id: 'new_ticket',
        type: 'trigger',
        config: { source: 'webhook_api', title: 'New Ticket Intake' },
        position: { x: 80, y: 140 },
      },
      {
        id: 'classify_score',
        type: 'llm',
        config: {
          model: 'gemini-2.5-flash',
          title: 'Classify & Score',
          prompt:
            'Classify the following customer ticket by urgency (urgent or normal) and include a confidence score (0 to 1). Ticket text: "{{input.ticket_text}}"',
          jsonOutput: true,
          systemInstruction:
            'Return JSON with keys: category, confidence, summary, reasoning.',
          confidenceThreshold: 0.95,
          enableTieredFallback: true,
        },
        position: { x: 400, y: 200 },
      },
      {
        id: 'route_condition',
        type: 'condition',
        config: {
          mode: 'confidence_threshold',
          field: 'classify_score.confidence',
          threshold: 0.9,
          title: 'Confidence Gate',
        },
        position: { x: 720, y: 200 },
      },
      {
        id: 'action_auto',
        type: 'action',
        config: {
          actionType: 'log',
          title: 'Auto Route (High Confidence)',
        },
        position: { x: 1040, y: 100 },
      },
      {
        id: 'human_review',
        type: 'approval',
        config: {
          title: 'Human Review',
          message: 'Low confidence classification for ticket {{input.ticket_id}} — please review.',
          timeoutHours: 24,
        },
        position: { x: 1040, y: 300 },
      },
      {
        id: 'action_reviewed',
        type: 'action',
        config: {
          actionType: 'log',
          title: 'Queue After Review',
        },
        position: { x: 1360, y: 300 },
      },
    ],
    edges: [
      { id: 'e1', source: 'new_ticket', target: 'classify_score' },
      { id: 'e2', source: 'classify_score', target: 'route_condition' },
      { id: 'e3', source: 'route_condition', target: 'action_auto', condition: 'true' },
      { id: 'e4', source: 'route_condition', target: 'human_review', condition: 'false' },
      { id: 'e5', source: 'human_review', target: 'action_reviewed' },
    ],
  };
}
