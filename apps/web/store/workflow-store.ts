import { create } from 'zustand';
import { WorkflowDefinition, WorkflowListItem, WorkflowRunResponse } from '@repo/shared-types';
import { api, DEFAULT_RUN_INPUT } from '../lib/api';
import { createDefaultWorkflow } from '../lib/default-workflow';

interface WorkflowStore {
  definition: WorkflowDefinition;
  savedWorkflowId: string | null;
  workflows: WorkflowListItem[];
  activeRun: WorkflowRunResponse | null;
  selectedNodeId: string | null;
  isSaving: boolean;
  isRunning: boolean;
  statusMessage: string | null;

  setDefinition: (def: WorkflowDefinition) => void;
  setSelectedNodeId: (id: string | null) => void;
  setActiveRun: (run: WorkflowRunResponse | null) => void;
  setStatusMessage: (msg: string | null) => void;

  refreshWorkflowList: () => Promise<void>;
  handleSave: () => Promise<void>;
  handleRun: (startPolling: (runId: string) => void) => Promise<void>;
  handleLoad: (id: string) => Promise<void>;
  handleNew: () => void;
}

const initialWorkflow = createDefaultWorkflow();

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  definition: initialWorkflow,
  savedWorkflowId: null,
  workflows: [],
  activeRun: null,
  selectedNodeId: initialWorkflow.nodes[0]?.id ?? null,
  isSaving: false,
  isRunning: false,
  statusMessage: null,

  setDefinition: (def) => set({ definition: def }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setActiveRun: (run) => set({ activeRun: run }),
  setStatusMessage: (msg) => set({ statusMessage: msg }),

  refreshWorkflowList: async () => {
    try {
      const list = await api.listWorkflows();
      set({ workflows: list });
    } catch (err) {
      console.error('Failed to load workflows:', err);
    }
  },

  handleSave: async () => {
    const { definition, savedWorkflowId } = get();
    set({ isSaving: true, statusMessage: null });
    try {
      const saved = await api.saveWorkflow(savedWorkflowId, definition);
      set({
        savedWorkflowId: saved.id,
        definition: { ...saved.definition, id: saved.id, name: saved.name },
        statusMessage: `Saved "${saved.name}"`,
      });
      await get().refreshWorkflowList();
    } catch (err) {
      set({ statusMessage: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      set({ isSaving: false });
    }
  },

  handleRun: async (startPolling) => {
    const { definition, savedWorkflowId } = get();
    set({ isRunning: true, statusMessage: null });
    try {
      const saved = await api.saveWorkflow(savedWorkflowId, definition);
      set({
        savedWorkflowId: saved.id,
        definition: { ...saved.definition, id: saved.id, name: saved.name },
      });

      const trigger = await api.triggerRun(saved.id, { input: DEFAULT_RUN_INPUT });
      set({ activeRun: null, statusMessage: 'Run started' });
      startPolling(trigger.runId);
      await get().refreshWorkflowList();
    } catch (err) {
      set({ statusMessage: err instanceof Error ? err.message : 'Run failed' });
    } finally {
      set({ isRunning: false });
    }
  },

  handleLoad: async (id) => {
    if (!id) return;
    try {
      const wf = await api.getWorkflow(id);
      set({
        savedWorkflowId: wf.id,
        definition: { ...wf.definition, id: wf.id, name: wf.name },
        selectedNodeId: wf.definition.nodes[0]?.id ?? null,
        statusMessage: `Loaded "${wf.name}"`,
      });
    } catch (err) {
      set({ statusMessage: err instanceof Error ? err.message : 'Load failed' });
    }
  },

  handleNew: () => {
    const def = { ...createDefaultWorkflow(), id: `wf-${Date.now()}` };
    set({
      savedWorkflowId: null,
      definition: def,
      selectedNodeId: def.nodes[0]?.id ?? null,
      activeRun: null,
      statusMessage: 'New draft workflow',
    });
  },
}));
