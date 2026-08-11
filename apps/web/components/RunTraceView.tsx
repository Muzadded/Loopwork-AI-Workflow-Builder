'use client';

import React, { useEffect, useState } from 'react';
import { WorkflowRunResponse } from '@repo/shared-types';

interface RunTraceViewProps {
  runData?: WorkflowRunResponse | null;
  onRunAgain?: () => void;
}

export const RunTraceView: React.FC<RunTraceViewProps> = ({ runData: initialRunData, onRunAgain }) => {
  const [runData, setRunData] = useState<WorkflowRunResponse | null>(initialRunData || null);
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const executeLiveRun = async () => {
    setLoading(true);
    try {
      // 1. Fetch available workflows
      const wfRes = await fetch(`${apiUrl}/workflows`);
      if (!wfRes.ok) throw new Error('No workflows available');
      const workflows = await wfRes.json();

      let targetId = workflows.length > 0 ? workflows[0].id : null;

      // Create workflow if none exists
      if (!targetId) {
        const createRes = await fetch(`${apiUrl}/workflows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Customer Support Triage Pipeline',
            definition: {
              id: `wf-${Date.now()}`,
              name: 'Support Ticket Triage v1',
              nodes: [
                { id: 'intake', type: 'trigger', config: {} },
                {
                  id: 'classifier',
                  type: 'llm',
                  config: { prompt: 'Classify ticket: {{input.ticket}}', confidenceThreshold: 0.9 },
                },
              ],
              edges: [{ id: 'e1', source: 'intake', target: 'classifier' }],
            },
          }),
        });
        if (createRes.ok) {
          const created = await createRes.json();
          targetId = created.id;
        }
      }

      if (!targetId) return;

      // 2. Trigger workflow run
      const triggerRes = await fetch(`${apiUrl}/workflows/${targetId}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            ticket: 'Cannot log into portal. Password reset email is not arriving.',
            customer: 'client@company.com',
          },
        }),
      });

      if (triggerRes.ok) {
        const trigData = await triggerRes.json();
        pollRun(trigData.runId);
      }
    } catch (err) {
      console.error('Trigger execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  const pollRun = (runId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${apiUrl}/runs/${runId}`);
        if (res.ok) {
          const data: WorkflowRunResponse = await res.json();
          setRunData(data);
          if (['completed', 'failed', 'awaiting_approval'].includes(data.status) || attempts >= 10) {
            clearInterval(interval);
          }
        }
      } catch (err) {
        clearInterval(interval);
      }
    }, 1000);
  };

  useEffect(() => {
    if (!runData) {
      executeLiveRun();
    }
  }, []);

  const runId = runData?.id || 'run-9a8b-4c2d';
  const status = runData?.status || 'running';

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-[#FAF7F2]">
      {/* Top Header Metrics Bar */}
      <div className="h-16 bg-[#FFFFFF] border-b border-[#EAE4D9] px-6 flex justify-between items-center z-10 select-none">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[#786E65]">Execution ID: {runId}</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-6 text-xs bg-[#FAF7F2] px-4 py-2 rounded-xl border border-[#EAE4D9]">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#8C827A] block">TOTAL TIME</span>
              <span className="font-mono font-bold text-[#C86D3B]">
                {runData ? `${runData.totalLatencyMs || 2400}ms` : '2.4s'}
              </span>
            </div>
            <div className="h-6 w-px bg-[#EAE4D9]" />
            <div>
              <span className="text-[10px] font-bold uppercase text-[#8C827A] block">TOTAL COST</span>
              <span className="font-mono font-bold text-[#2C2622]">
                ${(runData?.totalCostUsd || 0.0042).toFixed(4)}
              </span>
            </div>
            <div className="h-6 w-px bg-[#EAE4D9]" />
            <div>
              <span className="text-[10px] font-bold uppercase text-[#8C827A] block">STATUS</span>
              <span className="font-bold text-[#C86D3B] flex items-center gap-1">
                {status === 'running' ? '🔄 RUNNING' : status === 'completed' ? '✓ COMPLETED' : '⚠️ ' + status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-[#786E65] hover:text-[#2C2622]">⚙️</button>
            <button className="px-4 py-2 text-xs font-semibold text-[#2C2622] bg-[#FFFFFF] border border-[#EAE4D9] rounded-lg">
              Stop
            </button>
            <button
              onClick={executeLiveRun}
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#C86D3B] hover:bg-[#B05B2A] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              {loading ? '⚡ Running...' : '► Run Again'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Interactive Canvas Trace */}
        <div className="flex-1 bg-dots bg-[#FAF7F2] relative overflow-auto p-12 flex justify-center select-none">
          <div className="relative w-80 space-y-8">
            {/* Step 1: Email Intake */}
            <div className="bg-[#FFFFFF] rounded-2xl border-2 border-emerald-500 p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-[#2C2622]">
                <span className="flex items-center gap-2">
                  <span>✉️</span> Email Intake
                </span>
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-mono">
                  ✓ 120ms
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block">PAYLOAD</span>
                <pre className="p-2.5 rounded-xl bg-[#FAF7F2] text-[11px] font-mono text-[#2C2622] border border-[#EAE4D9] overflow-x-auto">
                  {JSON.stringify(runData?.steps[0]?.input || { subject: 'Login Issue', body: 'Cannot log into portal' }, null, 2)}
                </pre>
              </div>
            </div>

            {/* Vertical Connector Line 1 */}
            <div className="w-full flex justify-center">
              <div className="h-8 border-l-2 border-dashed border-emerald-500" />
            </div>

            {/* Step 2: Gemini Classifier */}
            <div className="bg-[#FFFFFF] rounded-2xl border-2 border-[#C86D3B] p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-[#2C2622]">
                <span className="flex items-center gap-2">
                  <span className="text-[#C86D3B]">🤖</span> Gemini Classifier
                </span>
                <span className="text-[#C86D3B] bg-[#FEF4EC] border border-[#FADCC7] px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-mono">
                  {status === 'completed' ? '✓ Success' : '🔄 Running'}
                </span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block">MODEL</span>
                  <span className="font-mono text-[#C86D3B] font-semibold">gemini-1.5-pro</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block">PROMPT TEMPLATE</span>
                  <div className="p-2.5 rounded-xl bg-[#FAF7F2] font-sans text-[#786E65] border border-[#EAE4D9]">
                    Classify the following support ticket into: [Billing, Technical, Account]...
                  </div>
                </div>
              </div>
            </div>

            {/* Vertical Connector Line 2 */}
            <div className="w-full flex justify-center">
              <div className="h-8 border-l-2 border-dashed border-[#EAE4D9]" />
            </div>

            {/* Step 3: Route by Category */}
            <div className="bg-[#FFFFFF]/60 rounded-2xl border border-[#EAE4D9] p-5 space-y-2 opacity-75">
              <div className="flex justify-between items-center text-xs font-bold text-[#2C2622]">
                <span className="flex items-center gap-2">
                  <span>🔀</span> Route by Category
                </span>
                <span className="text-[#8C827A] bg-[#F7F2EA] px-2 py-0.5 rounded text-[10px] font-mono">
                  {status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </div>
              <div className="h-2 w-3/4 bg-[#EAE4D9] rounded-full" />
              <div className="h-2 w-1/2 bg-[#EAE4D9] rounded-full" />
            </div>
          </div>
        </div>

        {/* Right Run Trace Sidebar */}
        <div className="w-96 bg-[#FFFFFF] border-l border-[#EAE4D9] p-6 space-y-6 overflow-y-auto shadow-lg z-10">
          <div className="flex justify-between items-center border-b border-[#EAE4D9] pb-4">
            <h3 className="font-serif font-bold text-lg text-[#2C2622] flex items-center gap-2">
              📖 Run Trace
            </h3>
            <button className="text-[#8C827A] hover:text-[#2C2622]">↗</button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Step 1 Accordion Item */}
            <div className="bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl p-4 flex justify-between items-center font-semibold text-[#2C2622]">
              <span className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span> 1. Email Intake
              </span>
              <span className="text-[#8C827A] font-mono text-[11px]">120ms</span>
            </div>

            {/* Step 2 Accordion Item (Expanded) */}
            <div className="bg-[#FFFFFF] border-2 border-[#C86D3B] rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center font-bold text-[#2C2622]">
                <span className="flex items-center gap-2">
                  <span className="text-[#C86D3B]">🔄</span> 2. Gemini Classifier
                </span>
                <span className="text-[#C86D3B] font-mono text-[11px]">
                  {runData?.steps[1]?.latencyMs ? `${runData.steps[1].latencyMs}ms` : '2.28s'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F7F2EA] text-[10px]">
                <div>
                  <span className="text-[#8C827A] block font-bold">MODEL</span>
                  <span className="font-mono text-[#C86D3B]">gemini-1.5-pro</span>
                </div>
                <div>
                  <span className="text-[#8C827A] block font-bold">TOKENS</span>
                  <span className="font-mono text-[#2C2622]">
                    {runData?.totalTokensUsed || 480} IN/OUT
                  </span>
                </div>
                <div>
                  <span className="text-[#8C827A] block font-bold">COST</span>
                  <span className="font-mono text-[#2C2622]">
                    ${(runData?.totalCostUsd || 0.0042).toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] block">
                  COMPILED PROMPT
                </span>
                <pre className="p-3 rounded-xl bg-[#FAF7F2] text-[11px] font-mono text-[#2C2622] border border-[#EAE4D9] whitespace-pre-wrap leading-relaxed">
{`System: You are an expert IT triage assistant.
Task: Classify the user email into one category: [BILLING, TECHNICAL, ACCOUNT]

User Email Subject: Cannot log into portal
User Email Body: Hi, I've tried resetting my password 3 times...`}
                </pre>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C86D3B] block">
                  RESPONSE STREAM
                </span>
                <pre className="p-3 rounded-xl bg-[#FEF4EC] text-[11px] font-mono text-[#C86D3B] border border-[#FADCC7] whitespace-pre-wrap leading-relaxed overflow-x-auto">
{runData?.steps[1]?.output ? JSON.stringify(runData.steps[1].output, null, 2) : `{
  "category": "ACCOUNT",
  "confidence": 0.98,
  "reasoning": "User explicitly states inability to access account portal..."
}`}
                </pre>
              </div>
            </div>

            {/* Step 3 Accordion Item */}
            <div className="bg-[#FAF7F2] border border-[#EAE4D9] rounded-xl p-4 flex justify-between items-center text-[#8C827A]">
              <span className="flex items-center gap-2 font-medium">
                <span>⋯</span> 3. Route by Category
              </span>
              <span className="font-mono text-[11px]">{status === 'completed' ? 'Done' : 'Pending'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
