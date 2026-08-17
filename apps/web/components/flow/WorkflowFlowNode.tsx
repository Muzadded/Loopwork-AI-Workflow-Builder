'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { NodeType } from '@repo/shared-types';
import { WorkflowFlowNodeData, RUN_STATUS_STYLES } from '../../lib/flow-utils';
import { getNodeTypeIcon } from '../icons/NodeIcons';

const WorkflowFlowNode = memo(({ data }: NodeProps<Node<WorkflowFlowNodeData>>) => {
  const { workflowNode, runStatus, selected } = data;
  const s = (runStatus && RUN_STATUS_STYLES[runStatus]) || RUN_STATUS_STYLES.idle;
  const type = workflowNode.type as NodeType;

  const borderColor = selected ? 'var(--accent-primary)' : s.borderColor;
  const boxShadow   = selected ? '0 0 0 2px var(--accent-subtle-bg)' : (s.ring ?? 'none');

  return (
    <div style={{ width: 240, padding: 16, borderRadius: 16, border: `1px solid ${borderColor}`, boxShadow,
      backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: 'var(--font-sans)' }}>

      <Handle type="target" position={Position.Left} style={{
        width: 14, height: 14, backgroundColor: 'var(--accent-primary)',
        border: '2px solid var(--bg-sidebar)', left: -8,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ padding: '6px', borderRadius: 8, backgroundColor: 'var(--bg-card-inset)', border: '1px solid var(--border-default)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {getNodeTypeIcon(type, 'w-4 h-4')}
          </span>
          <span style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
            {workflowNode.config?.title || workflowNode.id}
          </span>
        </span>
        {runStatus && runStatus !== 'idle' && s.label && (
          <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 999, fontWeight: 500, flexShrink: 0,
            backgroundColor: s.badgeBg, color: s.badgeText, border: `1px solid ${s.badgeBorder}` }}>
            {s.label}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8,
        borderTop: '1px solid var(--border-default)' }}>
        <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
          color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
          {type}
        </span>
        {type === 'llm' && (
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', backgroundColor: 'var(--bg-card-inset)',
            padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border-default)',
            maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {workflowNode.config?.model || 'gemini-2.5-flash'}
          </span>
        )}
      </div>

      {type === 'condition' ? (<>
        <Handle type="source" position={Position.Right} id="true" style={{
          width: 14, height: 14, backgroundColor: 'var(--status-success-text)',
          border: '2px solid var(--bg-sidebar)', right: -8, top: '35%',
        }} />
        <Handle type="source" position={Position.Right} id="false" style={{
          width: 14, height: 14, backgroundColor: 'var(--status-failed-text)',
          border: '2px solid var(--bg-sidebar)', right: -8, top: '65%',
        }} />
        <div style={{ fontSize: 10, marginTop: 8, fontFamily: 'var(--font-mono)', textAlign: 'right', paddingRight: 8 }}>
          <div style={{ color: 'var(--status-success-text)', fontWeight: 500 }}>→ true (Yes)</div>
          <div style={{ color: 'var(--status-failed-text)', fontWeight: 500 }}>→ false (No)</div>
        </div>
      </>) : (
        <Handle type="source" position={Position.Right} style={{
          width: 14, height: 14, backgroundColor: 'var(--text-secondary)',
          border: '2px solid var(--bg-sidebar)', right: -8,
        }} />
      )}
    </div>
  );
});

WorkflowFlowNode.displayName = 'WorkflowFlowNode';
export const flowNodeTypes = { workflow: WorkflowFlowNode };
