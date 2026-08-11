import { Controller, Post, Body } from '@nestjs/common';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowDefinition, EngineTestRunResponse } from '@repo/shared-types';

@Controller('engine')
export class EngineController {
  constructor(private readonly engineService: WorkflowEngineService) {}

  @Post('test-run')
  async testRun(
    @Body() body: { workflow?: WorkflowDefinition; initialInput?: Record<string, any> },
  ): Promise<EngineTestRunResponse> {
    const input = body.initialInput || {
      ticket_id: 'TCK-8902',
      ticket_text: 'Urgent system outage on production database cluster! Server down.',
      submitted_by: 'alex@company.com',
    };

    const defaultWorkflow: WorkflowDefinition = {
      id: 'demo-workflow-01',
      name: 'Support Ticket AI Triage & Routing',
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          config: {},
        },
        {
          id: 'llm_1',
          type: 'llm',
          config: {
            prompt: `Classify the following customer ticket by urgency (urgent or normal) and include a confidence score (0 to 1). Ticket text: "{{input.ticket_text}}"`,
            model: 'gemini-2.5-flash',
            jsonOutput: true,
            systemInstruction: 'You are an AI support classifier. Return JSON with keys: category, confidence, summary, reasoning.',
          },
        },
        {
          id: 'condition_1',
          type: 'condition',
          config: {
            field: 'llm_1.category',
            operator: 'equals',
            value: 'urgent',
          },
        },
        {
          id: 'action_urgent',
          type: 'action',
          config: {
            actionType: 'log',
            url: 'https://httpbin.org/post',
            method: 'POST',
            body: {
              status: 'ESCALATED',
              reason: 'High urgency ticket detected by Gemini AI',
              details: '{{llm_1.summary}}',
            },
          },
        },
        {
          id: 'action_normal',
          type: 'action',
          config: {
            actionType: 'log',
            body: {
              status: 'QUEUED',
              reason: 'Standard priority workflow',
            },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'trigger_1', target: 'llm_1' },
        { id: 'e2', source: 'llm_1', target: 'condition_1' },
        { id: 'e3', source: 'condition_1', target: 'action_urgent', condition: 'true' },
        { id: 'e4', source: 'condition_1', target: 'action_normal', condition: 'false' },
      ],
    };

    const workflowToRun = body.workflow || defaultWorkflow;
    return this.engineService.executeWorkflow(workflowToRun, input);
  }
}
