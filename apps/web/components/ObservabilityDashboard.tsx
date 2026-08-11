'use client';

import React, { useEffect, useState } from 'react';
import { WorkflowRunResponse, ApprovalItem } from '@repo/shared-types';

interface ObservabilityDashboardProps {
  onRunSelect?: (runId: string) => void;
  recentRuns?: WorkflowRunResponse[];
  onTriggerNewRun?: () => void;
}

export const ObservabilityDashboard: React.FC<ObservabilityDashboardProps> = ({
  onRunSelect,
  recentRuns = [],
  onTriggerNewRun,
}) => {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchPendingApprovals = async () => {
    try {
      const res = await fetch(`${apiUrl}/approvals/pending`);
      if (res.ok) {
        const data = await res.json();
        setPendingApprovals(data);
      }
    } catch (err) {
      console.error('Failed to fetch pending approvals:', err);
    }
  };

  const resolveApproval = async (id: string, decision: 'approve' | 'reject') => {
    setResolvingId(id);
    try {
      const res = await fetch(`${apiUrl}/approvals/${id}/${decision}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userFeedback: `Manual ${decision} decision from Observability Dashboard.` }),
      });

      if (res.ok) {
        await fetchPendingApprovals();
      }
    } catch (err) {
      alert(`Approval resolution error: ${err}`);
    } finally {
      setResolvingId(null);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#2C2622] tracking-tight">
            Observability Dashboard
          </h1>
          <p className="text-sm text-[#786E65] mt-1 font-sans">
            System health and automation analytics.
          </p>
        </div>

        <button
          onClick={onTriggerNewRun}
          className="px-5 py-2.5 text-xs font-bold text-white bg-[#C86D3B] hover:bg-[#B05B2A] rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          🚀 Execute Workflow Run
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Executions */}
        <div className="bg-[#FFFFFF] border border-[#EAE4D9] rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C827A]">
              TOTAL EXECUTIONS
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#F7F2EA] flex items-center justify-center text-[#C86D3B]">
              ⚙️
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-serif font-bold text-[#2C2622]">1.2M</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              📈 +12.4%
            </span>
          </div>
        </div>

        {/* Avg Success Rate */}
        <div className="bg-[#FFFFFF] border border-[#EAE4D9] rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C827A]">
              AVG. SUCCESS RATE
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#EBF7F0] flex items-center justify-center text-emerald-600">
              ✓
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-serif font-bold text-[#2C2622]">98.7%</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              📈 +0.2%
            </span>
          </div>
        </div>

        {/* Total Token Cost */}
        <div className="bg-[#FFFFFF] border border-[#EAE4D9] rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C827A]">
              TOTAL TOKEN COST
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FEF4EC] flex items-center justify-center text-[#C86D3B]">
              $
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-serif font-bold text-[#2C2622]">$4,520</span>
            <span className="text-xs font-semibold text-[#C86D3B] flex items-center gap-0.5">
              📈 +5.1%
            </span>
          </div>
        </div>

        {/* Human Intervention */}
        <div className="bg-[#FFFFFF] border border-[#EAE4D9] rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C827A]">
              HUMAN INTERVENTION
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FDF0EC] flex items-center justify-center text-rose-600">
              🖐
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-serif font-bold text-[#2C2622]">{pendingApprovals.length} Pending</span>
            <span className="text-xs font-semibold text-amber-600 flex items-center gap-0.5">
              ⚠️ HITL ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Human Approval Inbox (HITL) */}
      {pendingApprovals.length > 0 && (
        <div className="bg-[#FFFFFF] border-2 border-amber-400/60 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-[#EAE4D9] pb-3">
            <h3 className="font-serif font-bold text-lg text-[#2C2622] flex items-center gap-2">
              <span>🛡️ Pending Human Approvals</span>
            </h3>
            <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
              {pendingApprovals.length} Awaiting Review
            </span>
          </div>

          <div className="space-y-3">
            {pendingApprovals.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-[#FEF9F2] border border-amber-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                      Node [{item.nodeId}]
                    </span>
                    <span className="text-xs font-mono text-[#8C827A]">Run: {item.runId.substring(0, 8)}...</span>
                  </div>
                  <p className="text-xs font-semibold text-[#2C2622]">
                    {item.payload?.reason || item.payload?.stepResult?.output?.message || 'Requires manual decision.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => resolveApproval(item.id, 'approve')}
                    disabled={resolvingId === item.id}
                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => resolveApproval(item.id, 'reject')}
                    disabled={resolvingId === item.id}
                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Usage Bar Chart */}
        <div className="bg-[#FFFFFF] border border-[#EAE4D9] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-serif font-bold text-[#2C2622]">Model Usage</h3>
            <div className="flex items-center gap-4 text-xs font-medium text-[#786E65]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C86D3B]" /> GEMINI FLASH
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6B635B]" /> GEMINI PRO
              </span>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2">
            {[
              { day: 'Mon', flash: 45, pro: 35 },
              { day: 'Tue', flash: 55, pro: 30 },
              { day: 'Wed', flash: 50, pro: 40 },
              { day: 'Thu', flash: 65, pro: 20 },
              { day: 'Fri', flash: 75, pro: 20 },
              { day: 'Sat', flash: 60, pro: 30 },
            ].map((bar) => (
              <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full max-w-[48px] rounded-lg overflow-hidden flex flex-col justify-end gap-1 h-full">
                  <div style={{ height: `${bar.pro}%` }} className="bg-[#6B635B] rounded-t-sm" />
                  <div style={{ height: `${bar.flash}%` }} className="bg-[#C86D3B] rounded-b-sm" />
                </div>
                <span className="text-[11px] text-[#8C827A] font-medium">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost over Time Chart */}
        <div className="bg-[#FFFFFF] border border-[#EAE4D9] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-serif font-bold text-[#2C2622]">Cost over Time (USD)</h3>
          </div>

          <div className="h-64 relative flex items-end pt-4">
            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-[#8C827A]">
              <span>$1k</span>
              <span>$500</span>
              <span>$0</span>
            </div>

            <div className="ml-8 w-full h-full relative">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-b border-dashed border-[#EAE4D9] w-full" />
                <div className="border-b border-dashed border-[#EAE4D9] w-full" />
                <div className="border-b border-[#EAE4D9] w-full" />
              </div>

              <svg className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C86D3B" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#C86D3B" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 10 170 C 80 150, 160 110, 240 80 C 320 100, 400 30, 480 10 L 480 200 L 10 200 Z"
                  fill="url(#costGrad)"
                />
                <path
                  d="M 10 170 C 80 150, 160 110, 240 80 C 320 100, 400 30, 480 10"
                  fill="none"
                  stroke="#C86D3B"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                {[
                  { x: 10, y: 170 },
                  { x: 170, y: 105 },
                  { x: 300, y: 80 },
                  { x: 480, y: 10 },
                ].map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="6"
                    fill="#FFFFFF"
                    stroke="#C86D3B"
                    strokeWidth="4"
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Runs Table */}
      <div className="bg-[#FFFFFF] border border-[#EAE4D9] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#EAE4D9] flex justify-between items-center bg-[#FAF7F2]/50">
          <h3 className="text-lg font-serif font-bold text-[#2C2622]">Recent Runs</h3>
          <button className="text-xs font-bold text-[#C86D3B] hover:underline uppercase tracking-wider">
            VIEW ALL
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAE4D9] text-[11px] font-bold uppercase tracking-wider text-[#8C827A] bg-[#FAF7F2]/30">
                <th className="py-3.5 px-6">RUN ID</th>
                <th className="py-3.5 px-6">WORKFLOW</th>
                <th className="py-3.5 px-6">STATUS</th>
                <th className="py-3.5 px-6">DURATION</th>
                <th className="py-3.5 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4D9] text-xs font-medium text-[#2C2622]">
              {[
                { id: 'req_982b...', name: 'Customer_Onboarding_v2', status: 'SUCCESS', duration: '1m 24s', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { id: 'req_771x...', name: 'Data_ETL_Pipeline', status: 'FAILED', duration: '45s', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                { id: 'req_442c...', name: 'Weekly_Report_Gen', status: 'RUNNING', duration: '12s', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { id: 'req_119p...', name: 'Invoice_Processing', status: 'HITL', duration: '-', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-[#FAF7F2]/50 transition-colors">
                  <td className="py-4 px-6 font-mono text-[#786E65]">{row.id}</td>
                  <td className="py-4 px-6 font-semibold">{row.name}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 ${row.color}`}>
                      <span className="w-1.5 h-1.5 rounded-full fill-current" />
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-[#786E65]">{row.duration}</td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => onRunSelect?.(row.id)}
                      className="text-[#C86D3B] hover:text-[#B05B2A] font-bold transition-colors p-1"
                    >
                      ↗
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
