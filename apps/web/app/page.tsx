'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, GitFork, History, Settings, Layers, Zap, Loader2, Sun, Moon } from 'lucide-react';
import { ObservabilityDashboard } from '../components/ObservabilityDashboard';
import { VisualCanvasView } from '../components/VisualCanvasView';
import { RunTraceView } from '../components/RunTraceView';
import { LoopWorkLogo, LoopWorkNodeIcon } from '../components/icons/LoopWorkLogo';
import { useRunPolling } from '../lib/use-run-polling';
import { useWorkflowStore } from '../store/workflow-store';
import { api } from '../lib/api';

function useTheme() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem('lw-theme');
    if (saved === 'light') { document.documentElement.classList.add('light'); setIsDark(false); }
  }, []);
  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.remove('light');
        localStorage.setItem('lw-theme', 'dark');
      } else {
        document.documentElement.classList.add('light');
        localStorage.setItem('lw-theme', 'light');
      }
      return next;
    });
  }, []);
  return { isDark, toggle };
}

export default function Home() {
  const [activeNav, setActiveNav] = useState<'workflows' | 'history' | 'dashboard' | 'settings'>('workflows');
  const { isDark, toggle: toggleTheme } = useTheme();

  const definition        = useWorkflowStore((s) => s.definition);
  const savedWorkflowId   = useWorkflowStore((s) => s.savedWorkflowId);
  const workflows         = useWorkflowStore((s) => s.workflows);
  const activeRun         = useWorkflowStore((s) => s.activeRun);
  const selectedNodeId    = useWorkflowStore((s) => s.selectedNodeId);
  const isSaving          = useWorkflowStore((s) => s.isSaving);
  const isRunning         = useWorkflowStore((s) => s.isRunning);
  const statusMessage     = useWorkflowStore((s) => s.statusMessage);
  const setDefinition     = useWorkflowStore((s) => s.setDefinition);
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId);
  const setActiveRun      = useWorkflowStore((s) => s.setActiveRun);
  const refreshWorkflowList = useWorkflowStore((s) => s.refreshWorkflowList);
  const handleSave        = useWorkflowStore((s) => s.handleSave);
  const handleRun         = useWorkflowStore((s) => s.handleRun);
  const handleLoad        = useWorkflowStore((s) => s.handleLoad);
  const handleNew         = useWorkflowStore((s) => s.handleNew);
  const { startPolling, stopPolling } = useRunPolling(setActiveRun);

  useEffect(() => { if (activeNav === 'workflows') refreshWorkflowList(); }, [activeNav, refreshWorkflowList]);

  const onRun = useCallback(async () => { await handleRun(startPolling); setActiveNav('history'); }, [handleRun, startPolling]);
  const onRunAgain = useCallback(async () => { await handleRun(startPolling); }, [handleRun, startPolling]);

  const navItems = [
    { id: 'dashboard', label: 'METRICS',  icon: Activity },
    { id: 'workflows', label: 'CANVAS',   icon: GitFork  },
    { id: 'history',   label: 'TRACE',    icon: History  },
    { id: 'settings',  label: 'CONFIG',   icon: Settings },
  ];

  return (
    <div className="flex min-h-screen font-sans antialiased"
      style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>

      {/* ── Sidebar ── */}
      <aside className="w-20 flex flex-col justify-between items-center py-5 z-20 shrink-0 select-none"
        style={{ backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--sidebar-border)' }}>
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Logo Icon mark */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)' }}>
            <LoopWorkNodeIcon mode={isDark ? 'dark' : 'light'} size={28} />
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-2.5 w-full px-2">
            {navItems.map(({ id, label, icon: Icon }) => {
              const active = activeNav === id;
              return (
                <button key={id}
                  onClick={() => setActiveNav(id as typeof activeNav)}
                  className="w-full py-3 px-1 rounded-xl flex flex-col items-center gap-1.5 transition-all duration-200"
                  style={active ? {
                    backgroundColor: 'var(--accent-subtle-bg)',
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--accent-primary)',
                  } : {
                    color: 'var(--text-secondary)',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                >
                  <Icon className="w-5 h-5" style={{ color: active ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
                  <span className="text-[9px] tracking-wider font-medium">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-3">
          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />}
          </button>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--accent-primary)' }}>
            LW
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-16 px-8 flex justify-between items-center z-10 shrink-0"
          style={{ backgroundColor: 'var(--bg-sidebar)', borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="flex items-center gap-4">
            <LoopWorkLogo mode={isDark ? 'dark' : 'light'} size={28} />
            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full uppercase tracking-widest"
              style={{ backgroundColor: 'var(--accent-subtle-bg)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', opacity: 0.8 }}>
              Enterprise v2.0
            </span>
            {statusMessage && (
              <div className="flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-lg"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-primary)' }} />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={isSaving || isRunning}
              className="px-4 py-2 text-xs font-semibold rounded-xl transition-all disabled:opacity-40"
              style={{ color: 'var(--text-primary)', border: '1px solid var(--border-strong)', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card-inset)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            <button onClick={onRun} disabled={isSaving || isRunning}
              className="px-5 py-2 text-[13px] font-medium rounded-xl transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--accent-on-primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-primary)'; }}
            >
              {isRunning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing...</> : <><Zap className="w-3.5 h-3.5 fill-current" /> Execute Run</>}
            </button>
          </div>
        </header>

        {/* View Router */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto" style={{ backgroundColor: 'var(--bg-page)' }}>
          {activeNav === 'dashboard' && (
            <ObservabilityDashboard
              onRunSelect={async (runId) => {
                try { const run = await api.getRun(runId); useWorkflowStore.getState().setActiveRun(run); startPolling(runId); setActiveNav('history'); }
                catch (err) { console.error(err); }
              }}
              onTriggerNewRun={onRun}
            />
          )}
          {activeNav === 'workflows' && (
            <VisualCanvasView
              definition={definition} savedWorkflowId={savedWorkflowId} workflows={workflows}
              activeRun={activeRun} selectedNodeId={selectedNodeId}
              onDefinitionChange={setDefinition} onSelectedNodeIdChange={setSelectedNodeId}
              onLoadWorkflow={handleLoad} onNewWorkflow={() => { stopPolling(); handleNew(); }}
              onSave={handleSave} onRun={onRun} isSaving={isSaving} isRunning={isRunning}
            />
          )}
          {activeNav === 'history' && (
            <RunTraceView runData={activeRun} onRunAgain={onRunAgain} isRunning={isRunning}
              onRunUpdated={(run) => { setActiveRun(run); if (run.status === 'running' || run.status === 'pending') startPolling(run.id); }}
            />
          )}
          {activeNav === 'settings' && (
            <div className="flex-1 flex flex-col">
              <div className="w-full py-6 px-8" style={{ backgroundColor: 'var(--bg-card-inset)', borderBottom: '1px solid var(--border-strong)' }}>
                {/* Section eyebrow label: 11px, weight 500, uppercase, letter-spacing 0.05em */}
                <p className="text-[11px] font-sans uppercase tracking-[0.05em] font-medium" style={{ color: 'var(--text-secondary)' }}>Platform Configuration</p>
              </div>
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="w-full max-w-xl space-y-6 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                    <Settings className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <h2 className="text-[24px] font-medium" style={{ color: 'var(--text-primary)' }}>Platform Configuration</h2>
                  <div className="p-6 rounded-2xl text-left space-y-3"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                    {[
                      { label: 'API Endpoint',        val: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', isAccent: true },
                      { label: 'Environment',         val: 'Development (Redis + Worker)',                             isAccent: false },
                      { label: 'Orchestrator Engine', val: 'Gemini AI Orchestrator v2',                               isAccent: true },
                    ].map(({ label, val, isAccent }) => (
                      <div key={label} className="flex justify-between items-center text-xs">
                        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{label}:</span>
                        <span className="font-mono px-3 py-1 rounded-lg font-normal"
                          style={{ color: isAccent ? 'var(--accent-primary)' : 'var(--status-success-text)', backgroundColor: 'var(--bg-card-inset)', border: '1px solid var(--border-strong)' }}>
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
