'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  Node,
  NodeTypes,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  OnNodesChange,
  OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  WorkflowDefinition,
  WorkflowListItem,
  WorkflowRunResponse,
  NodeType,
} from '@repo/shared-types';
import { flowNodeTypes } from './flow/WorkflowFlowNode';
import { NodeInspector } from './flow/NodeInspector';
import {
  definitionToFlow,
  createNodeFromPalette,
  createEdgeFromConnection,
  WorkflowFlowNodeData,
} from '../lib/flow-utils';

const NODE_LIBRARY: { type: NodeType; label: string; icon: string; category: string }[] = [
  { type: 'trigger', label: 'Webhook', icon: '⚡', category: 'TRIGGERS' },
  { type: 'trigger', label: 'Schedule', icon: '⏰', category: 'TRIGGERS' },
  { type: 'llm', label: 'Gemini LLM', icon: '🤖', category: 'AI' },
  { type: 'condition', label: 'Condition', icon: '🔀', category: 'LOGIC' },
  { type: 'action', label: 'HTTP Action', icon: '🌐', category: 'ACTIONS' },
  { type: 'action', label: 'Log Action', icon: '📝', category: 'ACTIONS' },
  { type: 'approval', label: 'Human Approval', icon: '🛡️', category: 'LOGIC' },
];

interface VisualCanvasViewProps {
  definition: WorkflowDefinition;
  savedWorkflowId: string | null;
  workflows: WorkflowListItem[];
  activeRun?: WorkflowRunResponse | null;
  selectedNodeId: string | null;
  onDefinitionChange: (def: WorkflowDefinition) => void;
  onSelectedNodeIdChange: (id: string | null) => void;
  onLoadWorkflow: (id: string) => void;
  onNewWorkflow: () => void;
  onSave: () => void;
  onRun: () => void;
  isSaving?: boolean;
  isRunning?: boolean;
}

