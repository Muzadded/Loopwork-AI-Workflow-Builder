'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  DashboardMetrics,
  RecentRunItem,
  ApprovalItem,
  RunStatus,
} from '@repo/shared-types';
import { api } from '../lib/api';

interface ObservabilityDashboardProps {
  onRunSelect?: (runId: string) => void;
  onTriggerNewRun?: () => void;
}

function statusBadge(status: RunStatus) {
  const map: Record<string, string> = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-200',
    running: 'bg-blue-50 text-blue-700 border-blue-200',
    pending: 'bg-slate-50 text-slate-700 border-slate-200',
    awaiting_approval: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return map[status] ?? map.pending;
}

export const ObservabilityDashboard: React.FC<ObservabilityDashboardProps> = ({
  onRunSelect,
  onTriggerNewRun,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentRuns, setRecentRuns] = useState<RecentRunItem[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [m, runs, approvals] = await Promise.all([
        api.getDashboardMetrics(),
        api.getRecentRuns(10),
        api.getPendingApprovals(),
      ]);
      setMetrics(m);
      setRecentRuns(runs);
      setPendingApprovals(approvals);
    } catch (err) {
      console.error('Dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const resolveApproval = async (id: string, decision: 'approve' | 'reject') => {
    setResolvingId(id);
    try {
      await api.resolveApproval(id, decision, `Dashboard ${decision}`);
      await refresh();
    } catch (err) {
      alert(String(err));
    } finally {
      setResolvingId(null);
    }
  };

  const maxModel = metrics
    ? Math.max(metrics.modelUsage.flash, metrics.modelUsage.pro, 1)
    : 1;
  const maxCost = metrics
    ? Math.max(...metrics.costOverTime.map((d) => d.costUsd), 0.000001)
    : 1;

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#2C2622]">Observability Dashboard</h1>
          <p className="text-sm text-[#786E65] mt-1">Live metrics from workflow execution data.</p>
        </div>
        <button
          onClick={onTriggerNewRun}
          className="px-5 py-2.5 text-xs font-bold text-white bg-[#C86D3B] hover:bg-[#B05B2A] rounded-xl"
        >
          Run Workflow
        </button>
      </div>

      {loading && !metrics && (
        <p className="text-sm text-[#786E65]">Loading metrics…</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard label="Total Runs" value={String(metrics?.totalRuns ?? 0)} icon="⚙️" />
        <MetricCard
          label="Success Rate"
          value={`${metrics?.successRate ?? 0}%`}
          icon="✓"
        />
        <MetricCard
          label="Total AI Cost"
          value={`$${(metrics?.totalCostUsd ?? 0).toFixed(4)}`}
          icon="$"
        />
        <MetricCard
          label="Pending Approvals"
          value={String(metrics?.pendingApprovals ?? pendingApprovals.length)}
          icon="🛡️"
        />
      </div>

      {pendingApprovals.length > 0 && (
        <div className="bg-white border-2 border-amber-400/60 rounded-2xl p-6 space-y-4">
          <h3 className="font-serif font-bold text-lg">Pending Human Approvals</h3>
          {pendingApprovals.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-[#FEF9F2] border border-amber-200 flex flex-col sm:flex-row justify-between gap-4"
            >
              <div>
                <p className="text-xs font-mono text-[#8C827A]">Run: {item.runId.slice(0, 8)}…</p>
                <p className="text-sm font-semibold mt-1">
                  {String(item.payload?.reason || `Node ${item.nodeId} needs review`)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => resolveApproval(item.id, 'approve')}
                  disabled={resolvingId === item.id}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => resolveApproval(item.id, 'reject')}
                  disabled={resolvingId === item.id}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-lg disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#EAE4D9] rounded-2xl p-6 space-y-4">
          <h3 className="text-xl font-serif font-bold">Model Usage (LLM steps)</h3>
          <div className="space-y-3">
            {[
              { label: 'Gemini Flash', count: metrics?.modelUsage.flash ?? 0, color: 'bg-[#C86D3B]' },
              { label: 'Gemini Pro', count: metrics?.modelUsage.pro ?? 0, color: 'bg-[#6B635B]' },
            ].map((bar) => (
              <div key={bar.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{bar.label}</span>
                  <span className="font-mono">{bar.count}</span>
                </div>
                <div className="h-3 bg-[#FAF7F2] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${bar.color} rounded-full`}
                    style={{ width: `${(bar.count / maxModel) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#EAE4D9] rounded-2xl p-6 space-y-4">
          <h3 className="text-xl font-serif font-bold">Cost over Time</h3>
          <div className="h-48 flex items-end gap-2">
            {(metrics?.costOverTime ?? []).map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div
                  className="w-full bg-[#C86D3B]/80 rounded-t"
                  style={{ height: `${Math.max(4, (d.costUsd / maxCost) * 100)}%` }}
                  title={`$${d.costUsd.toFixed(6)}`}
                />
                <span className="text-[9px] text-[#8C827A]">{d.date.slice(5)}</span>
              </div>
            ))}
            {!metrics?.costOverTime.length && (
              <p className="text-xs text-[#786E65] m-auto">No run data yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#EAE4D9] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#EAE4D9] bg-[#FAF7F2]/50">
          <h3 className="text-lg font-serif font-bold">Recent Runs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAE4D9] text-[10px] uppercase text-[#8C827A]">
                <th className="py-3 px-6">Run ID</th>
                <th className="py-3 px-6">Workflow</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Duration</th>
                <th className="py-3 px-6">Cost</th>
                <th className="py-3 px-6 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4D9]">
              {recentRuns.map((run) => (
                <tr key={run.id} className="hover:bg-[#FAF7F2]/50">
                  <td className="py-3 px-6 font-mono text-[#786E65]">{run.id.slice(0, 10)}…</td>
                  <td className="py-3 px-6 font-semibold">{run.workflowName}</td>
                  <td className="py-3 px-6">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${statusBadge(run.status)}`}>
                      {run.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-[#786E65]">
                    {run.totalLatencyMs != null ? `${run.totalLatencyMs}ms` : '—'}
                  </td>
                  <td className="py-3 px-6 font-mono">${(run.totalCostUsd ?? 0).toFixed(4)}</td>
                  <td className="py-3 px-6 text-right">
                    <button
                      onClick={() => onRunSelect?.(run.id)}
                      className="text-[#C86D3B] font-bold hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!recentRuns.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#786E65]">
                    No runs yet — trigger a workflow to populate metrics.
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

function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-white border border-[#EAE4D9] rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold uppercase text-[#8C827A]">{label}</span>
        <span>{icon}</span>
      </div>
      <span className="text-3xl font-serif font-bold text-[#2C2622]">{value}</span>
    </div>
  );
}
