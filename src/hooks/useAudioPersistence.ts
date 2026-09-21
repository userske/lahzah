import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscribeToAudioState } from '../state/audioEvent';

const AUDIO_STORAGE_KEY = 'lahzah_last_audio_session';

export interface PersistedAudioSession {
  surahNumber: number;
  ayahNumber: number;
  reciterId: string | number;
}

export function useAudioPersistence() {
  const [lastSession, setLastSession] = useState<PersistedAudioSession | null>(null);

  // Load persisted session from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(AUDIO_STORAGE_KEY).then(data => {
      if (data) {
        try {
          setLastSession(JSON.parse(data));
        } catch (e) {
        }
      }
    });
  }, []);

  // Subscribe to live audio and persist whenever a new surah/ayah plays
  useEffect(() => {
    const unsub = subscribeToAudioState((state) => {
      if (state.isPlaying && state.surah && state.ayah && state.reciter) {
        const session: PersistedAudioSession = {
          surahNumber: state.surah,
          ayahNumber: state.ayah,
          reciterId: state.reciter.id,
        };
        setLastSession(session);
        AsyncStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(session)).catch(console.warn);
      }
    });
    return unsub;
  }, []);

  return lastSession;
}
