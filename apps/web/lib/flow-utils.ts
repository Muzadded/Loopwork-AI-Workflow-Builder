import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowRunResponse,
  NodeType,
} from '@repo/shared-types';
import { Node, Edge } from '@xyflow/react';

export type RunHighlightStatus =
  | 'idle'
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'awaiting_approval'
  | 'retrying';

export type WorkflowFlowNodeData = {
  workflowNode: WorkflowNode;
  runStatus: RunHighlightStatus;
  selected: boolean;
};

export function getNodeRunStatus(
  nodeId: string,
  nodeOrder: string[],
  activeRun: WorkflowRunResponse | null | undefined,
): RunHighlightStatus {
  if (!activeRun || activeRun.workflowId === undefined) {
    // still highlight if we have steps matching this run
  }
  if (!activeRun) return 'idle';

  const step = activeRun.steps.find((s) => s.nodeId === nodeId);
  if (step) {
    if (step.status === 'success') return 'success';
    if (step.status === 'failed') return 'failed';
    if (step.status === 'retrying') return 'retrying';
  }

  if (activeRun.status === 'awaiting_approval') {
    const lastStep = activeRun.steps[activeRun.steps.length - 1];
    if (lastStep?.nodeId === nodeId) return 'awaiting_approval';
    if (step?.status === 'success') return 'success';
    return 'pending';
  }

  if (activeRun.status === 'running' || activeRun.status === 'pending') {
    const executed = new Set(activeRun.steps.map((s) => s.nodeId));
    const nextNode = nodeOrder.find((id) => !executed.has(id));
    if (nextNode === nodeId) return 'running';
    if (!executed.has(nodeId)) return 'pending';
  }

  return 'idle';
}

export function definitionToFlow(
  definition: WorkflowDefinition,
  activeRun: WorkflowRunResponse | null | undefined,
  selectedNodeId: string | null,
): { nodes: Node<WorkflowFlowNodeData>[]; edges: Edge[] } {
  const nodeOrder = definition.nodes.map((n) => n.id);

  const nodes: Node<WorkflowFlowNodeData>[] = definition.nodes.map((n) => ({
    id: n.id,
    type: 'workflow',
    position: n.position ?? { x: 100, y: 100 },
    data: {
      workflowNode: n,
      runStatus: getNodeRunStatus(n.id, nodeOrder, activeRun),
      selected: n.id === selectedNodeId,
    },
  }));

  const edges: Edge[] = definition.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.condition ?? undefined,
    label: e.condition ? (e.condition === 'true' ? 'Yes' : e.condition === 'false' ? 'No' : e.condition) : undefined,
    style: { stroke: '#A89F91', strokeWidth: 2 },
    labelStyle: { fill: '#786E65', fontSize: 10, fontWeight: 600 },
    selectable: true,
    deletable: true,
    reconnectable: true,
  }));

  return { nodes, edges };
}

export function applyNodePositions(
  definition: WorkflowDefinition,
  flowNodes: Node[],
): WorkflowDefinition {
  const posMap = new Map(flowNodes.map((n) => [n.id, n.position]));
  return {
    ...definition,
    nodes: definition.nodes.map((n) => ({
      ...n,
      position: posMap.get(n.id) ?? n.position,
    })),
  };
}

export function createNodeFromPalette(type: NodeType, label: string, index: number): WorkflowNode {
  const id = `${type}_${Date.now().toString().slice(-4)}`;
  return {
    id,
    type,
    config: {
      title: label,
      model: type === 'llm' ? 'gemini-2.5-flash' : undefined,
      source: type === 'trigger' ? 'webhook_api' : undefined,
      prompt: type === 'llm' ? 'Process and analyze: {{input.ticket_text}}' : undefined,
      jsonOutput: type === 'llm' ? true : undefined,
      actionType: type === 'action' ? (label.includes('HTTP') ? 'http' : 'log') : undefined,
      url: type === 'action' && label.includes('HTTP') ? 'https://httpbin.org/post' : undefined,
      message: type === 'approval' ? 'Review required before continuing' : undefined,
      timeoutHours: type === 'approval' ? 24 : undefined,
    },
    position: { x: 120 + index * 40, y: 120 + (index % 4) * 80 },
  };
}

export function createEdgeFromConnection(
  source: string,
  target: string,
  sourceHandle: string | null | undefined,
  sourceType: NodeType | undefined,
): WorkflowEdge {
  let condition: string | undefined;
  if (sourceType === 'condition' && sourceHandle) {
    condition = sourceHandle;
  }
  return {
    id: `e_${Date.now()}`,
    source,
    target,
    condition,
  };
}

export const RUN_STATUS_STYLES: Record<
  RunHighlightStatus,
  { border: string; ring: string; badge: string; badgeText: string }
> = {
  idle: {
    border: 'border-[#EAE4D9]',
    ring: '',
    badge: '',
    badgeText: '',
  },
  pending: {
    border: 'border-amber-400',
    ring: 'ring-2 ring-amber-400/30',
    badge: 'bg-amber-50 border-amber-200 text-amber-700',
    badgeText: 'Pending',
  },
  running: {
    border: 'border-[#C86D3B]',
    ring: 'ring-2 ring-[#C86D3B]/40 animate-pulse',
    badge: 'bg-[#FEF4EC] border-[#FADCC7] text-[#C86D3B]',
    badgeText: 'Running',
  },
  success: {
    border: 'border-emerald-500',
    ring: 'ring-2 ring-emerald-500/20',
    badge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    badgeText: 'Done',
  },
  failed: {
    border: 'border-rose-500',
    ring: 'ring-2 ring-rose-500/30',
    badge: 'bg-rose-50 border-rose-200 text-rose-700',
    badgeText: 'Failed',
  },
  awaiting_approval: {
    border: 'border-violet-500',
    ring: 'ring-2 ring-violet-500/30',
    badge: 'bg-violet-50 border-violet-200 text-violet-700',
    badgeText: 'Approval',
  },
  retrying: {
    border: 'border-amber-500',
    ring: 'ring-2 ring-amber-500/30',
    badge: 'bg-amber-50 border-amber-200 text-amber-800',
    badgeText: 'Retry',
  },
};

export const NODE_TYPE_ICONS: Record<NodeType, string> = {
  trigger: '⚡',
  llm: '🤖',
  condition: '🔀',
  action: '📝',
  approval: '🛡️',
};
