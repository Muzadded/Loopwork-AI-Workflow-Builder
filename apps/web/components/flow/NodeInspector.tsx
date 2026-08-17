'use client';

import React from 'react';
import { WorkflowNode } from '@repo/shared-types';
import { X } from 'lucide-react';

interface NodeInspectorProps {
  node: WorkflowNode;
  onUpdateConfig: (key: string, value: unknown) => void;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', backgroundColor: 'var(--bg-card-inset)', border: '1px solid var(--border-strong)',
  color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 12, outline: 'none',
  fontSize: 13, fontWeight: 400, fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s',
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
  color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontFamily: 'var(--font-sans)',
};
const fieldWrap = { marginBottom: 0 };

export const NodeInspector: React.FC<NodeInspectorProps> = ({ node, onUpdateConfig, onClose }) => {
  const onFocus  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = 'var(--accent-primary)'; };
  const onBlur   = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = 'var(--border-default)'; };

  return (
    <div style={{ width: 320, backgroundColor: 'var(--bg-sidebar)', borderLeft: '1px solid var(--sidebar-border)',
      padding: 24, overflowY: 'auto' as const, height: '100%', color: 'var(--text-primary)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--border-strong)', paddingBottom: 16, marginBottom: 24 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
            color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', display: 'block' }}>NODE INSPECTOR</span>
          <span style={{ fontWeight: 500, fontSize: 16, color: 'var(--text-primary)', display: 'block', marginTop: 2,
            maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>
            {node.config?.title || node.id}
          </span>
        </div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'var(--bg-card-inset)',
          border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Title */}
        <div style={fieldWrap}>
          <label style={labelStyle}>NODE TITLE</label>
          <input type="text" value={node.config?.title || ''} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            onChange={(e) => onUpdateConfig('title', e.target.value)} />
        </div>

        {/* LLM */}
        {node.type === 'llm' && (<>
          <div style={fieldWrap}>
            <label style={labelStyle}>AI MODEL</label>
            <select value={node.config.model || 'gemini-2.5-flash'} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              onChange={(e) => onUpdateConfig('model', e.target.value)}>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>PROMPT TEMPLATE</label>
            <textarea rows={5} value={node.config.prompt || node.config.systemPrompt || ''} onFocus={onFocus} onBlur={onBlur}
              style={{ ...inputStyle, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, resize: 'vertical' as const }}
              onChange={(e) => onUpdateConfig('prompt', e.target.value)} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>CONFIDENCE THRESHOLD</label>
            <input type="number" min={0} max={1} step={0.05} value={node.config.confidenceThreshold ?? 0.85}
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} onFocus={onFocus} onBlur={onBlur}
              onChange={(e) => onUpdateConfig('confidenceThreshold', parseFloat(e.target.value))} />
          </div>
        </>)}

        {/* Condition */}
        {node.type === 'condition' && (<>
          <div style={fieldWrap}>
            <label style={labelStyle}>EVALUATION MODE</label>
            <select value={node.config.mode || 'expression'} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              onChange={(e) => onUpdateConfig('mode', e.target.value)}>
              <option value="expression">Expression</option>
              <option value="confidence_threshold">Confidence Threshold</option>
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>TARGET FIELD</label>
            <input type="text" value={node.config.field || ''} style={{ ...inputStyle, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
              placeholder={node.config.mode === 'confidence_threshold' ? 'classify_score.confidence' : 'classify_score.category'}
              onFocus={onFocus} onBlur={onBlur} onChange={(e) => onUpdateConfig('field', e.target.value)} />
          </div>
          {node.config.mode === 'confidence_threshold' ? (
            <div style={fieldWrap}>
              <label style={labelStyle}>CONFIDENCE THRESHOLD</label>
              <input type="number" min={0} max={1} step={0.05} value={node.config.threshold ?? 0.85}
                style={{ ...inputStyle, fontFamily: 'monospace' }} onFocus={onFocus} onBlur={onBlur}
                onChange={(e) => onUpdateConfig('threshold', parseFloat(e.target.value))} />
            </div>
          ) : (<>
            <div style={fieldWrap}>
              <label style={labelStyle}>OPERATOR</label>
              <select value={node.config.operator || 'equals'} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                onChange={(e) => onUpdateConfig('operator', e.target.value)}>
                {['equals','not_equals','greater_than','less_than','contains','truthy'].map((op) => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>COMPARISON VALUE</label>
              <input type="text" value={node.config.value ?? ''} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                onChange={(e) => onUpdateConfig('value', e.target.value)} />
            </div>
          </>)}
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6, padding: 10, borderRadius: 12,
            backgroundColor: 'var(--bg-card-inset)', border: '1px solid var(--border-default)' }}>
            💡 <strong style={{ color: 'var(--text-primary)' }}>Branching:</strong> Connect output handles (Top = true, Bottom = false).
          </p>
        </>)}

        {/* Action */}
        {node.type === 'action' && (<>
          <div style={fieldWrap}>
            <label style={labelStyle}>ACTION TYPE</label>
            <select value={node.config.actionType || 'log'} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              onChange={(e) => onUpdateConfig('actionType', e.target.value)}>
              <option value="log">log</option>
              <option value="http">http</option>
            </select>
          </div>
          {node.config.actionType === 'http' && (
            <div style={fieldWrap}>
              <label style={labelStyle}>ENDPOINT URL</label>
              <input type="text" value={node.config.url || ''} style={{ ...inputStyle, color: 'var(--accent-primary)', fontFamily: 'monospace' }}
                onFocus={onFocus} onBlur={onBlur} onChange={(e) => onUpdateConfig('url', e.target.value)} />
            </div>
          )}
        </>)}

        {/* Approval */}
        {node.type === 'approval' && (<>
          <div style={fieldWrap}>
            <label style={labelStyle}>APPROVAL INSTRUCTION</label>
            <textarea rows={3} value={node.config.message || ''} style={{ ...inputStyle, resize: 'vertical' as const }}
              onFocus={onFocus} onBlur={onBlur} onChange={(e) => onUpdateConfig('message', e.target.value)} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>TIMEOUT (HOURS)</label>
            <input type="number" min={1} value={node.config.timeoutHours ?? 24}
              style={{ ...inputStyle, fontFamily: 'monospace' }} onFocus={onFocus} onBlur={onBlur}
              onChange={(e) => onUpdateConfig('timeoutHours', parseInt(e.target.value, 10))} />
          </div>
        </>)}

        {/* Trigger */}
        {node.type === 'trigger' && (
          <div style={fieldWrap}>
            <label style={labelStyle}>TRIGGER SOURCE</label>
            <input type="text" value={node.config?.source || ''} style={{ ...inputStyle, color: 'var(--accent-primary)', fontFamily: 'monospace' }}
              onFocus={onFocus} onBlur={onBlur} onChange={(e) => onUpdateConfig('source', e.target.value)} />
          </div>
        )}
      </div>
    </div>
  );
};
