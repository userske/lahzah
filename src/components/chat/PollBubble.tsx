import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BarChart2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Fonts } from '../../constants/theme';

export function PollBubble({ pollId, userId, colors, isOwn }: { pollId: string; userId: string; colors: any; isOwn: boolean }) {
  const [poll, setPoll] = useState<any>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from('circle_polls').select('*').eq('id', pollId).single();
      if (p) setPoll(p);
      
      const { data: v } = await supabase.from('circle_poll_votes').select('*').eq('poll_id', pollId);
      if (v) {
        const vMap: Record<string, number> = {};
        v.forEach((vote: any) => { vMap[vote.user_id] = vote.option_index; });
        setVotes(vMap);
      }
      setLoading(false);
    })();

    const channel = supabase.channel(`poll-${pollId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'circle_poll_votes', filter: `poll_id=eq.${pollId}` }, async () => {
        const { data: v } = await supabase.from('circle_poll_votes').select('*').eq('poll_id', pollId);
        if (v) {
          const vMap: Record<string, number> = {};
          v.forEach((vote: any) => { vMap[vote.user_id] = vote.option_index; });
          setVotes(vMap);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [pollId]);

  const castVote = async (index: number) => {
    if (votes[userId] === index) return;
    await supabase.from('circle_poll_votes').upsert({ poll_id: pollId, user_id: userId, option_index: index }, { onConflict: 'poll_id,user_id' });
  };

  if (loading) return <ActivityIndicator color={colors.primary} size="small" style={{ margin: 10 }} />;
  if (!poll) return <Text style={{ color: colors.error }}>Poll not found</Text>;

  const options: string[] = poll.options || [];
  const totalVotes = Object.keys(votes).length;

  return (
    <View style={[styles.container, { backgroundColor: isOwn ? 'rgba(255,255,255,0.1)' : colors.background, borderColor: isOwn ? 'rgba(255,255,255,0.3)' : colors.border }]}>
      <View style={styles.header}>
        <BarChart2 size={16} color={isOwn ? '#fff' : colors.primary} />
        <Text style={[styles.headerText, { color: isOwn ? '#fff' : colors.primary }]}>Poll</Text>
      </View>
      <Text style={[styles.question, { color: isOwn ? '#fff' : colors.text }]}>{poll.question}</Text>
      
      <View style={styles.options}>
        {options.map((opt, idx) => {
          const count = Object.values(votes).filter(v => v === idx).length;
          const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
          const isVoted = votes[userId] === idx;
          return (
            <TouchableOpacity key={idx} activeOpacity={0.7} onPress={() => castVote(idx)}
              style={[styles.optionBtn, { borderColor: isOwn ? (isVoted ? '#fff' : 'rgba(255,255,255,0.3)') : (isVoted ? colors.primary : colors.border) }]}
            >
              <View style={[styles.progressBg, { width: `${percent}%`, backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : colors.primaryLight }]} />
              <View style={styles.optionRow}>
                <Text style={[styles.optionText, { color: isOwn ? '#fff' : colors.text, fontFamily: isVoted ? Fonts.sansBold : Fonts.sans }]}>{opt}</Text>
                <Text style={[styles.percentText, { color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>{percent}%</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[styles.totalVotes, { color: isOwn ? 'rgba(255,255,255,0.6)' : colors.textTertiary }]}>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 4, padding: 12, borderRadius: 12, borderWidth: 1, width: 260 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  headerText: { fontFamily: Fonts.sansBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  question: { fontFamily: Fonts.sansSemiBold, fontSize: 15, marginBottom: 12 },
  options: { gap: 8 },
  optionBtn: { borderWidth: 1, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  progressBg: { position: 'absolute', top: 0, left: 0, bottom: 0 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' },
  optionText: { fontSize: 14, flex: 1 },
  percentText: { fontSize: 12, fontFamily: Fonts.sansMedium },
  totalVotes: { fontFamily: Fonts.sans, fontSize: 11, marginTop: 10, textAlign: 'right' },
});
