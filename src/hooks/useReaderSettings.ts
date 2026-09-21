import { useState, useEffect } from 'react';
import { getReaderSettings, subscribeReaderSettings } from '../state/readerSettings';

/** Returns the current reader settings and re-renders whenever they change. */
export function useReaderSettings() {
  const [settings, setSettings] = useState(getReaderSettings);

  useEffect(() => {
    // Sync on mount in case another screen updated while unmounted
    setSettings(getReaderSettings());
    const unsub = subscribeReaderSettings(() => setSettings(getReaderSettings()));
    return unsub;
  }, []);

  return settings;
}
