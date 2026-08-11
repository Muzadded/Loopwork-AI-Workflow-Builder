'use client';

import { useCallback, useEffect, useState } from 'react';
import { ObservabilityDashboard } from '../components/ObservabilityDashboard';
import { VisualCanvasView } from '../components/VisualCanvasView';
import { RunTraceView } from '../components/RunTraceView';
import { useRunPolling } from '../lib/use-run-polling';
import { useWorkflowStore } from '../store/workflow-store';
import { api } from '../lib/api';

export default function Home() {
  const [activeNav, setActiveNav] = useState<'workflows' | 'history' | 'dashboard' | 'settings'>('workflows');

  const definition = useWorkflowStore((s) => s.definition);
  const savedWorkflowId = useWorkflowStore((s) => s.savedWorkflowId);
  const workflows = useWorkflowStore((s) => s.workflows);
  const activeRun = useWorkflowStore((s) => s.activeRun);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const isSaving = useWorkflowStore((s) => s.isSaving);
  const isRunning = useWorkflowStore((s) => s.isRunning);
  const statusMessage = useWorkflowStore((s) => s.statusMessage);

  const setDefinition = useWorkflowStore((s) => s.setDefinition);
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId);
  const setActiveRun = useWorkflowStore((s) => s.setActiveRun);
  const refreshWorkflowList = useWorkflowStore((s) => s.refreshWorkflowList);
  const handleSave = useWorkflowStore((s) => s.handleSave);
  const handleRun = useWorkflowStore((s) => s.handleRun);
  const handleLoad = useWorkflowStore((s) => s.handleLoad);
  const handleNew = useWorkflowStore((s) => s.handleNew);

  const { startPolling, stopPolling } = useRunPolling(setActiveRun);

  useEffect(() => {
    if (activeNav === 'workflows') {
      refreshWorkflowList();
    }
  }, [activeNav, refreshWorkflowList]);

  const onRun = useCallback(async () => {
    await handleRun(startPolling);
    setActiveNav('history');
  }, [handleRun, startPolling]);

  const onRunAgain = useCallback(async () => {
    await handleRun(startPolling);
  }, [handleRun, startPolling]);

  return (
    <div className="flex min-h-screen bg-[#FAF7F2] text-[#2C2622] font-sans">
      <aside className="w-20 bg-[#FFFFFF] border-r border-[#EAE4D9] flex flex-col justify-between items-center py-5 z-20 shrink-0 select-none">
        <div className="flex flex-col items-center gap-8 w-full">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#C86D3B] to-[#E68A53] flex items-center justify-center font-bold text-white text-lg shadow-md shadow-[#C86D3B]/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>

          <nav className="flex flex-col gap-3 w-full px-2">
            {[
              { id: 'workflows', label: 'WORKFLOWS', icon: '🔀' },
              { id: 'history', label: 'HISTORY', icon: '⏱️' },
              { id: 'dashboard', label: 'DASHBOARD', icon: '🎛️' },
              { id: 'settings', label: 'SETTINGS', icon: '⚙️' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id as typeof activeNav)}
                className={`w-full py-3.5 px-1 rounded-xl flex flex-col items-center gap-1 transition-all ${
                  activeNav === item.id
                    ? 'bg-[#FEF4EC] text-[#C86D3B] font-bold shadow-sm border border-[#FADCC7]'
                    : 'text-[#8C827A] hover:text-[#2C2622] hover:bg-[#FAF7F2]'
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="text-[9px] tracking-wider font-bold">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="w-9 h-9 rounded-full bg-[#C86D3B]/20 border border-[#C86D3B]/40 flex items-center justify-center text-xs font-bold text-[#C86D3B]">
          JD
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[#FFFFFF] border-b border-[#EAE4D9] px-8 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-serif font-bold text-[#C86D3B] tracking-wide">LoopWork</h1>
            {statusMessage && (
              <span className="text-[11px] text-[#786E65] bg-[#FAF7F2] px-3 py-1 rounded-lg border border-[#EAE4D9]">
                {statusMessage}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving || isRunning}
              className="px-4 py-2 text-xs font-semibold border border-[#EAE4D9] rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={onRun}
              disabled={isSaving || isRunning}
              className="px-5 py-2 text-xs font-bold text-white bg-[#C86D3B] hover:bg-[#B05B2A] rounded-lg disabled:opacity-50"
            >
              {isRunning ? 'Starting…' : 'Run'}
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {activeNav === 'dashboard' && (
            <ObservabilityDashboard
              onRunSelect={async (runId) => {
                try {
                  const run = await api.getRun(runId);
                  useWorkflowStore.getState().setActiveRun(run);
                  startPolling(runId);
                  setActiveNav('history');
                } catch (err) {
                  console.error(err);
                }
              }}
              onTriggerNewRun={onRun}
            />
          )}
          {activeNav === 'workflows' && (
            <VisualCanvasView
              definition={definition}
              savedWorkflowId={savedWorkflowId}
              workflows={workflows}
              activeRun={activeRun}
              selectedNodeId={selectedNodeId}
              onDefinitionChange={setDefinition}
              onSelectedNodeIdChange={setSelectedNodeId}
              onLoadWorkflow={handleLoad}
              onNewWorkflow={() => {
                stopPolling();
                handleNew();
              }}
              onSave={handleSave}
              onRun={onRun}
              isSaving={isSaving}
              isRunning={isRunning}
            />
          )}
          {activeNav === 'history' && (
            <RunTraceView
              runData={activeRun}
              onRunAgain={onRunAgain}
              isRunning={isRunning}
              onRunUpdated={(run) => {
                setActiveRun(run);
                if (run.status === 'running' || run.status === 'pending') {
                  startPolling(run.id);
                }
              }}
            />
          )}
          {activeNav === 'settings' && (
            <div className="p-12 text-center max-w-lg mx-auto space-y-4">
              <h2 className="text-2xl font-serif font-bold">Platform Settings</h2>
              <p className="text-xs text-[#786E65]">
                API: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
