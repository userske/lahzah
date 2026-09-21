/**
 * useQuranPreload.ts
 *
 * Starts the Quran data preload on first app launch and exposes live progress.
 * Designed to run once — subsequent launches skip immediately because the
 * sentinel file already exists.
 */

import { useEffect, useRef, useState } from 'react';
import { isPreloadComplete, startPreload, PreloadProgress } from '../services/quranPreload';

export type PreloadStatus = 'checking' | 'downloading' | 'complete' | 'error';

export interface QuranPreloadState {
  status: PreloadStatus;
  progress: PreloadProgress | null;
}

export function useQuranPreload(): QuranPreloadState {
  const [state, setState] = useState<QuranPreloadState>({
    status: 'checking',
    progress: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // Fast path: already downloaded
        const done = await isPreloadComplete();
        if (done || cancelled) {
          setState({ status: 'complete', progress: null });
          return;
        }

        // Slow path: download everything
        setState({ status: 'downloading', progress: null });
        abortRef.current = new AbortController();

        await startPreload(
          (p) => {
            if (!cancelled) setState({ status: 'downloading', progress: p });
          },
          abortRef.current.signal
        );

        if (!cancelled) setState({ status: 'complete', progress: null });
      } catch (e) {
        if (!cancelled) setState({ status: 'error', progress: null });
      }
    }

    run();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  return state;
}
