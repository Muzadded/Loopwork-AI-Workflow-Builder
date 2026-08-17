'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Connection, Edge, Node, NodeTypes, ReactFlowProvider, useNodesState, useEdgesState, OnNodesChange, OnEdgesChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Save, Zap, Loader2, Trash2, SlidersHorizontal, Info } from 'lucide-react';
import { WorkflowDefinition, WorkflowListItem, WorkflowRunResponse, NodeType } from '@repo/shared-types';
import { flowNodeTypes } from './flow/WorkflowFlowNode';
import { NodeInspector } from './flow/NodeInspector';
import { getNodePaletteIcon } from './icons/NodeIcons';
import { definitionToFlow, createNodeFromPalette, createEdgeFromConnection, WorkflowFlowNodeData } from '../lib/flow-utils';

const NODE_LIBRARY: { type: NodeType; label: string; category: string }[] = [
  { type: 'trigger',   label: 'Webhook API',     category: 'TRIGGERS'        },
  { type: 'trigger',   label: 'Cron Schedule',   category: 'TRIGGERS'        },
  { type: 'llm',       label: 'Gemini LLM',      category: 'AI AGENTS'       },
  { type: 'condition', label: 'Logic Condition',  category: 'LOGIC & CONTROL' },
  { type: 'action',    label: 'HTTP Webhook',     category: 'ACTIONS'         },
  { type: 'action',    label: 'System Logger',    category: 'ACTIONS'         },
  { type: 'approval',  label: 'Human Approval',   category: 'LOGIC & CONTROL' },
];

interface VisualCanvasViewProps {
  definition: WorkflowDefinition; savedWorkflowId: string | null; workflows: WorkflowListItem[];
  activeRun?: WorkflowRunResponse | null; selectedNodeId: string | null;
  onDefinitionChange: (def: WorkflowDefinition) => void; onSelectedNodeIdChange: (id: string | null) => void;
  onLoadWorkflow: (id: string) => void; onNewWorkflow: () => void; onSave: () => void; onRun: () => void;
  isSaving?: boolean; isRunning?: boolean;
}

