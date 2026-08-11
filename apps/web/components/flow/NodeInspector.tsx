'use client';

import React from 'react';
import { WorkflowNode } from '@repo/shared-types';

interface NodeInspectorProps {
  node: WorkflowNode;
  onUpdateConfig: (key: string, value: unknown) => void;
  onClose: () => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({ node, onUpdateConfig, onClose }) => {
  return (
    <div className="w-80 bg-[#FFFFFF] border-l border-[#EAE4D9] p-6 space-y-6 overflow-y-auto z-10 shadow-lg h-full">
      <div className="flex justify-between items-center border-b border-[#EAE4D9] pb-4">
        <h3 className="font-serif font-bold text-lg text-[#2C2622]">
          {node.config?.title || node.id}
        </h3>
        <button onClick={onClose} className="text-[#8C827A] hover:text-[#2C2622]">
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
            value={node.config?.title || ''}
            onChange={(e) => onUpdateConfig('title', e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#EAE4D9] text-[#2C2622] p-3 rounded-xl"
          />
        </div>

        {node.type === 'llm' && (
          <>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                MODEL
              </label>
              <select
                value={node.config.model || 'gemini-2.5-flash'}
                onChange={(e) => onUpdateConfig('model', e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#EAE4D9] p-3 rounded-xl"
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
                rows={5}
                value={node.config.prompt || node.config.systemPrompt || ''}
                onChange={(e) => onUpdateConfig('prompt', e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#EAE4D9] font-mono text-[11px] p-3 rounded-xl"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                CONFIDENCE THRESHOLD
              </label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={node.config.confidenceThreshold ?? 0.85}
                onChange={(e) => onUpdateConfig('confidenceThreshold', parseFloat(e.target.value))}
                className="w-full bg-[#FAF7F2] border border-[#EAE4D9] p-3 rounded-xl"
              />
            </div>
          </>
        )}

        {node.type === 'condition' && (
          <>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                MODE
              </label>
              <select
                value={node.config.mode || 'expression'}
                onChange={(e) => onUpdateConfig('mode', e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#EAE4D9] p-3 rounded-xl"
              >
                <option value="expression">Expression</option>
                <option value="confidence_threshold">Confidence Threshold</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                FIELD
              </label>
              <input
                type="text"
                value={node.config.field || ''}
                onChange={(e) => onUpdateConfig('field', e.target.value)}
                placeholder={
                  node.config.mode === 'confidence_threshold'
                    ? 'classify_score.confidence'
                    : 'classify_score.category'
                }
                className="w-full bg-[#FAF7F2] border border-[#EAE4D9] p-3 rounded-xl font-mono"
              />
            </div>
            {node.config.mode === 'confidence_threshold' ? (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                  CONFIDENCE THRESHOLD
                </label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={node.config.threshold ?? 0.85}
                  onChange={(e) => onUpdateConfig('threshold', parseFloat(e.target.value))}
                  className="w-full bg-[#FAF7F2] border border-[#EAE4D9] p-3 rounded-xl"
                />
                <p className="text-[10px] text-[#786E65] mt-1">
                  True branch = high confidence. False branch = low confidence (e.g. human review).
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                    OPERATOR
                  </label>
                  <select
                    value={node.config.operator || 'equals'}
                    onChange={(e) => onUpdateConfig('operator', e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#EAE4D9] p-3 rounded-xl"
                  >
                    <option value="equals">equals</option>
                    <option value="not_equals">not equals</option>
                    <option value="greater_than">greater than</option>
                    <option value="less_than">less than</option>
                    <option value="contains">contains</option>
                    <option value="truthy">truthy</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                    VALUE
                  </label>
                  <input
                    type="text"
                    value={node.config.value ?? ''}
                    onChange={(e) => onUpdateConfig('value', e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#EAE4D9] p-3 rounded-xl"
                  />
                </div>
              </>
            )}
            <p className="text-[10px] text-[#786E65]">
              Connect the right handle: top = true branch, bottom = false branch.
            </p>
          </>
        )}

        {node.type === 'action' && (
          <>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                ACTION TYPE
              </label>
              <select
                value={node.config.actionType || 'log'}
                onChange={(e) => onUpdateConfig('actionType', e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#EAE4D9] p-3 rounded-xl"
              >
                <option value="log">log</option>
                <option value="http">http</option>
              </select>
            </div>
            {node.config.actionType === 'http' && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                  URL
                </label>
                <input
                  type="text"
                  value={node.config.url || ''}
                  onChange={(e) => onUpdateConfig('url', e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#EAE4D9] p-3 rounded-xl font-mono"
                />
              </div>
            )}
          </>
        )}

        {node.type === 'approval' && (
          <>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                MESSAGE
              </label>
              <textarea
                rows={3}
                value={node.config.message || ''}
                onChange={(e) => onUpdateConfig('message', e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#EAE4D9] p-3 rounded-xl"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
                TIMEOUT (HOURS)
              </label>
              <input
                type="number"
                min={1}
                value={node.config.timeoutHours ?? 24}
                onChange={(e) => onUpdateConfig('timeoutHours', parseInt(e.target.value, 10))}
                className="w-full bg-[#FAF7F2] border border-[#EAE4D9] p-3 rounded-xl"
              />
            </div>
          </>
        )}

        {node.type === 'trigger' && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block mb-2">
              TRIGGER SOURCE
            </label>
            <input
              type="text"
              value={node.config?.source || ''}
              onChange={(e) => onUpdateConfig('source', e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#EAE4D9] p-3 rounded-xl font-mono"
            />
          </div>
        )}
      </div>
    </div>
  );
};