function VisualCanvasInner({
  definition,
  savedWorkflowId,
  workflows,
  activeRun,
  selectedNodeId,
  onDefinitionChange,
  onSelectedNodeIdChange,
  onLoadWorkflow,
  onNewWorkflow,
  onSave,
  onRun,
  isSaving,
  isRunning,
}: VisualCanvasViewProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => definitionToFlow(definition, activeRun, selectedNodeId),
    [definition, activeRun, selectedNodeId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowFlowNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const edgeReconnectSuccessful = useRef(true);

  useEffect(() => {
    const { nodes: nextNodes } = definitionToFlow(definition, activeRun, selectedNodeId);
    setNodes(nextNodes);
  }, [definition.nodes, activeRun, selectedNodeId, setNodes]);

  useEffect(() => {
    const { edges: nextEdges } = definitionToFlow(definition, activeRun, selectedNodeId);
    setEdges(nextEdges);
  }, [definition.edges, setEdges]);

  const handleNodesChange: OnNodesChange<Node<WorkflowFlowNodeData>> = useCallback(
    (changes) => {
      onNodesChange(changes);
    },
    [onNodesChange],
  );

  const onNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node<WorkflowFlowNodeData>) => {
      onDefinitionChange({
        ...definition,
        nodes: definition.nodes.map((n) =>
          n.id === node.id ? { ...n, position: node.position } : n,
        ),
      });
    },
    [definition, onDefinitionChange],
  );

  const onNodesDelete = useCallback(
    (deleted: Node<WorkflowFlowNodeData>[]) => {
      const ids = new Set(deleted.map((n) => n.id));
      onDefinitionChange({
        ...definition,
        nodes: definition.nodes.filter((n) => !ids.has(n.id)),
        edges: definition.edges.filter((e) => !ids.has(e.source) && !ids.has(e.target)),
      });
      if (selectedNodeId && ids.has(selectedNodeId)) {
        onSelectedNodeIdChange(null);
      }
    },
    [definition, onDefinitionChange, selectedNodeId, onSelectedNodeIdChange],
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
    },
    [onEdgesChange],
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      const ids = new Set(deleted.map((e) => e.id));
      onDefinitionChange({
        ...definition,
        edges: definition.edges.filter((e) => !ids.has(e.id)),
      });
    },
    [definition, onDefinitionChange],
  );

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (!newConnection.source || !newConnection.target) return;
      edgeReconnectSuccessful.current = true;
      const sourceNode = definition.nodes.find((n) => n.id === newConnection.source);
      const updated = createEdgeFromConnection(
        newConnection.source,
        newConnection.target,
        newConnection.sourceHandle,
        sourceNode?.type,
      );
      onDefinitionChange({
        ...definition,
        edges: definition.edges.map((e) =>
          e.id === oldEdge.id ? { ...updated, id: oldEdge.id } : e,
        ),
      });
    },
    [definition, onDefinitionChange],
  );

  const onReconnectEnd = useCallback(
    (_event: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        onDefinitionChange({
          ...definition,
          edges: definition.edges.filter((e) => e.id !== edge.id),
        });
      }
      edgeReconnectSuccessful.current = true;
    },
    [definition, onDefinitionChange],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const sourceNode = definition.nodes.find((n) => n.id === connection.source);
      const newEdge = createEdgeFromConnection(
        connection.source,
        connection.target,
        connection.sourceHandle,
        sourceNode?.type,
      );
      onDefinitionChange({
        ...definition,
        edges: [...definition.edges, newEdge],
      });
    },
    [definition, onDefinitionChange],
  );

  const addNodeFromLibrary = (type: NodeType, label: string) => {
    const newNode = createNodeFromPalette(type, label, definition.nodes.length);
    onDefinitionChange({
      ...definition,
      nodes: [...definition.nodes, newNode],
    });
    onSelectedNodeIdChange(newNode.id);
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    onDefinitionChange({
      ...definition,
      nodes: definition.nodes.filter((n) => n.id !== selectedNodeId),
      edges: definition.edges.filter(
        (e) => e.source !== selectedNodeId && e.target !== selectedNodeId,
      ),
    });
    onSelectedNodeIdChange(null);
  };

  const updateNodeConfig = (key: string, value: unknown) => {
    if (!selectedNodeId) return;
    onDefinitionChange({
      ...definition,
      nodes: definition.nodes.map((n) =>
        n.id === selectedNodeId ? { ...n, config: { ...n.config, [key]: value } } : n,
      ),
    });
  };

  const selectedNode = definition.nodes.find((n) => n.id === selectedNodeId);

  const filteredLibrary = NODE_LIBRARY.filter(
    (item) =>
      !searchQuery ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const categories = [...new Set(filteredLibrary.map((i) => i.category))];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-[#FAF7F2]">
      <div className="h-14 bg-[#FFFFFF] border-b border-[#EAE4D9] px-6 flex justify-between items-center z-10 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="text"
            value={definition.name}
            onChange={(e) => onDefinitionChange({ ...definition, name: e.target.value })}
            className="font-serif font-semibold text-lg text-[#2C2622] bg-transparent focus:outline-none focus:border-b border-[#C86D3B]"
          />
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#F7F2EA] text-[#8C827A] border border-[#EAE4D9] shrink-0">
            {savedWorkflowId ? 'SAVED' : 'DRAFT'}
          </span>
          {activeRun && (activeRun.status === 'running' || activeRun.status === 'pending') && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#FEF4EC] text-[#C86D3B] border border-[#FADCC7] animate-pulse shrink-0">
              LIVE RUN
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={savedWorkflowId ?? ''}
            onChange={(e) => (e.target.value ? onLoadWorkflow(e.target.value) : onNewWorkflow())}
            className="text-xs bg-[#FAF7F2] border border-[#EAE4D9] rounded-lg px-3 py-2 max-w-[180px]"
          >
            <option value="">— Load —</option>
            {workflows.map((wf) => (
              <option key={wf.id} value={wf.id}>
                {wf.name}
              </option>
            ))}
          </select>
          <button
            onClick={onNewWorkflow}
            className="px-3 py-2 text-xs font-semibold border border-[#EAE4D9] rounded-lg hover:bg-[#FAF7F2]"
          >
            New
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || isRunning}
            className="px-4 py-2 text-xs font-semibold border border-[#EAE4D9] rounded-lg disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={onRun}
            disabled={isSaving || isRunning}
            className="px-5 py-2 text-xs font-bold text-white bg-[#C86D3B] hover:bg-[#B05B2A] rounded-lg disabled:opacity-50"
          >
            {isRunning ? 'Starting…' : '► Run'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-60 bg-[#FFFFFF] border-r border-[#EAE4D9] p-4 space-y-4 overflow-y-auto shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase text-[#8C827A] block mb-2">
              Node Palette
            </span>
            <input
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-[#FAF7F2] border border-[#EAE4D9] rounded-lg px-3 py-2"
            />
          </div>
          {categories.map((cat) => (
            <div key={cat}>
              <span className="text-[9px] font-bold uppercase text-[#8C827A]">{cat}</span>
              <div className="mt-1 space-y-1">
                {filteredLibrary
                  .filter((i) => i.category === cat)
                  .map((item) => (
                    <button
                      key={`${item.type}-${item.label}`}
                      onClick={() => addNodeFromLibrary(item.type, item.label)}
                      className="w-full p-2.5 text-left text-xs font-semibold bg-[#FAF7F2] border border-[#EAE4D9] rounded-lg hover:border-[#C86D3B] flex justify-between"
                    >
                      <span>
                        {item.icon} {item.label}
                      </span>
                      <span className="text-[#C86D3B]">+</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
          <p className="text-[10px] text-[#786E65] pt-2 border-t border-[#EAE4D9]">
            Drag from handles to connect nodes. Drag a line off a node or click a line and press
            Delete to disconnect. Condition nodes have Yes/No outputs.
          </p>
        </div>

        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onReconnectStart={onReconnectStart}
            onReconnect={onReconnect}
            onReconnectEnd={onReconnectEnd}
            onNodeDragStop={onNodeDragStop}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            onNodeClick={(_, node) => onSelectedNodeIdChange(node.id)}
            onEdgeClick={() => onSelectedNodeIdChange(null)}
            onPaneClick={() => onSelectedNodeIdChange(null)}
            nodeTypes={flowNodeTypes as NodeTypes}
            defaultEdgeOptions={{ selectable: true, deletable: true, reconnectable: true }}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
            className="bg-[#FAF7F2]"
          >
            <Background gap={20} size={1} color="#EAE4D9" />
            <Controls className="!bg-white !border-[#EAE4D9] !shadow-sm" />
            <MiniMap
              nodeColor={(n) => {
                const status = (n.data as WorkflowFlowNodeData)?.runStatus;
                if (status === 'success') return '#10b981';
                if (status === 'failed') return '#f43f5e';
                if (status === 'running') return '#C86D3B';
                return '#EAE4D9';
              }}
              className="!bg-white !border-[#EAE4D9]"
            />
          </ReactFlow>
        </div>

        {selectedNode ? (
          <div className="flex flex-col shrink-0">
            <div className="bg-[#FFFFFF] border-l border-b border-[#EAE4D9] px-4 py-2 flex justify-end">
              <button
                onClick={deleteSelectedNode}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700"
              >
                Delete Node
              </button>
            </div>
            <NodeInspector
              node={selectedNode}
              onUpdateConfig={updateNodeConfig}
              onClose={() => onSelectedNodeIdChange(null)}
            />
          </div>
        ) : (
          <div className="w-80 bg-[#FFFFFF] border-l border-[#EAE4D9] p-6 flex items-center justify-center text-center shrink-0">
            <p className="text-xs text-[#786E65]">
              Select a node to configure it, or drag handles to connect nodes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export const VisualCanvasView: React.FC<VisualCanvasViewProps> = (props) => (
  <ReactFlowProvider>
    <VisualCanvasInner {...props} />
  </ReactFlowProvider>
);
