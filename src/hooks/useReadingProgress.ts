import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ReadingPosition {
  surahNumber: number;
  ayahNumber: number;
  updatedAt: string;
}

/**
 * useReadingProgress
 *
 * Reads and writes the user's last reading position from the Supabase
 * reading_progress table. The table uses user_id as a primary key,
 * so every save is an UPSERT — only one record ever exists per user.
 * If circleId is provided, it tracks progress against the group goal instead.
 */
export function useReadingProgress(circleId?: string | null) {
  const [position, setPosition] = useState<ReadingPosition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      if (circleId) {
        // Load Circle Goal Progress
        const { data } = await supabase
          .from('circle_members')
          .select('goal_last_surah, goal_last_ayah')
          .eq('user_id', user.id)
          .eq('circle_id', circleId)
          .maybeSingle();

        if (!cancelled) {
          if (data && data.goal_last_surah) {
            setPosition({
              surahNumber: data.goal_last_surah,
              ayahNumber: data.goal_last_ayah || 1,
              updatedAt: new Date().toISOString(),
            });
          }
          setLoading(false);
        }
      } else {
        // Load Personal Progress
        const { data } = await supabase
          .from('reading_progress')
          .select('surah_number, ayah_number, updated_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!cancelled) {
          if (data) {
            setPosition({
              surahNumber: data.surah_number,
              ayahNumber: data.ayah_number,
              updatedAt: data.updated_at,
            });
          }
          setLoading(false);
        }

        // Realtime subscription — fires whenever the reader's debounced save writes to DB
        channel = supabase
          .channel(`reading_progress:${user.id}:${Math.random().toString(36).substring(7)}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'reading_progress',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (cancelled) return;
              const row = payload.new as any;
              if (row?.surah_number) {
                setPosition({
                  surahNumber: row.surah_number,
                  ayahNumber: row.ayah_number,
                  updatedAt: row.updated_at,
                });
              }
            }
          )
          .subscribe();
      }
    };

    load();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [circleId]);

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAyahsRef = useRef<number>(0);
  const lastPositionRef = useRef<{surah: number, ayah: number} | null>(null);

  /**
   * Saves reading position locally and debounces DB sync.
   */
  const saveProgress = useCallback((surahNumber: number, ayahNumber: number) => {
    pendingAyahsRef.current += 1;
    lastPositionRef.current = { surah: surahNumber, ayah: ayahNumber };
    
    setPosition({
      surahNumber,
      ayahNumber,
      updatedAt: new Date().toISOString(),
    });

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      const ayahsToSync = pendingAyahsRef.current;
      const finalPos = lastPositionRef.current;
      pendingAyahsRef.current = 0; // reset
      if (finalPos) {
        syncToDatabase(finalPos.surah, finalPos.ayah, ayahsToSync);
      }
    }, 2500); // 2.5s debounce
  }, [circleId]);

  const syncToDatabase = async (surahNumber: number, ayahNumber: number, ayahsToSync: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (circleId) {
      // Save to circle goal progress silently
      await supabase.rpc('update_circle_goal_progress', {
        p_circle_id: circleId,
        p_user_id: user.id,
        p_surah: surahNumber,
        p_ayah: ayahNumber,
        p_ayahs_delta: ayahsToSync
      });
    } else {
      // Save to personal global progress
      await supabase.from('reading_progress').upsert(
        {
          user_id: user.id,
          surah_number: surahNumber,
          ayah_number: ayahNumber,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      // Auto-Sync active personal goals
      const { data: activeGoals } = await supabase
        .from('personal_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false);

      if (activeGoals && activeGoals.length > 0) {
        for (const goal of activeGoals) {
          let shouldIncrement = false;
          let incrementAmount = ayahsToSync;

          if (goal.target_unit === 'ayahs') {
            shouldIncrement = true;
          } else if (goal.target_unit === 'pages') {
            // Rough estimation, usually pages are manually logged
            shouldIncrement = false;
          }

          try {
            const meta = JSON.parse(goal.description || '{}');
            if (meta.type === 'range') {
              const isInside = surahNumber >= meta.startSurah && surahNumber <= meta.endSurah; 
              if (isInside) shouldIncrement = true;
              else shouldIncrement = false;
            }
          } catch(e) {}

          if (shouldIncrement) {
             const newValue = goal.current_value + incrementAmount;
             const completed = newValue >= goal.target_value;
             await supabase.from('personal_goals').update({ current_value: newValue, completed }).eq('id', goal.id);
             
             if (completed && goal.current_value < goal.target_value) {
                await supabase.from('personal_journal').insert({
                  user_id: user.id,
                  content: `Completed goal: "${goal.title}" — MashaAllah!`,
                  type: 'milestone',
                  goal_id: goal.id
                });
             }
          }
        }
      }
    }

    // Also record the detailed history for streaks and calendar UI using local timezone
    const d = new Date();
    const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    const { data: history } = await supabase
      .from('reading_history')
      .select('ayahs_count')
      .eq('user_id', user.id)
      .eq('read_date', localDateStr)
      .eq('surah_number', surahNumber)
      .maybeSingle();

    const currentCount = history?.ayahs_count || 0;

    await supabase.from('reading_history').upsert(
      {
        user_id: user.id,
        read_date: localDateStr,
        surah_number: surahNumber,
        ayahs_count: currentCount + ayahsToSync,
      },
      { onConflict: 'user_id, read_date, surah_number' }
    );
  };

  return { position, loading, saveProgress };
}
