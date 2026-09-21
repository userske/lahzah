import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface HifzProgress {
  verse_key: string;
  status: 'learning' | 'reviewing' | 'mastered';
  ease_factor: number;
  interval: number;
  next_review_at: string;
}

/**
 * useHifz
 *
 * Hooks to interact with hifz_progress for Spaced Repetition System.
 */
export function useHifz() {
  const [hifzData, setHifzData] = useState<Record<string, HifzProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('hifz_progress')
        .select('*')
        .eq('user_id', user.id);

      if (!cancelled) {
        if (data) {
          const mapped = data.reduce((acc: any, row: any) => {
            acc[row.verse_key] = row;
            return acc;
          }, {});
          setHifzData(mapped);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const markDifficult = async (verseKey: string, surahName?: string, ayahText?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const current = hifzData[verseKey];
    let newInterval = 1;
    let newEase = 2.5;

    if (current) {
      newEase = Math.max(1.3, current.ease_factor - 0.2); // Basic penalty
      newInterval = 1; // Reset interval for difficult verses
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    const payload = {
      user_id: user.id,
      verse_key: verseKey,
      status: 'learning' as const,
      ease_factor: newEase,
      interval: newInterval,
      next_review_at: nextReview.toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Update Spaced Repetition logic
    const { error } = await supabase
      .from('hifz_progress')
      .upsert(payload, { onConflict: 'user_id,verse_key' });

    if (!error) {
      setHifzData(prev => ({ ...prev, [verseKey]: payload as HifzProgress }));
    } else {
    }

    // 2. Log to hifz_mistakes via Postgres function
    const [surah, ayah] = verseKey.split(':').map(Number);
    if (!isNaN(surah) && !isNaN(ayah)) {
      await supabase.rpc('log_hifz_mistake', {
        p_surah: surah,
        p_ayah: ayah,
        p_status: 'struggling'
      });
    }

    // 3. Log to personal_journal so it shows in the "Me" Chat Hifz Journal
    if (surahName && ayahText) {
      const content = `Struggled with ${surahName} ${verseKey}:\n\n${ayahText}`;
      await supabase.from('personal_journal').insert({
        user_id: user.id,
        type: 'hifz_struggle',
        content,
      });
    }
  };

  return { hifzData, loading, markDifficult };
}
