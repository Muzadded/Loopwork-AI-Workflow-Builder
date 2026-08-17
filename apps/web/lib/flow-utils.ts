import { WorkflowDefinition, WorkflowNode, WorkflowEdge, WorkflowRunResponse, NodeType, RunStatus } from '@repo/shared-types';
import { Node, Edge } from '@xyflow/react';

export interface WorkflowFlowNodeData {
  workflowNode: WorkflowNode;
  runStatus: RunStatus | 'idle' | 'success';
  selected: boolean;
  [key: string]: unknown;
}

export interface NodeStatusStyle {
  borderColor: string;
  ring?: string;
  badgeBg?: string;
  badgeText?: string;
  badgeBorder?: string;
  label?: string;
}

export const RUN_STATUS_STYLES: Record<string, NodeStatusStyle> = {
  idle:               { borderColor: 'var(--border-default)' },
  pending:            { borderColor: 'var(--border-strong)', badgeBg: 'var(--bg-card-inset)', badgeText: 'var(--text-secondary)', badgeBorder: 'var(--border-default)', label: 'Queued' },
  running:            { borderColor: 'var(--accent-primary)', ring: '0 0 0 2px var(--accent-subtle-bg)', badgeBg: 'var(--accent-subtle-bg)', badgeText: 'var(--accent-primary)', badgeBorder: 'var(--accent-primary)', label: 'Running' },
  completed:          { borderColor: 'var(--status-success-text)', badgeBg: 'var(--status-success-bg)', badgeText: 'var(--status-success-text)', badgeBorder: 'var(--status-success-text)', label: 'Done' },
  success:            { borderColor: 'var(--status-success-text)', badgeBg: 'var(--status-success-bg)', badgeText: 'var(--status-success-text)', badgeBorder: 'var(--status-success-text)', label: 'Done' },
  failed:             { borderColor: 'var(--status-failed-text)', badgeBg: 'var(--status-failed-bg)', badgeText: 'var(--status-failed-text)', badgeBorder: 'var(--status-failed-text)', label: 'Failed' },
  awaiting_approval:  { borderColor: 'var(--status-pending-text)', badgeBg: 'var(--status-pending-bg)', badgeText: 'var(--status-pending-text)', badgeBorder: 'var(--status-pending-text)', label: 'Approval' },
  retrying:           { borderColor: 'var(--status-pending-text)', badgeBg: 'var(--status-pending-bg)', badgeText: 'var(--status-pending-text)', badgeBorder: 'var(--status-pending-text)', label: 'Retry' },
};

export function definitionToFlow(
  definition: WorkflowDefinition,
  activeRun?: WorkflowRunResponse | null,
  selectedNodeId?: string | null,
): { nodes: Node<WorkflowFlowNodeData>[]; edges: Edge[] } {
  const stepStatusMap = new Map<string, string>();
  if (activeRun?.steps) for (const step of activeRun.steps) stepStatusMap.set(step.nodeId, step.status);

  const nodes: Node<WorkflowFlowNodeData>[] = definition.nodes.map((n) => {
    let runStatus = 'idle';
    if (activeRun) {
      if (stepStatusMap.has(n.id)) runStatus = stepStatusMap.get(n.id)!;
      else if (activeRun.status === 'running' || activeRun.status === 'pending') runStatus = 'pending';
    }
    return { id: n.id, type: 'workflow', position: n.position, data: { workflowNode: n, runStatus: runStatus as RunStatus, selected: selectedNodeId === n.id } };
  });

  const edges: Edge[] = definition.edges.map((e) => {
    const s = stepStatusMap.get(e.source);
    const executed = stepStatusMap.has(e.source) && (s === 'completed' || s === 'success');
    return { id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, label: e.conditionBranch ?? undefined, animated: executed,
      style: { stroke: executed ? '#2E8FA3' : 'var(--border-strong)', strokeWidth: executed ? 2 : 1.5 } };
  });

  return { nodes, edges };
}

export function createNodeFromPalette(type: NodeType, label: string, index: number): WorkflowNode {
  const id = `${type}_${Date.now()}`;
  const x  = 100 + (index % 3) * 260;
  const y  = 100 + Math.floor(index / 3) * 160;
  const cfg: Record<string, unknown> = { title: label };
  if (type === 'llm')       { cfg.model = 'gemini-2.5-flash'; cfg.prompt = 'Classify ticket category and sentiment.'; }
  if (type === 'condition') { cfg.mode = 'expression'; cfg.field = 'classify_score.category'; cfg.operator = 'equals'; cfg.value = 'billing'; }
  if (type === 'action')    { cfg.actionType = 'log'; }
  if (type === 'approval')  { cfg.message = 'Approve high-value customer ticket route.'; }
  return { id, type, position: { x, y }, config: cfg };
}

export function createEdgeFromConnection(source: string, target: string, sourceHandle?: string | null, sourceNodeType?: NodeType): WorkflowEdge {
  const id = `e_${source}_${target}_${Date.now()}`;
  const edge: WorkflowEdge = { id, source, target };
  if (sourceNodeType === 'condition' && sourceHandle) { edge.sourceHandle = sourceHandle; edge.conditionBranch = sourceHandle as 'true' | 'false'; }
  return edge;
}
