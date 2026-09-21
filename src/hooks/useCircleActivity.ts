import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface CircleActivity {
  activeCount: number;   // Members who read today
  totalCount: number;    // Total members in the circle
  circleName: string | null;
}

/**
 * useCircleActivity
 *
 * Counts how many members in the user's primary circle have an
 * updated reading_progress timestamp of today. Uses Supabase
 * Realtime to keep the count live as others in the circle read.
 */
export function useCircleActivity() {
  const [activity, setActivity] = useState<CircleActivity>({
    activeCount: 0,
    totalCount: 0,
    circleName: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get the user's first circle
      const { data: membership } = await supabase
        .from('circle_members')
        .select('circle_id, circles(name)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (!membership || cancelled) { setLoading(false); return; }

      const circleId = membership.circle_id;
      const circleName = (membership.circles as any)?.name ?? null;

      // Get all members of this circle
      const { data: members } = await supabase
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', circleId);

      if (!members || cancelled) { setLoading(false); return; }

      const memberIds = members.map((m) => m.user_id);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Count how many have read today
      const { count: activeCount } = await supabase
        .from('reading_progress')
        .select('user_id', { count: 'exact', head: true })
        .in('user_id', memberIds)
        .gte('updated_at', todayStart.toISOString());

      if (!cancelled) {
        setActivity({
          activeCount: activeCount ?? 0,
          totalCount: memberIds.length,
          circleName,
        });
        setLoading(false);
      }
    };

    load();

    // Use a unique channel name per mount so React Fast Refresh (and any
    // other remount) always creates a fresh channel instead of reusing an
    // already-subscribed one — which would throw when .on() is called.
    const channelName = `circle-activity-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reading_progress' },
        () => { load(); }
      );

    channel.subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { activity, loading };
}
