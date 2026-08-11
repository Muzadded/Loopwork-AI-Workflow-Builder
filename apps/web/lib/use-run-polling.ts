'use client';

import { useCallback, useEffect, useRef } from 'react';
import { WorkflowRunResponse } from '@repo/shared-types';
import { api, TERMINAL_RUN_STATUSES } from './api';

export function useRunPolling(onUpdate: (run: WorkflowRunResponse) => void) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const pollOnce = useCallback(async (runId: string) => {
    const run = await api.getRun(runId);
    onUpdateRef.current(run);
    return run;
  }, []);

  const startPolling = useCallback(
    (runId: string) => {
      stopPolling();

      const tick = async () => {
        try {
          const run = await pollOnce(runId);
          if (TERMINAL_RUN_STATUSES.includes(run.status as (typeof TERMINAL_RUN_STATUSES)[number])) {
            stopPolling();
          }
        } catch {
          stopPolling();
        }
      };

      tick();
      intervalRef.current = setInterval(tick, 1000);
    },
    [pollOnce, stopPolling],
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  return { startPolling, stopPolling, pollOnce };
}
