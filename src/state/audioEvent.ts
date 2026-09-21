import type { Reciter } from '../data/reciters';

export type AudioState = {
  isPlaying: boolean;
  surahName: string | null;
  surah?: number | null;
  ayah?: number | null;
  reciter?: Reciter | null;
  currentActiveVerseKey?: string | null; // e.g., "1:1" for highlighting
  togglePlayback?: () => void;
};

type Listener = (state: AudioState) => void;
const listeners = new Set<Listener>();

let currentState: AudioState = {
  isPlaying: false,
  surahName: null,
};

export const updateAudioState = (newState: Partial<AudioState>) => {
  currentState = { ...currentState, ...newState };
  listeners.forEach((l) => l(currentState));
};

export const getAudioState = () => currentState;

export const subscribeToAudioState = (listener: Listener) => {
  listeners.add(listener);
  listener(currentState);
  return () => {
    listeners.delete(listener);
  };
};
