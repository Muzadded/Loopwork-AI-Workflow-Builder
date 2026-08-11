export type NodeType = 'trigger' | 'llm' | 'condition' | 'action' | 'approval';
export interface WorkflowNode {
    id: string;
    type: NodeType;
    config: Record<string, any>;
    position?: {
        x: number;
        y: number;
    };
}
export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    condition?: string;
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
}
export type RunStatus = 'pending' | 'running' | 'awaiting_approval' | 'completed' | 'failed';
export type StepStatus = 'success' | 'failed' | 'retrying';
export interface RunStepResult {
    nodeId: string;
    nodeType: NodeType;
    input: Record<string, any>;
    output?: Record<string, any>;
    status: StepStatus;
    latencyMs?: number;
    tokensUsed?: number;
    costUsd?: number;
    error?: string;
    createdAt?: string;
}
export interface ExecutionContext {
    workflowId: string;
    runId: string;
    initialInput: Record<string, any>;
    nodeOutputs: Record<string, Record<string, any>>;
}
export interface LlmNodeConfig {
    prompt: string;
    model?: string;
    jsonOutput?: boolean;
    systemInstruction?: string;
    confidenceThreshold?: number;
}
export interface ConditionNodeConfig {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'truthy';
    value?: any;
}
export interface ActionNodeConfig {
    actionType: 'http' | 'log';
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: Record<string, any>;
    headers?: Record<string, string>;
}
export interface ApprovalNodeConfig {
    message?: string;
    assigneeRole?: string;
    timeoutHours?: number;
}
export interface AiOptions {
    model?: string;
    jsonOutput?: boolean;
    systemInstruction?: string;
    temperature?: number;
}
export interface AiResponse {
    text: string;
    json?: Record<string, any>;
    tokensUsed?: number;
    promptTokens?: number;
    candidateTokens?: number;
    costUsd?: number;
    modelUsed: string;
}
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export interface ApprovalItem {
    id: string;
    runId: string;
    nodeId: string;
    status: ApprovalStatus;
    payload: Record<string, any>;
    createdAt: string;
    resolvedAt?: string | null;
}
export interface ResolveApprovalDto {
    status: 'approved' | 'rejected';
    userFeedback?: string;
}
export interface CreateWorkflowDto {
    name: string;
    definition: WorkflowDefinition;
}
export interface UpdateWorkflowDto {
    name?: string;
    definition?: WorkflowDefinition;
}
export interface TriggerWorkflowRunDto {
    input?: Record<string, any>;
}
export interface WorkflowListItem {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}
export interface WorkflowRunResponse {
    id: string;
    workflowId: string;
    status: RunStatus;
    input: Record<string, any>;
    startedAt: string;
    finishedAt?: string | null;
    totalCostUsd?: number | null;
    totalLatencyMs?: number | null;
    totalTokensUsed?: number | null;
    steps: RunStepResult[];
}
export interface EngineTestRunRequest {
    workflow: WorkflowDefinition;
    initialInput: Record<string, any>;
}
export interface EngineTestRunResponse {
    runId: string;
    status: RunStatus;
    executionTrace: RunStepResult[];
    finalOutput?: Record<string, any>;
    totalLatencyMs: number;
    totalCostUsd: number;
    totalTokensUsed: number;
}
export interface HealthCheckResponse {
    status: 'ok' | 'error';
    timestamp: string;
    postgres: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
}
