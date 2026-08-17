'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Clock, Zap, ShieldAlert, Check, X, BookOpen, Loader2, Square } from 'lucide-react';
import { ApprovalItem, RunStepResult, WorkflowRunResponse } from '@repo/shared-types';
import { api } from '../lib/api';
import { getNodeTypeIcon } from './icons/NodeIcons';

interface RunTraceViewProps {
  runData?: WorkflowRunResponse | null;
  onRunAgain?: () => void;
  isRunning?: boolean;
  onRunUpdated?: (run: WorkflowRunResponse) => void;
}

function stepBorderColor(status: RunStepResult['status'], runStatus: string, index: number, total: number): string {
  if (status === 'failed')  return 'var(--status-failed-text)';
  if (status === 'success') return 'var(--status-success-text)';
  if (runStatus === 'running' && index === total - 1) return 'var(--accent-primary)';
  return 'var(--border-default)';
}

function stepLabel(status: RunStepResult['status'], latencyMs?: number) {
  if (status === 'failed')  return '✗ Failed';
  if (status === 'retrying') return '↻ Retrying';
  if (status === 'success') return `✓ ${latencyMs ?? 0}ms`;
  return '⋯ Pending';
}

export const RunTraceView: React.FC<RunTraceViewProps> = ({ runData, onRunAgain, isRunning, onRunUpdated }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingApproval, setPending] = useState<ApprovalItem | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (runData?.steps?.length) setExpandedId(runData.steps[runData.steps.length - 1].nodeId);
  }, [runData?.id, runData?.steps?.length]);

  useEffect(() => {
    if (runData?.status !== 'awaiting_approval' || !runData.id) { setPending(null); return; }
    let cancelled = false;
    api.getPendingApprovals().then((items) => { if (!cancelled) setPending(items.find((a) => a.runId === runData.id) ?? null); });
    return () => { cancelled = true; };
  }, [runData?.id, runData?.status]);

  const resolveApproval = useCallback(async (decision: 'approve' | 'reject') => {
    if (!pendingApproval || !runData?.id) return;
    setResolving(true);
    try { await api.resolveApproval(pendingApproval.id, decision); onRunUpdated?.(await api.getRun(runData.id)); }
    catch (err) { alert(String(err)); }
    finally { setResolving(false); }
  }, [pendingApproval, runData?.id, onRunUpdated]);

  const [cancelling, setCancelling] = useState(false);
  const handleCancelRun = useCallback(async () => {
    if (!runData?.id) return;
    setCancelling(true);
    try {
      const updated = await api.cancelRun(runData.id);
      onRunUpdated?.(updated);
    } catch (err) {
      alert(String(err));
    } finally {
      setCancelling(false);
    }
  }, [runData?.id, onRunUpdated]);

  const status = runData?.status ?? 'pending';
  const steps  = runData?.steps  ?? [];

  const cardStyle:  React.CSSProperties = { backgroundColor: 'var(--bg-card)',    border: '1px solid var(--border-default)' };
  const insetStyle: React.CSSProperties = { backgroundColor: 'var(--bg-card-inset)', border: '1px solid var(--border-default)' };
  const sidebarStyle: React.CSSProperties = { backgroundColor: 'var(--bg-sidebar)', borderLeft: '1px solid var(--sidebar-border)' };

  const ctaBtn: React.CSSProperties = {
    padding: '8px 20px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
    backgroundColor: 'var(--accent-primary)', color: 'var(--accent-on-primary)', border: 'none', borderRadius: 12, cursor: 'pointer',
  };

  /* ── Empty State ── */
  if (!runData) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      {/* subtle band */}
      <div style={{ width: '100%', padding: '24px 32px', backgroundColor: 'var(--bg-card-inset)', borderBottom: '1px solid var(--sidebar-border)' }}>
        <p style={{ fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
          Execution Trace
        </p>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Clock className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>No Execution Run Selected</h2>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.7, marginBottom: 24 }}>
          Select an execution run from the Observability Dashboard or trigger a new pipeline run from the canvas.
        </p>
        {onRunAgain && (
          <button onClick={onRunAgain} disabled={isRunning} style={{ ...ctaBtn, opacity: isRunning ? 0.4 : 1 }}>
            {isRunning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Starting Run…</> : <><Zap className="w-3.5 h-3.5" /> Execute Workflow</>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)', overflow: 'hidden', backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>

      {/* Header */}
      <div style={{ height: 64, ...sidebarStyle, borderLeft: 'none', borderBottom: '1px solid var(--sidebar-border)', padding: '0 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-sans)',
            ...insetStyle, padding: '4px 10px', borderRadius: 6, color: 'var(--text-secondary)' }}>RUN ID</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--accent-primary)' }}>{runData.id}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Stats panel = card level */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 12, ...cardStyle, padding: '8px 16px', borderRadius: 12 }}>
            {[
              { label: 'TOTAL LATENCY', val: runData.totalLatencyMs != null ? `${runData.totalLatencyMs}ms` : '—' },
              { label: 'AI COST',       val: `$${(runData.totalCostUsd ?? 0).toFixed(4)}` },
              { label: 'STATUS',        val: status === 'running' || status === 'pending' ? '🔄 RUNNING' : status === 'completed' ? '✓ COMPLETED' : status.toUpperCase() },
            ].map(({ label, val }, i) => (
              <React.Fragment key={label}>
                {i > 0 && <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-default)' }} />}
                <div>
                  <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', display: 'block' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--accent-primary)' }}>{val}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
          {(status === 'running' || status === 'pending' || status === 'awaiting_approval') && (
            <button onClick={handleCancelRun} disabled={cancelling}
              style={{ padding: '8px 16px', fontSize: 12, fontWeight: 500, borderRadius: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--status-failed-bg)',
                color: 'var(--status-failed-text)', border: '1px solid var(--status-failed-text)', opacity: cancelling ? 0.5 : 1, fontFamily: 'var(--font-sans)' }}>
              {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" style={{ fill: 'currentColor' }} />}
              Stop Run
            </button>
          )}
          {onRunAgain && (
            <button onClick={onRunAgain} disabled={isRunning} style={{ ...ctaBtn, opacity: isRunning ? 0.4 : 1 }}>
              {isRunning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Starting…</> : <><Zap className="w-3.5 h-3.5" /> Re-run Pipeline</>}
            </button>
          )}
        </div>
      </div>

      {/* Approval Banner */}
      {status === 'awaiting_approval' && pendingApproval && (
        <div style={{ margin: '16px 24px 0', padding: 16, borderRadius: 16, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16,
          backgroundColor: 'var(--status-pending-bg)', border: '1px solid var(--status-pending-text)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShieldAlert className="w-5 h-5" style={{ color: 'var(--status-pending-text)' }} />
            <div>
              <p style={{ fontWeight: 700, color: 'var(--status-pending-text)', fontSize: 14 }}>Human Approval Required</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {String(pendingApproval.payload?.reason || `Node ${pendingApproval.nodeId} needs review`)}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {[
              { label: 'Approve & Continue', icon: <Check className="w-3.5 h-3.5" />, decision: 'approve' as const,
                bg: 'var(--status-success-bg)', color: 'var(--status-success-text)', border: 'var(--status-success-text)' },
              { label: 'Reject Execution',   icon: <X className="w-3.5 h-3.5" />,     decision: 'reject' as const,
                bg: 'var(--status-failed-bg)',  color: 'var(--status-failed-text)',  border: 'var(--status-failed-text)' },
            ].map(({ label, icon, decision, bg, color, border }) => (
              <button key={decision} onClick={() => resolveApproval(decision)} disabled={resolving}
                style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, backgroundColor: bg, color, border: `1px solid ${border}`, opacity: resolving ? 0.5 : 1 }}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Centre flow diagram */}
        <div className="bg-dots" style={{ flex: 1, backgroundColor: 'var(--bg-page)', overflowY: 'auto', padding: 48, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 384, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {steps.length === 0 && (
              <div style={{ ...cardStyle, borderRadius: 16, padding: 32, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-primary)', margin: '0 auto 12px', animation: 'ping 1s infinite' }} />
                Waiting for execution step stream...
              </div>
            )}
            {steps.map((step, i) => (
              <React.Fragment key={step.nodeId}>
                {i > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ height: 24, borderLeft: `2px dashed ${step.status === 'success' ? 'var(--status-success-text)' : 'var(--border-default)'}` }} />
                  </div>
                )}
                <div style={{ borderRadius: 16, border: `1px solid ${stepBorderColor(step.status, status, i, steps.length)}`,
                  backgroundColor: 'var(--bg-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 700 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span style={{ padding: 6, borderRadius: 8, ...insetStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {getNodeTypeIcon(step.nodeType, 'w-4 h-4')}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>{step.nodeId}</span>
                      <span style={{ fontSize: 10, color: 'var(--accent-primary)', fontFamily: 'monospace' }}>({step.nodeType})</span>
                    </span>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', padding: '4px 10px', borderRadius: 999, ...insetStyle, color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {stepLabel(step.status, step.latencyMs)}
                    </span>
                  </div>
                  {step.output && (
                    <pre style={{ ...insetStyle, padding: 12, borderRadius: 12, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', overflowX: 'auto', maxHeight: 144, lineHeight: 1.6 }}>
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  )}
                  {step.error && (
                    <p style={{ fontSize: 11, fontFamily: 'monospace', padding: 10, borderRadius: 12,
                      backgroundColor: 'var(--status-failed-bg)', color: 'var(--status-failed-text)', border: '1px solid var(--status-failed-text)' }}>
                      ⚠️ {step.error}
                    </p>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Trace Inspector */}
        <div style={{ width: 384, ...sidebarStyle, padding: 24, overflowY: 'auto', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-primary)', fontFamily: 'var(--font-sans)', display: 'block' }}>
              TELEMETRY LOGS
            </span>
            <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)' }}>
              <BookOpen className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} /> Execution Trace
            </h3>
          </div>

          {steps.map((step, i) => {
            const exp = expandedId === step.nodeId;
            return (
              <div key={step.nodeId} onClick={() => setExpandedId(exp ? null : step.nodeId)}
                style={{ borderRadius: 16, border: `1px solid ${exp ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                  backgroundColor: exp ? 'var(--bg-card)' : 'var(--bg-card-inset)',
                  padding: exp ? 16 : 14, cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{i + 1}.</span>
                    {getNodeTypeIcon(step.nodeType, 'w-3.5 h-3.5')}
                    {step.nodeId}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 999,
                    backgroundColor: 'var(--bg-card-inset)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                    {step.latencyMs != null ? `${step.latencyMs}ms` : step.status}
                  </span>
                </div>

                {exp && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
                    {step.input?.model && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>LLM MODEL</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, ...insetStyle, padding: '2px 8px', borderRadius: 6, color: 'var(--accent-primary)' }}>{step.input.model}</span>
                      </div>
                    )}
                    {step.input?.prompt && (
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: 6 }}>PROMPT PAYLOAD</span>
                        <pre style={{ ...insetStyle, padding: 10, borderRadius: 12, fontFamily: 'var(--font-mono)', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                          {String(step.input.prompt)}
                        </pre>
                      </div>
                    )}
                    {(step.tokensUsed != null || step.costUsd != null) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {step.tokensUsed != null && (
                          <div style={{ ...insetStyle, padding: 8, borderRadius: 12 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', display: 'block' }}>TOKENS USED</span>
                            <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{step.tokensUsed}</span>
                          </div>
                        )}
                        {step.costUsd != null && (
                          <div style={{ ...insetStyle, padding: 8, borderRadius: 12 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', display: 'block' }}>STEP COST</span>
                            <span style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>${step.costUsd.toFixed(6)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {step.output && (
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', display: 'block', marginBottom: 6 }}>OUTPUT RESULT</span>
                        <pre style={{ ...insetStyle, padding: 10, borderRadius: 12, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)', overflowX: 'auto', lineHeight: 1.6 }}>
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </div>
                    )}
                    {step.error && (
                      <p style={{ fontFamily: 'monospace', fontSize: 10, padding: 8, borderRadius: 12,
                        backgroundColor: 'var(--status-failed-bg)', color: 'var(--status-failed-text)', border: '1px solid var(--status-failed-text)' }}>
                        {step.error}
                      </p>
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
