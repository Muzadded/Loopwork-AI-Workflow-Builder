'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { NodeType } from '@repo/shared-types';
import {
  WorkflowFlowNodeData,
  RUN_STATUS_STYLES,
  NODE_TYPE_ICONS,
} from '../../lib/flow-utils';

const WorkflowFlowNode = memo(({ data }: NodeProps<Node<WorkflowFlowNodeData>>) => {
  const { workflowNode, runStatus, selected } = data;
  const styles = RUN_STATUS_STYLES[runStatus];
  const type = workflowNode.type as NodeType;

  return (
    <div
      className={`w-56 p-4 bg-white rounded-2xl border-2 shadow-md transition-all ${styles.border} ${styles.ring} ${
        selected ? 'shadow-lg' : ''
      }`}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-[#C86D3B] !border-2 !border-white" />

      <div className="flex items-center justify-between text-xs font-bold text-[#2C2622] mb-1 gap-2">
        <span className="flex items-center gap-2 min-w-0">
          <span>{NODE_TYPE_ICONS[type]}</span>
          <span className="truncate">{workflowNode.config?.title || workflowNode.id}</span>
        </span>
        {runStatus !== 'idle' && styles.badge && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${styles.badge}`}>
            {styles.badgeText}
          </span>
        )}
      </div>

      <p className="text-[10px] text-[#8C827A] uppercase font-bold">{type}</p>

      {type === 'llm' && (
        <p className="text-[10px] text-[#786E65] font-mono mt-1 truncate">
          {workflowNode.config?.model || 'gemini-2.5-flash'}
        </p>
      )}

      {type === 'condition' ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white !top-[35%]"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="!w-3 !h-3 !bg-rose-400 !border-2 !border-white !top-[65%]"
          />
          <div className="text-[9px] text-[#8C827A] mt-2 space-y-0.5">
            <div className="text-emerald-600">→ true</div>
            <div className="text-rose-500">→ false</div>
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-[#A89F91]"
        />
      )}
    </div>
  );
});

WorkflowFlowNode.displayName = 'WorkflowFlowNode';

export const flowNodeTypes = {
  workflow: WorkflowFlowNode,
};
