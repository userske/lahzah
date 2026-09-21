import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'system' | 'light' | 'dark';

export type ScriptType = 'uthmani' | 'indopak';
export type AudioPlaybackMode = 'auto' | 'offline';

export interface Preferences {
  theme: ThemeType;
  scriptType: ScriptType;
  audioPlaybackMode: AudioPlaybackMode;
  arabicFontSize: number;
  translationFontSize: number;
  defaultReciterId: string;
  defaultTranslationId: number;
  setTheme: (t: ThemeType) => void;
  setScriptType: (s: ScriptType) => void;
  setAudioPlaybackMode: (mode: AudioPlaybackMode) => void;
  setArabicFontSize: (s: number) => void;
  setTranslationFontSize: (s: number) => void;
  setDefaultReciterId: (id: string) => void;
  setDefaultTranslationId: (id: number) => void;
}

const defaultPrefs: Preferences = {
  theme: 'system',
  scriptType: 'uthmani',
  audioPlaybackMode: 'auto',
  arabicFontSize: 24,
  translationFontSize: 14,
  defaultReciterId: '7',
  defaultTranslationId: 85,
  setTheme: () => {},
  setScriptType: () => {},
  setAudioPlaybackMode: () => {},
  setArabicFontSize: () => {},
  setTranslationFontSize: () => {},
  setDefaultReciterId: () => {},
  setDefaultTranslationId: () => {},
};

const PrefContext = createContext<Preferences>(defaultPrefs);

const STORAGE_KEY = '@lahzah_preferences';

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Omit<Preferences, 'setTheme' | 'setScriptType' | 'setAudioPlaybackMode' | 'setArabicFontSize' | 'setTranslationFontSize' | 'setDefaultReciterId' | 'setDefaultTranslationId'>>({
    theme: 'system',
    scriptType: 'uthmani',
    audioPlaybackMode: 'auto',
    arabicFontSize: 24,
    translationFontSize: 14,
    defaultReciterId: '7',
    defaultTranslationId: 85,
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setPrefs((prev) => ({ ...prev, ...parsed }));
        } catch (e) {
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const savePref = async (key: keyof typeof prefs, value: any) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
  };

  // Do not block rendering, use defaults until loaded
  // if (!isLoaded) return null;

  return (
    <PrefContext.Provider
      value={{
        ...prefs,
        setTheme: (t) => savePref('theme', t),
        setScriptType: (s) => savePref('scriptType', s),
        setAudioPlaybackMode: (mode) => savePref('audioPlaybackMode', mode),
        setArabicFontSize: (s) => savePref('arabicFontSize', s),
        setTranslationFontSize: (s) => savePref('translationFontSize', s),
        setDefaultReciterId: (id) => savePref('defaultReciterId', id),
        setDefaultTranslationId: (id) => savePref('defaultTranslationId', id),
      }}
    >
      {children}
    </PrefContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PrefContext);
}
