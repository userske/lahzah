/**
 * Shared reader display settings — module-level reactive store.
 * Both the Browse screen (hamburger) and the Reader screen (⋯ button)
 * read/write from the same in-memory state so they stay in sync.
 */

type Listener = () => void;

interface ReaderSettings {
  showTranslation: boolean;
  showTransliteration: boolean;
  showWordByWord: boolean;
  showTajweed: boolean;
  isHifzMode: boolean;
  selectedTranslationId: number;
  viewMode: 'list' | 'mushaf';
}

let _settings: ReaderSettings = {
  showTranslation: true,
  showTransliteration: false,
  showWordByWord: false,
  showTajweed: false,
  isHifzMode: false,
  selectedTranslationId: 85,
  viewMode: 'mushaf',
};

const _listeners = new Set<Listener>();

export const getReaderSettings = (): ReaderSettings => ({ ..._settings });

export const setReaderSettings = (patch: Partial<ReaderSettings>): void => {
  _settings = { ..._settings, ...patch };
  _listeners.forEach(l => l());
};

export const subscribeReaderSettings = (listener: Listener): (() => void) => {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
};
