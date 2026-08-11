'use client';

import React, { useState } from 'react';
import { WorkflowDefinition, WorkflowNode, WorkflowEdge, NodeType, WorkflowRunResponse } from '@repo/shared-types';

interface VisualFlowBuilderProps {
  initialWorkflow?: WorkflowDefinition;
  onSave: (definition: WorkflowDefinition) => Promise<void>;
  onTrigger: (definition: WorkflowDefinition) => Promise<void>;
  activeRun?: WorkflowRunResponse | null;
  triggering?: boolean;
}

export const VisualFlowBuilder: React.FC<VisualFlowBuilderProps> = ({
  initialWorkflow,
  onSave,
  onTrigger,
  activeRun,
  triggering,
}) => {
  const [definition, setDefinition] = useState<WorkflowDefinition>(
    initialWorkflow || {
      id: `wf-${Date.now()}`,
      name: 'Visual Customer Support & Risk Pipeline',
      nodes: [
        { id: 'trigger_1', type: 'trigger', config: {}, position: { x: 50, y: 150 } },
        {
          id: 'llm_1',
          type: 'llm',
          config: {
            prompt: 'Classify support ticket urgency (urgent/normal). Ticket: "{{input.ticket_text}}"',
            model: 'gemini-2.5-flash',
            confidenceThreshold: 0.9,
          },
          position: { x: 300, y: 150 },
        },
        {
          id: 'condition_1',
          type: 'condition',
          config: { field: 'llm_1.category', operator: 'equals', value: 'urgent' },
          position: { x: 580, y: 150 },
        },
        {
          id: 'approval_urgent',
          type: 'approval',
          config: { message: 'High priority P1 escalation requires manager approval', assigneeRole: 'support_lead' },
          position: { x: 860, y: 80 },
        },
        {
          id: 'action_normal',
          type: 'action',
          config: { actionType: 'log', body: { queue: 'NORMAL_TIER' } },
          position: { x: 860, y: 240 },
        },
      ],
      edges: [
        { id: 'e1', source: 'trigger_1', target: 'llm_1' },
        { id: 'e2', source: 'llm_1', target: 'condition_1' },
        { id: 'e3', source: 'condition_1', target: 'approval_urgent', condition: 'true' },
        { id: 'e4', source: 'condition_1', target: 'action_normal', condition: 'false' },
      ],
    },
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('llm_1');
  const selectedNode = definition.nodes.find((n) => n.id === selectedNodeId);

  const addNode = (type: NodeType) => {
    const newId = `${type}_${Date.now().toString().slice(-4)}`;
    const newNode: WorkflowNode = {
      id: newId,
      type,
      config: type === 'llm' ? { prompt: 'Process input: {{input.text}}', confidenceThreshold: 0.85 } : {},
      position: { x: 200 + definition.nodes.length * 40, y: 200 },
    };

    setDefinition((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
    setSelectedNodeId(newId);
  };

  const updateNodeConfig = (nodeId: string, updatedConfig: Record<string, any>) => {
    setDefinition((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, config: { ...n.config, ...updatedConfig } } : n)),
    }));
  };

  const getNodeStatus = (nodeId: string): 'pending' | 'running' | 'success' | 'failed' | 'awaiting_approval' | 'idle' => {
    if (!activeRun) return 'idle';
    const step = activeRun.steps.find((s) => s.nodeId === nodeId);
    if (!step) return activeRun.status === 'running' ? 'pending' : 'idle';
    return step.status === 'success' ? 'success' : 'failed';
  };

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Action Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            VISUAL CANVAS
          </span>
          <input
            type="text"
            value={definition.name}
            onChange={(e) => setDefinition({ ...definition, name: e.target.value })}
            className="bg-transparent font-bold text-white text-base focus:outline-none focus:border-b border-indigo-500 px-1"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSave(definition)}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-all"
          >
            💾 Save Workflow
          </button>
          <button
            onClick={() => onTrigger(definition)}
            disabled={triggering}
            className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-lg transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            {triggering ? '⚡ Enqueuing Run...' : '🚀 Execute DAG Workflow'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[500px]">
        {/* Node Drag Palette */}
        <div className="w-full lg:w-64 bg-slate-950/80 p-4 border-r border-slate-800/80 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Node Palette</h3>
          <p className="text-xs text-slate-500">Click to add workflow node components to the visual canvas.</p>

          <div className="space-y-2">
            {[
              { type: 'trigger' as NodeType, label: 'Trigger Node', icon: '⚡', color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30' },
              { type: 'llm' as NodeType, label: 'Gemini LLM Node', icon: '🤖', color: 'from-indigo-500/20 to-violet-500/20 text-indigo-300 border-indigo-500/30' },
              { type: 'condition' as NodeType, label: 'Condition Branch', icon: '🔀', color: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30' },
              { type: 'action' as NodeType, label: 'Action (HTTP/Log)', icon: '⚙️', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30' },
              { type: 'approval' as NodeType, label: 'Human Approval', icon: '🛡️', color: 'from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30' },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => addNode(item.type)}
                className={`w-full p-3 rounded-xl bg-gradient-to-r ${item.color} border text-left flex items-center justify-between text-xs font-semibold hover:opacity-90 transition-all shadow-sm`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{item.icon}</span> {item.label}
                </span>
                <span className="text-slate-400 font-bold">+</span>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Interactive Canvas */}
        <div className="flex-1 bg-slate-950/40 p-6 relative overflow-auto min-h-[450px] bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="relative min-w-[900px] min-h-[400px]">
            {/* SVG Edge Connectors */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {definition.edges.map((edge) => {
                const sourceNode = definition.nodes.find((n) => n.id === edge.source);
                const targetNode = definition.nodes.find((n) => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const x1 = (sourceNode.position?.x || 50) + 180;
                const y1 = (sourceNode.position?.y || 150) + 40;
                const x2 = targetNode.position?.x || 300;
                const y2 = (targetNode.position?.y || 150) + 40;

                const midX = (x1 + x2) / 2;

                return (
                  <g key={edge.id}>
                    <path
                      d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke={edge.condition === 'true' ? '#34d399' : edge.condition === 'false' ? '#f43f5e' : '#818cf8'}
                      strokeWidth="2.5"
                      strokeDasharray={edge.condition ? '5 5' : 'none'}
                    />
                    {edge.condition && (
                      <text x={midX} y={(y1 + y2) / 2 - 6} fill="#cbd5e1" fontSize="10" fontWeight="bold" textAnchor="middle">
                        [{edge.condition.toUpperCase()}]
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes Grid Rendering */}
            {definition.nodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              const status = getNodeStatus(node.id);

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{
                    left: `${node.position?.x || 50}px`,
                    top: `${node.position?.y || 150}px`,
                  }}
                  className={`absolute w-52 p-4 rounded-xl border backdrop-blur-md cursor-pointer transition-all z-10 shadow-xl ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-slate-900'
                      : status === 'success'
                      ? 'border-emerald-500/60 bg-slate-900/90'
                      : status === 'failed'
                      ? 'border-rose-500/60 bg-slate-900/90'
                      : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-indigo-300 flex items-center gap-1.5">
                      {node.type === 'trigger' && '⚡'}
                      {node.type === 'llm' && '🤖'}
                      {node.type === 'condition' && '🔀'}
                      {node.type === 'action' && '⚙️'}
                      {node.type === 'approval' && '🛡️'}
                      {node.type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{node.id}</span>
                  </div>

                  <p className="text-xs font-medium text-slate-200 line-clamp-2">
                    {node.type === 'llm' && (node.config.prompt || 'Gemini LLM Processing')}
                    {node.type === 'condition' && `If ${node.config.field || 'field'} ${node.config.operator || '=='} ${node.config.value || 'val'}`}
                    {node.type === 'action' && `${node.config.actionType || 'log'} action`}
                    {node.type === 'approval' && (node.config.message || 'Human Approval Required')}
                    {node.type === 'trigger' && 'Webhook / API Payload Trigger'}
                  </p>

                  {/* Status Badge */}
                  {status !== 'idle' && (
                    <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Status</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : status === 'failed'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-indigo-500/20 text-indigo-400 animate-pulse'
                        }`}
                      >
                        {status.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Inspector Sidebar */}
        {selectedNode && (
          <div className="w-full lg:w-80 bg-slate-950 p-5 border-l border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>⚙️ Node Inspector</span>
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 bg-slate-900 text-indigo-300 rounded border border-slate-800">
                {selectedNode.id}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Node Identifier</label>
                <input
                  type="text"
                  value={selectedNode.id}
                  disabled
                  className="w-full bg-slate-900 border border-slate-800 text-slate-400 px-3 py-2 rounded-lg font-mono"
                />
              </div>

              {selectedNode.type === 'llm' && (
                <>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Prompt Template</label>
                    <textarea
                      rows={3}
                      value={selectedNode.config.prompt || ''}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { prompt: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Confidence Threshold (0.00 - 1.00)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={selectedNode.config.confidenceThreshold || 0.9}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { confidenceThreshold: parseFloat(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg font-mono focus:border-indigo-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Triggers human approval if AI score falls below threshold.</p>
                  </div>
                </>
              )}

              {selectedNode.type === 'condition' && (
                <>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Evaluation Field</label>
                    <input
                      type="text"
                      value={selectedNode.config.field || ''}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { field: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Operator</label>
                    <select
                      value={selectedNode.config.operator || 'equals'}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { operator: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="equals">equals</option>
                      <option value="not_equals">not_equals</option>
                      <option value="greater_than">greater_than</option>
                      <option value="contains">contains</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Target Match Value</label>
                    <input
                      type="text"
                      value={selectedNode.config.value || ''}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { value: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {selectedNode.type === 'approval' && (
                <>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Approval Message</label>
                    <textarea
                      rows={2}
                      value={selectedNode.config.message || ''}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { message: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Assignee Role</label>
                    <select
                      value={selectedNode.config.assigneeRole || 'admin'}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { assigneeRole: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="finance_manager">Finance Manager</option>
                      <option value="support_lead">Support Lead</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
