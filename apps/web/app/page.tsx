'use client';

import { useState } from 'react';
import { ObservabilityDashboard } from '../components/ObservabilityDashboard';
import { VisualCanvasView } from '../components/VisualCanvasView';
import { RunTraceView } from '../components/RunTraceView';
import { WorkflowDefinition, WorkflowRunResponse } from '@repo/shared-types';

export default function Home() {
  const [activeNav, setActiveNav] = useState<'workflows' | 'history' | 'dashboard' | 'settings'>('workflows');
  const [activeRun, setActiveRun] = useState<WorkflowRunResponse | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleSaveWorkflow = async (def: WorkflowDefinition) => {
    try {
      const res = await fetch(`${apiUrl}/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: def.name, definition: def }),
      });

      if (res.ok) {
        alert(`Workflow "${def.name}" saved successfully to database!`);
      }
    } catch (err) {
      alert(`Save error: ${err}`);
    }
  };

  const handleRunWorkflow = async (def: WorkflowDefinition) => {
    try {
      // 1. Save workflow first
      const saveRes = await fetch(`${apiUrl}/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: def.name, definition: def }),
      });

      let workflowId = def.id;
      if (saveRes.ok) {
        const saved = await saveRes.json();
        workflowId = saved.id;
      }

      // 2. Trigger asynchronous execution run
      const triggerRes = await fetch(`${apiUrl}/workflows/${workflowId}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            ticket_id: 'TCK-8819',
            ticket_text: 'Urgent: Payment processor timing out on checkout page.',
          },
        }),
      });

      if (triggerRes.ok) {
        const data = await triggerRes.json();
        setActiveNav('history');
        pollRunStatus(data.runId);
      }
    } catch (err) {
      alert(`Run trigger error: ${err}`);
    }
  };

  const pollRunStatus = (runId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${apiUrl}/runs/${runId}`);
        if (res.ok) {
          const runData: WorkflowRunResponse = await res.json();
          setActiveRun(runData);
          if (['completed', 'failed', 'awaiting_approval'].includes(runData.status) || attempts >= 10) {
            clearInterval(interval);
          }
        }
      } catch (err) {
        clearInterval(interval);
      }
    }, 1000);
  };

  return (
    <div className="flex min-h-screen bg-[#FAF7F2] text-[#2C2622] font-sans">
      {/* Global Left Navigation Bar */}
      <aside className="w-20 bg-[#FFFFFF] border-r border-[#EAE4D9] flex flex-col justify-between items-center py-5 z-20 shrink-0 select-none">
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Logo / Brand Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#C86D3B] to-[#E68A53] flex items-center justify-center font-bold text-white text-lg shadow-md shadow-[#C86D3B]/20 cursor-pointer">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-3 w-full px-2">
            {[
              { id: 'workflows', label: 'WORKFLOWS', icon: '🔀' },
              { id: 'history', label: 'HISTORY', icon: '⏱️' },
              { id: 'dashboard', label: 'DASHBOARD', icon: '🎛️' },
              { id: 'settings', label: 'SETTINGS', icon: '⚙️' },
            ].map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id as any)}
                  className={`w-full py-3.5 px-1 rounded-xl flex flex-col items-center gap-1 transition-all ${
                    isActive
                      ? 'bg-[#FEF4EC] text-[#C86D3B] font-bold shadow-sm border border-[#FADCC7]'
                      : 'text-[#8C827A] hover:text-[#2C2622] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <span className="text-lg leading-none">{item.icon}</span>
                  <span className="text-[9px] tracking-wider font-bold">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#C86D3B]/20 border border-[#C86D3B]/40 flex items-center justify-center text-xs font-bold text-[#C86D3B]">
          JD
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global Top Bar Header */}
        <header className="h-16 bg-[#FFFFFF] border-b border-[#EAE4D9] px-8 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-serif font-bold text-[#C86D3B] tracking-wide">
              LoopWork
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-[#786E65] hover:text-[#2C2622] rounded-lg transition-colors">
              🔗
            </button>
            <button className="p-2 text-[#786E65] hover:text-[#2C2622] rounded-lg transition-colors">
              ⚙️
            </button>
            <button
              onClick={() => handleSaveWorkflow({ id: 'wf-1', name: 'Support Ticket Triage v1', nodes: [], edges: [] })}
              className="px-4 py-2 text-xs font-semibold text-[#2C2622] bg-[#FFFFFF] border border-[#EAE4D9] hover:bg-[#FAF7F2] rounded-lg transition-all"
            >
              Save
            </button>
            <button
              onClick={() => handleRunWorkflow({ id: 'wf-1', name: 'Support Ticket Triage v1', nodes: [], edges: [] })}
              className="px-5 py-2 text-xs font-bold text-white bg-[#C86D3B] hover:bg-[#B05B2A] rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              Run
            </button>
          </div>
        </header>

        {/* View Switcher */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {activeNav === 'dashboard' && (
            <ObservabilityDashboard
              onRunSelect={() => setActiveNav('history')}
              onTriggerNewRun={() => handleRunWorkflow({ id: 'wf-1', name: 'Support Ticket Triage v1', nodes: [], edges: [] })}
            />
          )}
          {activeNav === 'workflows' && (
            <VisualCanvasView
              onSave={handleSaveWorkflow}
              onRun={handleRunWorkflow}
            />
          )}
          {activeNav === 'history' && (
            <RunTraceView
              runData={activeRun}
              onRunAgain={() => handleRunWorkflow({ id: 'wf-1', name: 'Support Ticket Triage v1', nodes: [], edges: [] })}
            />
          )}
          {activeNav === 'settings' && (
            <div className="p-12 text-center max-w-lg mx-auto space-y-4">
              <h2 className="text-2xl font-serif font-bold text-[#2C2622]">Platform Settings</h2>
              <p className="text-xs text-[#786E65]">Configure API keys, Gemini provider endpoints, and workspace permissions.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
