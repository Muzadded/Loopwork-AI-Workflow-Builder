'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle2, Coins, ShieldAlert, Zap, Check, X, AlertTriangle } from 'lucide-react';
import { DashboardMetrics, RecentRunItem, ApprovalItem, RunStatus } from '@repo/shared-types';
import { api } from '../lib/api';

interface ObservabilityDashboardProps {
  onRunSelect?: (runId: string) => void;
  onTriggerNewRun?: () => void;
}

function statusStyle(status: RunStatus): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    completed:         { backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success-text)', border: '1px solid var(--status-success-text)' },
    failed:            { backgroundColor: 'var(--status-failed-bg)',  color: 'var(--status-failed-text)',  border: '1px solid var(--status-failed-text)'  },
    running:           { backgroundColor: 'var(--accent-subtle-bg)',  color: 'var(--accent-primary)',       border: '1px solid var(--accent-primary)'       },
    pending:           { backgroundColor: 'var(--bg-card-inset)',     color: 'var(--text-secondary)',        border: '1px solid var(--border-default)'      },
    awaiting_approval: { backgroundColor: 'var(--status-pending-bg)', color: 'var(--status-pending-text)', border: '1px solid var(--status-pending-text)'  },
  };
  return map[status] ?? map.pending;
}

export const ObservabilityDashboard: React.FC<ObservabilityDashboardProps> = ({ onRunSelect, onTriggerNewRun }) => {
  const [metrics,          setMetrics]          = useState<DashboardMetrics | null>(null);
  const [recentRuns,       setRecentRuns]        = useState<RecentRunItem[]>([]);
  const [pendingApprovals, setPendingApprovals]  = useState<ApprovalItem[]>([]);
  const [resolvingId,      setResolvingId]       = useState<string | null>(null);
  const [loading,          setLoading]           = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [m, runs, approvals] = await Promise.all([api.getDashboardMetrics(), api.getRecentRuns(10), api.getPendingApprovals()]);
      setMetrics(m); setRecentRuns(runs); setPendingApprovals(approvals);
    } catch (err) { console.error('Dashboard load failed:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); const t = setInterval(refresh, 5000); return () => clearInterval(t); }, [refresh]);

  const resolveApproval = async (id: string, decision: 'approve' | 'reject') => {
    setResolvingId(id);
    try { await api.resolveApproval(id, decision, `Dashboard ${decision}`); await refresh(); }
    catch (err) { alert(String(err)); }
    finally { setResolvingId(null); }
  };

  const maxModel = metrics ? Math.max(metrics.modelUsage.flash, metrics.modelUsage.pro, 1) : 1;
  const maxCost  = metrics ? Math.max(...metrics.costOverTime.map((d) => d.costUsd), 0.000001) : 1;

  const card: React.CSSProperties = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' };
  const insetStyle: React.CSSProperties = { backgroundColor: 'var(--bg-card-inset)', border: '1px solid var(--border-default)' };

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-medium" style={{ color: 'var(--text-primary)' }}>Observability Dashboard</h1>
          <p className="text-[13px] mt-1 font-normal" style={{ color: 'var(--text-secondary)' }}>
            Real-time execution telemetry, model metrics, cost tracking, and human intervention logs.
          </p>
        </div>
        <button onClick={onTriggerNewRun}
          className="px-5 py-2.5 text-[13px] font-medium rounded-xl transition-all flex items-center gap-2"
          style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--accent-on-primary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-primary)'; }}
        >
          <Zap className="w-3.5 h-3.5 fill-current" /> Trigger Workflow
        </button>
      </div>

      {loading && !metrics && (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: 'var(--accent-primary)' }} />
          Fetching analytics telemetry...
        </div>
      )}

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Executions',  value: String(metrics?.totalRuns ?? 0),               icon: <Activity    className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />   },
          { label: 'Success Rate',      value: `${metrics?.successRate ?? 0}%`,                icon: <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--status-success-text)' }} /> },
          { label: 'Total AI Cost',     value: `$${(metrics?.totalCostUsd ?? 0).toFixed(4)}`, icon: <Coins       className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />   },
          { label: 'Pending Approvals', value: String(metrics?.pendingApprovals ?? pendingApprovals.length), icon: <ShieldAlert className="w-4 h-4" style={{ color: 'var(--status-pending-text)' }} /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="rounded-2xl p-5 transition-all" style={card}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span className="p-2 rounded-xl" style={insetStyle}>{icon}</span>
            </div>
            {/* Metric card large numbers: 22-24px, weight 500, --font-sans (not mono) */}
            <span className="text-[24px] font-medium font-sans tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="rounded-2xl p-6 space-y-4"
          style={{ backgroundColor: 'var(--status-pending-bg)', border: '1px solid var(--status-pending-text)' }}>
          <div className="flex items-center gap-2.5 font-bold text-lg" style={{ color: 'var(--status-pending-text)' }}>
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            Pending Human Approvals ({pendingApprovals.length})
          </div>
          <div className="space-y-3">
            {pendingApprovals.map((item) => (
              <div key={item.id} className="p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                style={{ ...card, borderColor: 'var(--status-pending-text)' }}>
                <div>
                  <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>Run ID: {item.runId.slice(0, 10)}…</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    {String(item.payload?.reason || `Node ${item.nodeId} requires human sign-off`)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => resolveApproval(item.id, 'approve')} disabled={resolvingId === item.id}
                    className="px-4 py-2 text-xs font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                    style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success-text)', border: '1px solid var(--status-success-text)' }}>
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => resolveApproval(item.id, 'reject')} disabled={resolvingId === item.id}
                    className="px-4 py-2 text-xs font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                    style={{ backgroundColor: 'var(--status-failed-bg)', color: 'var(--status-failed-text)', border: '1px solid var(--status-failed-text)' }}>
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Usage */}
        <div className="rounded-2xl p-6 space-y-5" style={card}>
          <div className="flex justify-between items-center">
            <h3 className="text-[16px] font-medium" style={{ color: 'var(--text-primary)' }}>Model Token Usage</h3>
            <span className="text-[11px] font-medium uppercase px-2.5 py-1 rounded-md"
              style={{ ...insetStyle, border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>LLM Distribution</span>
          </div>
          <div className="space-y-4 pt-2">
            {[
              { label: 'Gemini 2.5 Flash', count: metrics?.modelUsage.flash ?? 0 },
              { label: 'Gemini 2.5 Pro',   count: metrics?.modelUsage.pro   ?? 0 },
            ].map((bar) => (
              <div key={bar.label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span style={{ color: 'var(--text-secondary)' }}>{bar.label}</span>
                  <span className="font-mono text-xs" style={{ color: 'var(--accent-primary)' }}>{bar.count} steps</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-card-inset)', border: '1px solid var(--border-strong)' }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(4, (bar.count / maxModel) * 100)}%`, backgroundColor: 'var(--accent-primary)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Telemetry */}
        <div className="rounded-2xl p-6 space-y-5" style={card}>
          <div className="flex justify-between items-center">
            <h3 className="text-[16px] font-medium" style={{ color: 'var(--text-primary)' }}>Cost Telemetry</h3>
            <span className="text-[11px] font-medium uppercase px-2.5 py-1 rounded-md"
              style={{ ...insetStyle, border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>USD / Day</span>
          </div>
          <div className="h-48 flex items-end gap-2 pt-2">
            {(metrics?.costOverTime ?? []).map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="w-full rounded-t transition-colors"
                  style={{ height: `${Math.max(6, (d.costUsd / maxCost) * 100)}%`, backgroundColor: 'var(--accent-primary)' }}
                  title={`$${d.costUsd.toFixed(6)}`} />
                <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>{d.date.slice(5)}</span>
              </div>
            ))}
            {!metrics?.costOverTime.length && (
              <p className="text-xs m-auto font-mono" style={{ color: 'var(--text-muted)' }}>No execution cost telemetry recorded yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Runs Table ── */}
      <div className="rounded-2xl overflow-hidden" style={card}>
        <div className="p-5 flex justify-between items-center"
          style={{ backgroundColor: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-strong)' }}>
          <h3 className="text-[16px] font-medium" style={{ color: 'var(--text-primary)' }}>Recent Workflow Executions</h3>
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Showing latest 10 runs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-card-inset)', borderBottom: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
                className="text-[10px] uppercase font-medium tracking-[0.05em]">
                {['Run ID', 'Workflow Name', 'Status', 'Latency', 'AI Cost', 'Action'].map((h, i) => (
                  <th key={h} className={`py-3.5 px-6 ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ color: 'var(--text-primary)' }}>
              {recentRuns.map((run) => (
                <tr key={run.id} className="transition-colors font-normal text-[13px]"
                  style={{ borderBottom: '1px solid var(--border-default)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card-inset)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}>
                  <td className="py-3.5 px-6 font-mono text-[12px]" style={{ color: 'var(--accent-primary)' }}>{run.id.slice(0, 10)}…</td>
                  <td className="py-3.5 px-6 font-medium">{run.workflowName}</td>
                  <td className="py-3.5 px-6">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-medium" style={statusStyle(run.status)}>
                      {run.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {run.totalLatencyMs != null ? `${run.totalLatencyMs}ms` : '—'}
                  </td>
                  <td className="py-3.5 px-6 font-mono" style={{ color: 'var(--accent-primary)' }}>${(run.totalCostUsd ?? 0).toFixed(4)}</td>
                  <td className="py-3.5 px-6 text-right">
                    <button onClick={() => onRunSelect?.(run.id)}
                      className="px-3 py-1 text-[11px] font-bold rounded-lg transition-all"
                      style={{ color: 'var(--accent-primary)', backgroundColor: 'var(--accent-subtle-bg)', border: '1px solid var(--accent-primary)', opacity: 0.9 }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-on-primary)'; e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-subtle-bg)'; e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.opacity = '0.9'; }}
                    >
                      View Trace
                    </button>
                  </td>
                </tr>
              ))}
              {!recentRuns.length && (
                <tr>
                  <td colSpan={6} className="py-12 text-center font-medium" style={{ color: 'var(--text-muted)' }}>
                    No runs executed yet. Trigger a workflow to inspect execution telemetry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
