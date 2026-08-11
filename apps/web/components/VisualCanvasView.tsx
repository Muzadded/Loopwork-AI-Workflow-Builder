'use client';

import React, { useState } from 'react';
import { WorkflowDefinition, WorkflowNode, WorkflowEdge, NodeType } from '@repo/shared-types';

interface VisualCanvasViewProps {
  onSave?: (def: WorkflowDefinition) => void;
  onRun?: (def: WorkflowDefinition) => void;
}

export const VisualCanvasView: React.FC<VisualCanvasViewProps> = ({ onSave, onRun }) => {
  const [workflowName, setWorkflowName] = useState('Support Ticket Triage v1');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('classify_score');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Drag & Drop State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: 'new_ticket',
      type: 'trigger',
      config: { source: 'zendesk_prod', title: 'New Ticket Intake' },
      position: { x: 80, y: 140 },
    },
    {
      id: 'classify_score',
      type: 'llm',
      config: {
        model: 'gemini-2.5-flash',
        title: 'Classify & Score',
        prompt:
          'You are an expert customer support triage agent. Classify the ticket urgency (urgent or normal) with a confidence score. Ticket: "{{input.ticket_text}}"',
        jsonOutput: true,
        systemInstruction:
          'Return JSON with keys: category, confidence, summary, reasoning.',
      },
      position: { x: 440, y: 220 },
    },
  ]);

  const [edges, setEdges] = useState<WorkflowEdge[]>([
    { id: 'e1', source: 'new_ticket', target: 'classify_score' },
  ]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);

    const targetNode = nodes.find((n) => n.id === nodeId);
    if (targetNode) {
      setDragOffset({
        x: e.clientX - (targetNode.position?.x || 0),
        y: e.clientY - (targetNode.position?.y || 0),
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId) return;
    const canvasRect = e.currentTarget.getBoundingClientRect();
    const newX = Math.max(20, e.clientX - canvasRect.left - dragOffset.x + e.currentTarget.scrollLeft);
    const newY = Math.max(20, e.clientY - canvasRect.top - dragOffset.y + e.currentTarget.scrollTop);

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, position: { x: newX, y: newY } } : n)),
    );
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Add Node dynamically from Palette
  const addNodeFromLibrary = (type: NodeType, label: string) => {
    const id = `${type}_${Date.now().toString().slice(-4)}`;
    const newNode: WorkflowNode = {
      id,
      type,
      config: {
        title: label,
        model: type === 'llm' ? 'gemini-2.5-flash' : undefined,
        source: type === 'trigger' ? 'webhook_api' : undefined,
        prompt: type === 'llm' ? 'Process and analyze input payload.' : undefined,
        jsonOutput: type === 'llm' ? true : undefined,
      },
      position: { x: 200 + nodes.length * 60, y: 150 + (nodes.length % 3) * 50 },
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);

    // Automatically connect to the last node
    if (nodes.length > 0) {
      const lastNodeId = nodes[nodes.length - 1].id;
      setEdges((prev) => [...prev, { id: `e_${Date.now()}`, source: lastNodeId, target: id }]);
    }
  };

  const updateSelectedNodeConfig = (key: string, value: any) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedNodeId ? { ...n, config: { ...n.config, [key]: value } } : n,
      ),
    );
  };

  const deleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId('');
  };

  const getWorkflowDef = (): WorkflowDefinition => ({
    id: 'wf-triage-v1',
    name: workflowName,
    nodes,
    edges,
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-[#FAF7F2]">
      {/* Canvas Header Sub-Bar */}
      <div className="h-14 bg-[#FFFFFF] border-b border-[#EAE4D9] px-6 flex justify-between items-center z-10 select-none">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="font-serif font-semibold text-lg text-[#2C2622] bg-transparent focus:outline-none focus:border-b border-[#C86D3B]"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F7F2EA] text-[#8C827A] border border-[#EAE4D9]">
            DRAFT
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-[#786E65] hover:text-[#2C2622]">⚙️</button>
          <button className="p-2 text-[#786E65] hover:text-[#2C2622]">🔗</button>
          <button
            onClick={() => onSave?.(getWorkflowDef())}
            className="px-4 py-2 text-xs font-semibold text-[#2C2622] bg-[#FFFFFF] border border-[#EAE4D9] hover:bg-[#FAF7F2] rounded-lg transition-all shadow-sm"
          >
            Save
          </button>
          <button
            onClick={() => onRun?.(getWorkflowDef())}
            className="px-5 py-2 text-xs font-bold text-white bg-[#C86D3B] hover:bg-[#B05B2A] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            ► Run Workflow
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Node Library Sidebar */}
        <div className="w-64 bg-[#FFFFFF] border-r border-[#EAE4D9] p-5 space-y-6 flex flex-col z-10 select-none">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
              NODE LIBRARY
            </span>
            <div className="relative">
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#EAE4D9] text-xs text-[#2C2622] px-3 py-2 rounded-xl focus:outline-none focus:border-[#C86D3B]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                TRIGGERS
              </span>
              <div className="space-y-2">
                <button
                  onClick={() => addNodeFromLibrary('trigger', 'Webhook Intake')}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl flex items-center justify-between text-xs font-semibold text-[#2C2622] hover:border-[#C86D3B] hover:bg-[#FEF4EC] transition-all text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-amber-600">⚡</span> Webhook
                  </span>
                  <span className="text-[#C86D3B] font-bold">+</span>
                </button>
                <button
                  onClick={() => addNodeFromLibrary('trigger', 'Schedule Cron')}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl flex items-center justify-between text-xs font-semibold text-[#2C2622] hover:border-[#C86D3B] hover:bg-[#FEF4EC] transition-all text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-amber-600">⏰</span> Schedule
                  </span>
                  <span className="text-[#C86D3B] font-bold">+</span>
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                AI MODELS
              </span>
              <div className="space-y-2">
                <button
                  onClick={() => addNodeFromLibrary('llm', 'Gemini LLM')}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl flex items-center justify-between text-xs font-semibold text-[#2C2622] hover:border-[#C86D3B] hover:bg-[#FEF4EC] transition-all text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[#C86D3B]">🤖</span> LLM Node
                  </span>
                  <span className="text-[#C86D3B] font-bold">+</span>
                </button>
                <button
                  onClick={() => addNodeFromLibrary('action', 'Embeddings Generator')}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl flex items-center justify-between text-xs font-semibold text-[#2C2622] hover:border-[#C86D3B] hover:bg-[#FEF4EC] transition-all text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[#C86D3B]">🔤</span> Embeddings
                  </span>
                  <span className="text-[#C86D3B] font-bold">+</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center Interactive Drag Canvas */}
        <div
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="flex-1 bg-dots bg-[#FAF7F2] relative overflow-auto p-12 select-none cursor-crosshair"
        >
          <div className="relative w-full h-full min-w-[1000px] min-h-[600px]">
            {/* Dynamic SVG Connector Curves */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {edges.map((edge) => {
                const sourceNode = nodes.find((n) => n.id === edge.source);
                const targetNode = nodes.find((n) => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const x1 = (sourceNode.position?.x || 0) + 220;
                const y1 = (sourceNode.position?.y || 0) + 40;
                const x2 = targetNode.position?.x || 0;
                const y2 = (targetNode.position?.y || 0) + 40;
                const midX = (x1 + x2) / 2;

                return (
                  <g key={edge.id}>
                    <path
                      d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke="#A89F91"
                      strokeWidth="2.5"
                    />
                    <circle cx={x1} cy={y1} r="4" fill="#FFFFFF" stroke="#A89F91" strokeWidth="2" />
                    <circle cx={x2} cy={y2} r="4" fill="#C86D3B" stroke="#FFFFFF" strokeWidth="2" />
                  </g>
                );
              })}
            </svg>

            {/* Render Draggable Nodes */}
            {nodes.map((node) => {
              const isSelected = node.id === selectedNodeId;

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  style={{
                    left: `${node.position?.x || 50}px`,
                    top: `${node.position?.y || 150}px`,
                  }}
                  className={`absolute w-56 p-4 bg-[#FFFFFF] rounded-2xl border shadow-md transition-shadow cursor-grab active:cursor-grabbing z-10 ${
                    isSelected
                      ? 'border-[#C86D3B] ring-2 ring-[#C86D3B]/20 shadow-lg'
                      : 'border-[#EAE4D9] hover:border-[#A89F91]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#2C2622] mb-1">
                    <span className="flex items-center gap-2">
                      <span>
                        {node.type === 'trigger' && '⚡'}
                        {node.type === 'llm' && '🤖'}
                        {node.type === 'action' && '🔤'}
                        {node.type === 'condition' && '🔀'}
                        {node.type === 'approval' && '🛡️'}
                      </span>
                      {node.config?.title || node.id}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                      className="text-[#8C827A] hover:text-rose-600 font-bold p-1 text-xs"
                      title="Delete Node"
                    >
                      ✕
                    </button>
                  </div>

                  {node.type === 'trigger' && (
                    <p className="text-[11px] text-[#786E65] font-mono mt-1">
                      source: {node.config?.source || 'zendesk_prod'}
                    </p>
                  )}

                  {node.type === 'llm' && (
                    <div className="mt-2 pt-2 border-t border-[#F7F2EA] text-[10px]">
                      <span className="text-[#8C827A] uppercase font-bold block mb-0.5">MODEL</span>
                      <span className="text-[#2C2622] font-semibold">{node.config?.model || 'gemini-2.5-flash'}</span>
                    </div>
                  )}

                  {/* Right Output Handle Point */}
                  <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#FFFFFF] border-2 border-[#A89F91]" />
                  {/* Left Input Handle Point */}
                  <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#C86D3B] border-2 border-[#FFFFFF]" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Inspector Panel */}
        {selectedNode && (
          <div className="w-80 bg-[#FFFFFF] border-l border-[#EAE4D9] p-6 space-y-6 overflow-y-auto z-10 shadow-lg">
            <div className="flex justify-between items-center border-b border-[#EAE4D9] pb-4">
              <h3 className="font-serif font-bold text-lg text-[#2C2622] flex items-center gap-2">
                <span className="text-[#C86D3B]">
                  {selectedNode.type === 'llm' ? '🤖' : '⚡'}
                </span>
                {selectedNode.config?.title || selectedNode.id}
              </h3>
              <button
                onClick={() => setSelectedNodeId('')}
                className="text-[#8C827A] hover:text-[#2C2622] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                  NODE TITLE
                </label>
                <input
                  type="text"
                  value={selectedNode.config?.title || ''}
                  onChange={(e) => updateSelectedNodeConfig('title', e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#EAE4D9] text-[#2C2622] p-3 rounded-xl font-medium focus:outline-none focus:border-[#C86D3B]"
                />
              </div>

              {selectedNode.type === 'llm' && (
                <>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                      MODEL SELECTION
                    </label>
                    <select
                      value={selectedNode.config.model || 'gemini-2.5-flash'}
                      onChange={(e) => updateSelectedNodeConfig('model', e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#EAE4D9] text-[#2C2622] p-3 rounded-xl font-medium focus:outline-none focus:border-[#C86D3B]"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                      PROMPT TEMPLATE
                    </label>
                    <textarea
                      rows={6}
                      value={selectedNode.config.prompt || selectedNode.config.systemPrompt || ''}
                      onChange={(e) => updateSelectedNodeConfig('prompt', e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#EAE4D9] text-[#2C2622] font-mono text-[11px] p-3 rounded-xl focus:outline-none focus:border-[#C86D3B]"
                    />
                  </div>
                </>
              )}

              {selectedNode.type === 'trigger' && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                    TRIGGER SOURCE
                  </label>
                  <input
                    type="text"
                    value={selectedNode.config?.source || ''}
                    onChange={(e) => updateSelectedNodeConfig('source', e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#EAE4D9] text-[#2C2622] p-3 rounded-xl font-mono text-xs focus:outline-none focus:border-[#C86D3B]"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
