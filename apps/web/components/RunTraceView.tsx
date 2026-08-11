'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ApprovalItem, RunStepResult, WorkflowRunResponse } from '@repo/shared-types';
import { api } from '../lib/api';

interface RunTraceViewProps {
  runData?: WorkflowRunResponse | null;
  onRunAgain?: () => void;
  isRunning?: boolean;
  onRunUpdated?: (run: WorkflowRunResponse) => void;
}

const NODE_ICONS: Record<string, string> = {
  trigger: '⚡',
  llm: '🤖',
  condition: '🔀',
  action: '📝',
  approval: '🛡️',
};

function stepBorderClass(status: RunStepResult['status'], runStatus: string, index: number, total: number) {
  if (status === 'failed') return 'border-rose-500';
  if (status === 'success') return 'border-emerald-500';
  if (runStatus === 'running' && index === total - 1) return 'border-[#C86D3B]';
  return 'border-[#EAE4D9]';
}

function stepStatusLabel(status: RunStepResult['status'], latencyMs?: number) {
  if (status === 'failed') return '✗ Failed';
  if (status === 'retrying') return '↻ Retrying';
  if (status === 'success') return `✓ ${latencyMs ?? 0}ms`;
  return '⋯ Pending';
}

export const RunTraceView: React.FC<RunTraceViewProps> = ({
  runData,
  onRunAgain,
  isRunning,
  onRunUpdated,
}) => {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState<ApprovalItem | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (runData?.steps?.length) {
      setExpandedStepId(runData.steps[runData.steps.length - 1].nodeId);
    }
  }, [runData?.id, runData?.steps?.length]);

  useEffect(() => {
    if (runData?.status !== 'awaiting_approval' || !runData.id) {
      setPendingApproval(null);
      return;
    }

    let cancelled = false;
    api.getPendingApprovals().then((items) => {
      if (cancelled) return;
      setPendingApproval(items.find((a) => a.runId === runData.id) ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [runData?.id, runData?.status]);

  const resolveApproval = useCallback(
    async (decision: 'approve' | 'reject') => {
      if (!pendingApproval || !runData?.id) return;
      setResolving(true);
      try {
        await api.resolveApproval(pendingApproval.id, decision);
        const run = await api.getRun(runData.id);
        onRunUpdated?.(run);
      } catch (err) {
        alert(String(err));
      } finally {
        setResolving(false);
      }
    },
    [pendingApproval, runData?.id, onRunUpdated],
  );

  const runId = runData?.id;
  const status = runData?.status ?? 'pending';
  const steps = runData?.steps ?? [];

  if (!runData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[calc(100vh-65px)] bg-[#FAF7F2] text-center p-12">
        <h2 className="text-xl font-serif font-bold text-[#2C2622] mb-2">No run selected</h2>
        <p className="text-sm text-[#786E65] mb-6">
          Save a workflow and click Run, or trigger a run from the dashboard.
        </p>
        {onRunAgain && (
          <button
            onClick={onRunAgain}
            disabled={isRunning}
            className="px-5 py-2 text-xs font-bold text-white bg-[#C86D3B] hover:bg-[#B05B2A] rounded-lg disabled:opacity-50"
          >
            {isRunning ? 'Starting…' : '► Run Workflow'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-[#FAF7F2]">
      <div className="h-16 bg-[#FFFFFF] border-b border-[#EAE4D9] px-6 flex justify-between items-center z-10 select-none">
        <span className="font-mono text-xs text-[#786E65]">Execution ID: {runId}</span>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-6 text-xs bg-[#FAF7F2] px-4 py-2 rounded-xl border border-[#EAE4D9]">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#8C827A] block">TOTAL TIME</span>
              <span className="font-mono font-bold text-[#C86D3B]">
                {runData.totalLatencyMs != null ? `${runData.totalLatencyMs}ms` : '—'}
              </span>
            </div>
            <div className="h-6 w-px bg-[#EAE4D9]" />
            <div>
              <span className="text-[10px] font-bold uppercase text-[#8C827A] block">TOTAL COST</span>
              <span className="font-mono font-bold text-[#2C2622]">
                ${(runData.totalCostUsd ?? 0).toFixed(4)}
              </span>
            </div>
            <div className="h-6 w-px bg-[#EAE4D9]" />
            <div>
              <span className="text-[10px] font-bold uppercase text-[#8C827A] block">STATUS</span>
              <span className="font-bold text-[#C86D3B]">
                {status === 'running' || status === 'pending'
                  ? '🔄 RUNNING'
                  : status === 'completed'
                    ? '✓ COMPLETED'
                    : status.toUpperCase()}
              </span>
            </div>
          </div>

          {onRunAgain && (
            <button
              onClick={onRunAgain}
              disabled={isRunning}
              className="px-5 py-2 text-xs font-bold text-white bg-[#C86D3B] hover:bg-[#B05B2A] rounded-lg shadow-sm disabled:opacity-50"
            >
              {isRunning ? 'Starting…' : '► Run Again'}
            </button>
          )}
        </div>
      </div>

      {status === 'awaiting_approval' && pendingApproval && (
        <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-sm font-bold text-amber-900">Awaiting human approval</p>
            <p className="text-xs text-amber-800 mt-1">
              {String(pendingApproval.payload?.reason || `Node ${pendingApproval.nodeId} needs review`)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => resolveApproval('approve')}
              disabled={resolving}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg disabled:opacity-50"
            >
              Approve & Continue
            </button>
            <button
              onClick={() => resolveApproval('reject')}
              disabled={resolving}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-lg disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 bg-dots bg-[#FAF7F2] relative overflow-auto p-12 flex justify-center select-none">
          <div className="relative w-80 space-y-4">
            {steps.length === 0 && (
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE4D9] p-6 text-center text-sm text-[#786E65]">
                Waiting for steps…
              </div>
            )}
            {steps.map((step, index) => (
              <React.Fragment key={step.nodeId}>
                {index > 0 && (
                  <div className="w-full flex justify-center">
                    <div
                      className={`h-6 border-l-2 border-dashed ${
                        step.status === 'success' ? 'border-emerald-500' : 'border-[#EAE4D9]'
                      }`}
                    />
                  </div>
                )}
                <div
                  className={`bg-[#FFFFFF] rounded-2xl border-2 p-5 shadow-sm space-y-3 ${stepBorderClass(step.status, status, index, steps.length)}`}
                >
                  <div className="flex justify-between items-center text-xs font-bold text-[#2C2622]">
                    <span className="flex items-center gap-2">
                      <span>{NODE_ICONS[step.nodeType] ?? '•'}</span>
                      {step.nodeId}
                      <span className="text-[#8C827A] font-normal">({step.nodeType})</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#EAE4D9]">
                      {stepStatusLabel(step.status, step.latencyMs)}
                    </span>
                  </div>
                  {step.output && (
                    <pre className="p-2.5 rounded-xl bg-[#FAF7F2] text-[10px] font-mono text-[#2C2622] border border-[#EAE4D9] overflow-x-auto max-h-32">
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  )}
                  {step.error && (
                    <p className="text-[11px] text-rose-600 font-mono">{step.error}</p>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="w-96 bg-[#FFFFFF] border-l border-[#EAE4D9] p-6 space-y-4 overflow-y-auto shadow-lg z-10">
          <h3 className="font-serif font-bold text-lg text-[#2C2622] border-b border-[#EAE4D9] pb-4">
            📖 Run Trace
          </h3>

          {steps.map((step, index) => {
            const isExpanded = expandedStepId === step.nodeId;
            return (
              <div
                key={step.nodeId}
                className={`rounded-xl border transition-all ${
                  isExpanded
                    ? 'border-[#C86D3B] bg-[#FFFFFF] p-4 shadow-sm'
                    : 'border-[#EAE4D9] bg-[#FAF7F2] p-3 cursor-pointer hover:border-[#C86D3B]/50'
                }`}
                onClick={() => setExpandedStepId(isExpanded ? null : step.nodeId)}
              >
                <div className="flex justify-between items-center text-xs font-semibold text-[#2C2622]">
                  <span>
                    {index + 1}. {NODE_ICONS[step.nodeType]} {step.nodeId}
                  </span>
                  <span className="text-[#8C827A] font-mono text-[10px]">
                    {step.latencyMs != null ? `${step.latencyMs}ms` : step.status}
                  </span>
                </div>

                {isExpanded && (
                  <div className="mt-3 space-y-3 text-[11px] border-t border-[#F7F2EA] pt-3">
                    {step.input?.model && (
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#8C827A]">Model</span>
                        <p className="font-mono text-[#C86D3B]">{step.input.model}</p>
                      </div>
                    )}
                    {step.input?.prompt && (
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#8C827A]">Prompt</span>
                        <pre className="p-2 rounded-lg bg-[#FAF7F2] font-mono text-[10px] whitespace-pre-wrap mt-1">
                          {String(step.input.prompt)}
                        </pre>
                      </div>
                    )}
                    {(step.tokensUsed != null || step.costUsd != null) && (
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {step.tokensUsed != null && (
                          <div>
                            <span className="text-[#8C827A] font-bold block">TOKENS</span>
                            <span className="font-mono">{step.tokensUsed}</span>
                          </div>
                        )}
                        {step.costUsd != null && (
                          <div>
                            <span className="text-[#8C827A] font-bold block">COST</span>
                            <span className="font-mono">${step.costUsd.toFixed(6)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {step.output && (
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#8C827A]">Output</span>
                        <pre className="p-2 rounded-lg bg-[#FEF4EC] font-mono text-[10px] overflow-x-auto mt-1">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </div>
                    )}
                    {step.error && (
                      <p className="text-rose-600 font-mono text-[10px]">{step.error}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
