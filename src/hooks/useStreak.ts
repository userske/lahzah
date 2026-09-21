import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface DailyReadDetail {
  surah_number: number;
  ayahs_count: number;
}

export interface DailyReadHistory {
  [dateStr: string]: DailyReadDetail[];
}

export interface StreakData {
  streakCount: number;
  readDates: string[]; // Array of unique YYYY-MM-DD strings local to the user
  detailedHistory: DailyReadHistory; // Map of date -> what they read that day
  loading: boolean;
}

export function useStreak(): StreakData {
  const [streakCount, setStreakCount] = useState(0);
  const [readDates, setReadDates] = useState<string[]>([]);
  const [detailedHistory, setDetailedHistory] = useState<DailyReadHistory>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchStreak = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Fetch all historical reads for this user, ordered by date descending
      const { data, error } = await supabase
        .from('reading_history')
        .select('read_date, surah_number, ayahs_count')
        .eq('user_id', user.id)
        .order('read_date', { ascending: false });

      if (cancelled) return;
      
      if (error || !data) { 
        setLoading(false); 
        return; 
      }

      // Process the detailed data
      const uniqueDates = new Set<string>();
      const historyMap: DailyReadHistory = {};

      data.forEach(row => {
        uniqueDates.add(row.read_date);
        
        if (!historyMap[row.read_date]) {
          historyMap[row.read_date] = [];
        }
        historyMap[row.read_date].push({
          surah_number: row.surah_number,
          ayahs_count: row.ayahs_count,
        });
      });

      const dates = Array.from(uniqueDates);
      setReadDates(dates);
      setDetailedHistory(historyMap);

      if (dates.length === 0) {
        setStreakCount(0);
        setLoading(false);
        return;
      }

      // Calculate streak locally. 
      // We look at the gap between days in their local timezone dates.
      let currentStreak = 0;
      
      // We need a helper to generate YYYY-MM-DD for local dates
      const getLocalYMD = (d: Date) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      const today = new Date();
      const todayStr = getLocalYMD(today);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalYMD(yesterday);

      // If the most recent read is NOT today and NOT yesterday, the streak is broken (0).
      if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
        setStreakCount(0);
        setLoading(false);
        return;
      }

      // The streak is alive. Count backwards from dates[0].
      let expectedDate = new Date(dates[0]);
      
      for (let i = 0; i < dates.length; i++) {
        if (dates[i] === getLocalYMD(expectedDate)) {
          currentStreak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          break; // Gap found, streak ends here
        }
      }

      setStreakCount(currentStreak);
      setLoading(false);
    };

    fetchStreak();
    return () => { cancelled = true; };
  }, []);

  return { streakCount, readDates, detailedHistory, loading };
}
