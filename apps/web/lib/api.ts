import {
  CreateWorkflowDto,
  TriggerWorkflowRunDto,
  UpdateWorkflowDto,
  WorkflowDefinition,
  WorkflowListItem,
  WorkflowRunResponse,
  DashboardMetrics,
  RecentRunItem,
  ApprovalItem,
} from '@repo/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface WorkflowDetail {
  id: string;
  name: string;
  definition: WorkflowDefinition;
  createdAt: string;
  updatedAt: string;
}

export interface TriggerRunResponse {
  runId: string;
  workflowId: string;
  status: string;
  message: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listWorkflows: () => request<WorkflowListItem[]>('/workflows'),

  getWorkflow: (id: string) => request<WorkflowDetail>(`/workflows/${id}`),

  createWorkflow: (dto: CreateWorkflowDto) =>
    request<WorkflowDetail>('/workflows', { method: 'POST', body: JSON.stringify(dto) }),

  updateWorkflow: (id: string, dto: UpdateWorkflowDto) =>
    request<WorkflowDetail>(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),

  deleteWorkflow: (id: string) =>
    request<{ success: boolean; id: string }>(`/workflows/${id}`, { method: 'DELETE' }),

  triggerRun: (workflowId: string, dto: TriggerWorkflowRunDto = {}) =>
    request<TriggerRunResponse>(`/workflows/${workflowId}/trigger`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  getRun: (runId: string) => request<WorkflowRunResponse>(`/runs/${runId}`),

  cancelRun: (runId: string) => request<WorkflowRunResponse>(`/runs/${runId}/cancel`, { method: 'POST' }),

  getWorkflowRuns: (workflowId: string) =>
    request<WorkflowRunResponse[]>(`/workflows/${workflowId}/runs`),

  getDashboardMetrics: () => request<DashboardMetrics>('/dashboard/metrics'),

  getRecentRuns: (limit = 20) => request<RecentRunItem[]>(`/dashboard/runs?limit=${limit}`),

  resolveApproval: (id: string, decision: 'approve' | 'reject', userFeedback?: string) =>
    request(`/approvals/${id}/${decision}`, {
      method: 'POST',
      body: JSON.stringify({ userFeedback }),
    }),

  getPendingApprovals: () => request<ApprovalItem[]>('/approvals/pending'),

  saveWorkflow: async (savedId: string | null, definition: WorkflowDefinition) => {
    const payload = {
      name: definition.name,
      definition: { ...definition, id: savedId ?? definition.id },
    };

    if (savedId) {
      return api.updateWorkflow(savedId, payload);
    }
    return api.createWorkflow(payload);
  },
};

export const TERMINAL_RUN_STATUSES = ['completed', 'failed', 'awaiting_approval'] as const;

export const DEFAULT_RUN_INPUT = {
  ticket_id: 'TCK-8819',
  ticket_text: 'Urgent: Payment processor timing out on checkout page.',
};
