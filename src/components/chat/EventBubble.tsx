import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Calendar, Clock } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Fonts } from '../../constants/theme';

export function EventBubble({ eventId, userId, colors, isOwn }: { eventId: string; userId: string; colors: any; isOwn: boolean }) {
  const [eventData, setEventData] = useState<any>(null);
  const [rsvps, setRsvps] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: e } = await supabase.from('circle_events').select('*').eq('id', eventId).single();
      if (e) setEventData(e);
      
      const { data: r } = await supabase.from('circle_event_rsvps').select('*').eq('event_id', eventId);
      if (r) {
        const rMap: Record<string, string> = {};
        r.forEach((rsvp: any) => { rMap[rsvp.user_id] = rsvp.status; });
        setRsvps(rMap);
      }
      setLoading(false);
    })();

    const channel = supabase.channel(`event-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'circle_event_rsvps', filter: `event_id=eq.${eventId}` }, async () => {
        const { data: r } = await supabase.from('circle_event_rsvps').select('*').eq('event_id', eventId);
        if (r) {
          const rMap: Record<string, string> = {};
          r.forEach((rsvp: any) => { rMap[rsvp.user_id] = rsvp.status; });
          setRsvps(rMap);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const castRsvp = async (status: string) => {
    if (rsvps[userId] === status) return;
    await supabase.from('circle_event_rsvps').upsert({ event_id: eventId, user_id: userId, status }, { onConflict: 'event_id,user_id' });
  };

  if (loading) return <ActivityIndicator color={colors.primary} size="small" style={{ margin: 10 }} />;
  if (!eventData) return <Text style={{ color: colors.error }}>Event not found</Text>;

  const attendingCount = Object.values(rsvps).filter(s => s === 'attending').length;
  const myStatus = rsvps[userId];

  const d = new Date(eventData.event_at);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <View style={[styles.container, { backgroundColor: isOwn ? 'rgba(255,255,255,0.1)' : colors.background, borderColor: isOwn ? 'rgba(255,255,255,0.3)' : colors.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLabel}>
          <Calendar size={14} color={isOwn ? '#fff' : colors.primary} />
          <Text style={[styles.headerText, { color: isOwn ? '#fff' : colors.primary }]}>Event</Text>
        </View>
        <Text style={[styles.attendingText, { color: isOwn ? 'rgba(255,255,255,0.8)' : colors.textTertiary }]}>{attendingCount} attending</Text>
      </View>
      
      <Text style={[styles.title, { color: isOwn ? '#fff' : colors.text }]}>{eventData.title}</Text>
      {eventData.description ? <Text style={[styles.desc, { color: isOwn ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>{eventData.description}</Text> : null}
      
      <View style={[styles.timeBox, { backgroundColor: isOwn ? 'rgba(255,255,255,0.15)' : colors.skeleton }]}>
        <Clock size={14} color={isOwn ? '#fff' : colors.textSecondary} />
        <Text style={[styles.timeText, { color: isOwn ? '#fff' : colors.textSecondary }]}>{dateStr} at {timeStr}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => castRsvp('attending')} style={[styles.btn, { backgroundColor: myStatus === 'attending' ? colors.primary : 'transparent', borderColor: isOwn ? '#fff' : colors.border }]}>
          <Text style={[styles.btnText, { color: myStatus === 'attending' ? '#fff' : (isOwn ? '#fff' : colors.text) }]}>Going</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => castRsvp('maybe')} style={[styles.btn, { backgroundColor: myStatus === 'maybe' ? colors.primaryLight : 'transparent', borderColor: isOwn ? '#fff' : colors.border }]}>
          <Text style={[styles.btnText, { color: myStatus === 'maybe' ? colors.primary : (isOwn ? '#fff' : colors.text) }]}>Maybe</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => castRsvp('declined')} style={[styles.btn, { backgroundColor: myStatus === 'declined' ? colors.skeleton : 'transparent', borderColor: isOwn ? '#fff' : colors.border }]}>
          <Text style={[styles.btnText, { color: isOwn ? '#fff' : colors.text }]}>Can't</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 4, padding: 12, borderRadius: 12, borderWidth: 1, width: 260 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerText: { fontFamily: Fonts.sansBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  attendingText: { fontFamily: Fonts.sansMedium, fontSize: 11 },
  title: { fontFamily: Fonts.sansSemiBold, fontSize: 16, marginBottom: 4 },
  desc: { fontFamily: Fonts.sans, fontSize: 13, marginBottom: 12 },
  timeBox: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, gap: 6, marginBottom: 12 },
  timeText: { fontFamily: Fonts.sansMedium, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  btnText: { fontFamily: Fonts.sansSemiBold, fontSize: 12 },
});
