import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHadithState } from './useHadithState';
import type { Dua } from '../services/ummahApi';

const SAVED_AYAHS_KEY = '@lahzah_saved_ayahs';
const SAVED_DUAS_KEY = '@lahzah_saved_duas';

export interface SavedAyah {
  id: string; // e.g. "2-255"
  surahName: string;
  surahNumber: number;
  ayahNumberInSurah: number;
  arabicText: string;
  translationText: string;
  timestamp: number;
}

export interface SavedDua extends Dua {
  timestamp: number;
}

export function useSavedItems() {
  const [savedAyahs, setSavedAyahs] = useState<SavedAyah[]>([]);
  const [savedDuas, setSavedDuas] = useState<SavedDua[]>([]);
  const [loading, setLoading] = useState(true);

  // We also bring in hadiths to have a unified feed
  const { savedHadiths, toggleSave: toggleHadithSave, isHadithSaved } = useHadithState();

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [ayahsStr, duasStr] = await Promise.all([
          AsyncStorage.getItem(SAVED_AYAHS_KEY),
          AsyncStorage.getItem(SAVED_DUAS_KEY),
        ]);
        if (!mounted) return;

        if (ayahsStr) setSavedAyahs(JSON.parse(ayahsStr));
        if (duasStr) setSavedDuas(JSON.parse(duasStr));
      } catch (e) {
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  const toggleAyahSave = useCallback((ayah: Omit<SavedAyah, 'id' | 'timestamp'>) => {
    const id = `${ayah.surahNumber}-${ayah.ayahNumberInSurah}`;
    setSavedAyahs((prev) => {
      const exists = prev.some((a) => a.id === id);
      let updated;
      if (exists) {
        updated = prev.filter((a) => a.id !== id);
      } else {
        updated = [{ ...ayah, id, timestamp: Date.now() }, ...prev];
      }
      AsyncStorage.setItem(SAVED_AYAHS_KEY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const isAyahSaved = useCallback((surahNumber: number, ayahNumberInSurah: number) => {
    const id = `${surahNumber}-${ayahNumberInSurah}`;
    return savedAyahs.some((a) => a.id === id);
  }, [savedAyahs]);

  const toggleDuaSave = useCallback((dua: Dua) => {
    setSavedDuas((prev) => {
      // Duas don't have IDs in our dataset, so we match by arabic text
      const exists = prev.some((d) => d.arabic === dua.arabic);
      let updated;
      if (exists) {
        updated = prev.filter((d) => d.arabic !== dua.arabic);
      } else {
        updated = [{ ...dua, timestamp: Date.now() }, ...prev];
      }
      AsyncStorage.setItem(SAVED_DUAS_KEY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const isDuaSaved = useCallback((dua: Dua) => {
    return savedDuas.some((d) => d.arabic === dua.arabic);
  }, [savedDuas]);

  return {
    savedAyahs,
    savedDuas,
    savedHadiths,
    loading,
    toggleAyahSave,
    isAyahSaved,
    toggleDuaSave,
    isDuaSaved,
    toggleHadithSave,
    isHadithSaved,
  };
}