function VisualCanvasInner({ definition, savedWorkflowId, workflows, activeRun, selectedNodeId,
  onDefinitionChange, onSelectedNodeIdChange, onLoadWorkflow, onNewWorkflow, onSave, onRun, isSaving, isRunning,
}: VisualCanvasViewProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const { nodes: iN, edges: iE } = useMemo(() => definitionToFlow(definition, activeRun, selectedNodeId), [definition, activeRun, selectedNodeId]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowFlowNodeData>>(iN);
  const [edges, setEdges, onEdgesChange] = useEdgesState(iE);
  const edgeReconnectSuccessful = useRef(true);

  useEffect(() => { setNodes(definitionToFlow(definition, activeRun, selectedNodeId).nodes); }, [definition.nodes, activeRun, selectedNodeId, setNodes]);
  useEffect(() => { setEdges(definitionToFlow(definition, activeRun, selectedNodeId).edges); }, [definition.edges, setEdges]);

  const handleNodesChange: OnNodesChange<Node<WorkflowFlowNodeData>> = useCallback((c) => onNodesChange(c), [onNodesChange]);
  const handleEdgesChange: OnEdgesChange = useCallback((c) => onEdgesChange(c), [onEdgesChange]);

  const onNodeDragStop = useCallback((_e: MouseEvent | TouchEvent, node: Node<WorkflowFlowNodeData>) => {
    onDefinitionChange({ ...definition, nodes: definition.nodes.map((n) => n.id === node.id ? { ...n, position: node.position } : n) });
  }, [definition, onDefinitionChange]);

  const onNodesDelete = useCallback((deleted: Node<WorkflowFlowNodeData>[]) => {
    const ids = new Set(deleted.map((n) => n.id));
    onDefinitionChange({ ...definition, nodes: definition.nodes.filter((n) => !ids.has(n.id)), edges: definition.edges.filter((e) => !ids.has(e.source) && !ids.has(e.target)) });
    if (selectedNodeId && ids.has(selectedNodeId)) onSelectedNodeIdChange(null);
  }, [definition, onDefinitionChange, selectedNodeId, onSelectedNodeIdChange]);

  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    const ids = new Set(deleted.map((e) => e.id));
    onDefinitionChange({ ...definition, edges: definition.edges.filter((e) => !ids.has(e.id)) });
  }, [definition, onDefinitionChange]);

  const onReconnectStart = useCallback(() => { edgeReconnectSuccessful.current = false; }, []);
  const onReconnect = useCallback((oldEdge: Edge, conn: Connection) => {
    if (!conn.source || !conn.target) return;
    edgeReconnectSuccessful.current = true;
    const src = definition.nodes.find((n) => n.id === conn.source);
    const updated = createEdgeFromConnection(conn.source, conn.target, conn.sourceHandle, src?.type);
    onDefinitionChange({ ...definition, edges: definition.edges.map((e) => e.id === oldEdge.id ? { ...updated, id: oldEdge.id } : e) });
  }, [definition, onDefinitionChange]);
  const onReconnectEnd = useCallback((_e: MouseEvent | TouchEvent, edge: Edge) => {
    if (!edgeReconnectSuccessful.current) onDefinitionChange({ ...definition, edges: definition.edges.filter((e) => e.id !== edge.id) });
    edgeReconnectSuccessful.current = true;
  }, [definition, onDefinitionChange]);

  const onConnect = useCallback((conn: Connection) => {
    if (!conn.source || !conn.target) return;
    const src = definition.nodes.find((n) => n.id === conn.source);
    onDefinitionChange({ ...definition, edges: [...definition.edges, createEdgeFromConnection(conn.source, conn.target, conn.sourceHandle, src?.type)] });
  }, [definition, onDefinitionChange]);

  const addNode = (type: NodeType, label: string) => {
    const n = createNodeFromPalette(type, label, definition.nodes.length);
    onDefinitionChange({ ...definition, nodes: [...definition.nodes, n] });
    onSelectedNodeIdChange(n.id);
  };
  const deleteSelected = () => {
    if (!selectedNodeId) return;
    onDefinitionChange({ ...definition, nodes: definition.nodes.filter((n) => n.id !== selectedNodeId), edges: definition.edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId) });
    onSelectedNodeIdChange(null);
  };
  const updateConfig = (key: string, value: unknown) => {
    if (!selectedNodeId) return;
    onDefinitionChange({ ...definition, nodes: definition.nodes.map((n) => n.id === selectedNodeId ? { ...n, config: { ...n.config, [key]: value } } : n) });
  };

  const selectedNode = definition.nodes.find((n) => n.id === selectedNodeId);
  const filtered     = NODE_LIBRARY.filter((i) => !searchQuery || i.label.toLowerCase().includes(searchQuery.toLowerCase()) || i.category.toLowerCase().includes(searchQuery.toLowerCase()));
  const categories   = [...new Set(filtered.map((i) => i.category))];

  const sidebarStyle: React.CSSProperties = { backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--sidebar-border)' };
  const cardStyle:    React.CSSProperties = { backgroundColor: 'var(--bg-card)',    border: '1px solid var(--border-default)' };
  const insetStyle:   React.CSSProperties = { backgroundColor: 'var(--bg-card-inset)', border: '1px solid var(--border-default)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)', overflow: 'hidden', backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>

      {/* Canvas Toolbar */}
      <div style={{ height: 56, ...sidebarStyle, borderRight: 'none', borderBottom: '1px solid var(--sidebar-border)', padding: '0 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <input type="text" value={definition.name} onChange={(e) => onDefinitionChange({ ...definition, name: e.target.value })}
            style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', backgroundColor: 'transparent', border: 'none', outline: 'none' }} />
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 10px',
            borderRadius: 999, flexShrink: 0, ...insetStyle, color: 'var(--text-secondary)' }}>
            {savedWorkflowId ? 'SAVED' : 'UNSAVED DRAFT'}
          </span>
          {activeRun && (activeRun.status === 'running' || activeRun.status === 'pending') && (
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', padding: '2px 10px', borderRadius: 999,
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              backgroundColor: 'var(--accent-subtle-bg)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}>
              <Zap className="w-3 h-3" style={{ fill: 'var(--accent-primary)' }} /> LIVE RUNNING
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
          <select value={savedWorkflowId ?? ''} onChange={(e) => e.target.value ? onLoadWorkflow(e.target.value) : onNewWorkflow()}
            style={{ fontSize: 12, ...insetStyle, border: '1px solid var(--border-strong)', color: 'var(--text-primary)', borderRadius: 12, padding: '8px 12px', maxWidth: 180, outline: 'none' }}>
            <option value="">— Select Saved —</option>
            {workflows.map((wf) => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
          </select>
          {[
            { label: 'New Canvas', icon: <Plus className="w-3.5 h-3.5" />, onClick: onNewWorkflow },
            { label: isSaving ? 'Saving…' : 'Save Workflow', icon: <Save className="w-3.5 h-3.5" />, onClick: onSave, disabled: isSaving || isRunning },
          ].map(({ label, icon, onClick, disabled }) => (
            <button key={label} onClick={onClick} disabled={disabled}
              style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', backgroundColor: 'transparent',
                border: '1px solid var(--border-strong)', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: disabled ? 0.4 : 1 }}>
              {icon} {label}
            </button>
          ))}
          <button onClick={onRun} disabled={isSaving || isRunning}
            style={{ padding: '8px 20px', fontSize: 13, fontWeight: 500, backgroundColor: 'var(--accent-primary)', color: 'var(--accent-on-primary)',
              border: 'none', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: (isSaving || isRunning) ? 0.4 : 1 }}>
            {isRunning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing…</> : <><Zap className="w-3.5 h-3.5" style={{ fill: 'var(--accent-on-primary)' }} /> Run Pipeline</>}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left Palette */}
        <div style={{ width: 256, ...sidebarStyle, padding: 16, overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            {/* Section eyebrow label: 11px, weight 500, uppercase, letter-spacing 0.05em */}
            <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
              NODE LIBRARY PALETTE
            </span>
            <input type="text" placeholder="Search components…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', fontSize: 13, backgroundColor: 'var(--bg-card-inset)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', borderRadius: 12, padding: '8px 14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-sans)' }} />
          </div>
          {categories.map((cat) => (
            <div key={cat}>
              <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-primary)', display: 'block', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
                {cat}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filtered.filter((i) => i.category === cat).map((item) => (
                  <button key={`${item.type}-${item.label}`} onClick={() => addNode(item.type, item.label)}
                    style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 500, ...cardStyle, borderRadius: 12,
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-primary)', transition: 'border-color 0.15s', fontFamily: 'var(--font-sans)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-primary)'; }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {getNodePaletteIcon(item.label, 'w-4 h-4')}
                      {item.label}
                    </span>
                    <Plus className="w-4 h-4" style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          ))}
          {/* Tip box */}
          <div style={{ padding: 12, borderRadius: 12, ...cardStyle, fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <Info className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} /> Quick Controls:
            </p>
            <p>• Drag handles between nodes to connect.</p>
            <p>• Press <span style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>Delete</span> / <span style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>Backspace</span> to remove.</p>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', backgroundColor: 'var(--bg-page)' }}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange}
            onConnect={onConnect} onReconnectStart={onReconnectStart} onReconnect={onReconnect} onReconnectEnd={onReconnectEnd}
            onNodeDragStop={onNodeDragStop} onNodesDelete={onNodesDelete} onEdgesDelete={onEdgesDelete}
            onNodeClick={(_, n) => onSelectedNodeIdChange(n.id)}
            onEdgeClick={() => onSelectedNodeIdChange(null)}
            onPaneClick={() => onSelectedNodeIdChange(null)}
            nodeTypes={flowNodeTypes as NodeTypes}
            defaultEdgeOptions={{ selectable: true, deletable: true, reconnectable: true }}
            fitView deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background gap={20} size={1.5} color="var(--border-default)" />
            <Controls />
            <MiniMap nodeColor={(n) => {
              const s = (n.data as WorkflowFlowNodeData)?.runStatus;
              if (s === 'success' || s === 'completed') return '#27500A';
              if (s === 'failed') return '#A32D2D';
              if (s === 'running') return '#2E8FA3';
              return 'var(--border-strong)';
            }} />
          </ReactFlow>
        </div>

        {/* Right Panel */}
        {selectedNode ? (
          <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ ...sidebarStyle, borderLeft: 'none', borderBottom: '1px solid var(--sidebar-border)', padding: '8px 16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={deleteSelected}
                style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 8, cursor: 'pointer',
                  backgroundColor: 'var(--status-failed-bg)', color: 'var(--status-failed-text)', border: '1px solid var(--status-failed-text)',
                  display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trash2 className="w-3 h-3" /> Delete Node
              </button>
            </div>
            <NodeInspector node={selectedNode} onUpdateConfig={updateConfig} onClose={() => onSelectedNodeIdChange(null)} />
          </div>
        ) : (
          <div style={{ width: 320, ...sidebarStyle, borderLeft: 'none', padding: 32, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', flexShrink: 0, gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SlidersHorizontal className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Canvas Inspector</h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 200 }}>
              Select any node on the flow canvas to inspect and configure model settings, prompts, or logic handlers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export const VisualCanvasView: React.FC<VisualCanvasViewProps> = (props) => (
  <ReactFlowProvider><VisualCanvasInner {...props} /></ReactFlowProvider>
);
