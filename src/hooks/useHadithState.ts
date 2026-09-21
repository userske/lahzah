import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Hadith } from '../services/ummahApi';

const HADITHS_SAVE_KEY = '@lahzah_saved_hadiths';
const HADITHS_PROGRESS_KEY = '@lahzah_hadith_progress';
const HADITHS_LAST_READ_KEY = '@lahzah_hadith_last_read';

interface HadithProgress {
  [collection: string]: number; // page number
}

interface LastReadState {
  collection: string;
  page: number;
}

export function useHadithState() {
  const [savedHadiths, setSavedHadiths] = useState<Hadith[]>([]);
  const [readingProgress, setReadingProgress] = useState<HadithProgress>({});
  const [lastRead, setLastRead] = useState<LastReadState | null>(null);
  const [loading, setLoading] = useState(true);

  // Load state from local storage on mount
  useEffect(() => {
    let mounted = true;
    
    async function loadData() {
      try {
        const [savedStr, progressStr, lastReadStr] = await Promise.all([
          AsyncStorage.getItem(HADITHS_SAVE_KEY),
          AsyncStorage.getItem(HADITHS_PROGRESS_KEY),
          AsyncStorage.getItem(HADITHS_LAST_READ_KEY),
        ]);

        if (!mounted) return;

        if (savedStr) {
          setSavedHadiths(JSON.parse(savedStr));
        }
        if (progressStr) {
          setReadingProgress(JSON.parse(progressStr));
        }
        if (lastReadStr) {
          setLastRead(JSON.parse(lastReadStr));
        }
      } catch (e) {
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const saveHadith = useCallback(async (hadith: Hadith) => {
    setSavedHadiths((prev) => {
      // Prevent duplicates by checking hadith ID or number + collection
      const exists = prev.some((h) => 
        (h.id === hadith.id) || 
        (h.hadithnumber === hadith.hadithnumber && h.collection === hadith.collection)
      );
      
      if (exists) return prev;
      
      const updated = [hadith, ...prev];
      AsyncStorage.setItem(HADITHS_SAVE_KEY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const unsaveHadith = useCallback(async (hadith: Hadith) => {
    setSavedHadiths((prev) => {
      const updated = prev.filter((h) => 
        !( (h.id === hadith.id) || (h.hadithnumber === hadith.hadithnumber && h.collection === hadith.collection) )
      );
      AsyncStorage.setItem(HADITHS_SAVE_KEY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const toggleSave = useCallback((hadith: Hadith) => {
    const isSaved = savedHadiths.some((h) => 
      (h.id === hadith.id) || (h.hadithnumber === hadith.hadithnumber && h.collection === hadith.collection)
    );
    if (isSaved) {
      unsaveHadith(hadith);
    } else {
      saveHadith(hadith);
    }
  }, [savedHadiths, saveHadith, unsaveHadith]);

  const isHadithSaved = useCallback((hadith: Hadith) => {
    return savedHadiths.some((h) => 
      (h.id === hadith.id) || (h.hadithnumber === hadith.hadithnumber && h.collection === hadith.collection)
    );
  }, [savedHadiths]);

  const saveReadingProgress = useCallback(async (collection: string, page: number) => {
    setReadingProgress((prev) => {
      const updated = { ...prev, [collection]: page };
      AsyncStorage.setItem(HADITHS_PROGRESS_KEY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
    
    // Also track globally
    const lr = { collection, page };
    setLastRead(lr);
    AsyncStorage.setItem(HADITHS_LAST_READ_KEY, JSON.stringify(lr)).catch(console.error);
  }, []);

  const getReadingProgress = useCallback((collection: string) => {
    return readingProgress[collection] || 1;
  }, [readingProgress]);

  return {
    savedHadiths,
    loading,
    saveHadith,
    unsaveHadith,
    toggleSave,
    isHadithSaved,
    saveReadingProgress,
    getReadingProgress,
    lastRead,
  };
}
