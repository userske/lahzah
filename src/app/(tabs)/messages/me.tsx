import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Modal,
  Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassBlur } from '../../../components/ui/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft, BookOpen, Brain, RefreshCw, Target, Pencil,
  Plus, CheckCircle, CheckCircle2, Flame, ChevronDown, ChevronUp, Trash2,
  TrendingUp, Clock, BookMarked, X, ChevronRight, Send
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, Easing } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../../lib/supabase';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Fonts } from '../../../constants/theme';
import { requestSurah } from '../../../state/readerState';
import { CircleGoalPickerModal, CircleGoal } from '../../../components/chat/CircleGoalPickerModal';

// ─── Types ───────────────────────────────────────────────────────────────────
type GoalType = 'recitation' | 'memorization' | 'revision' | 'custom';
type GoalUnit = 'ayahs' | 'juz' | 'pages' | 'minutes' | 'sessions';
type EntryType = 'goal' | 'journal' | 'milestone' | 'hifz_struggle';

interface Goal {
  id: string;
  type: GoalType;
  title: string;
  description?: string;
  target_value: number;
  target_unit: GoalUnit;
  current_value: number;
  deadline?: string;
  completed: boolean;
  created_at: string;
}

interface JournalEntry {
  id: string;
  content: string;
  type: 'reflection' | 'milestone' | 'goal_update' | 'hifz_struggle';
  goal_id?: string;
  created_at: string;
}

// A unified feed item rendered in the chat list
interface FeedItem {
  id: string;
  itemType: EntryType;
  data: Goal | JournalEntry;
  created_at: string;
}

const GOAL_TYPE_META: Record<GoalType, { label: string; icon: any; color: string }> = {
  recitation:  { label: 'Recitation',   icon: BookOpen,    color: '#6366f1' },
  memorization:{ label: 'Memorization', icon: Brain,       color: '#f59e0b' },
  revision:    { label: 'Revision',     icon: RefreshCw,   color: '#10b981' },
  custom:      { label: 'Custom',       icon: Target,      color: '#8b5cf6' },
};

const UNIT_LABELS: Record<GoalUnit, string> = {
  ayahs: 'ayahs', juz: 'juz', pages: 'pages', minutes: 'min', sessions: 'sessions',
};

// ─── Add Goal Sheet ───────────────────────────────────────────────────────────
// ─── Goal Card (rendered as a "system" message) ───────────────────────────────
function GoalCard({ goal, onLog, onDelete, colors, isDark }: {
  goal: Goal;
  onLog: (goal: Goal, amount: number) => void;
  onDelete: (id: string) => void;
  colors: any;
  isDark: boolean;
}) {
  const meta    = GOAL_TYPE_META[goal.type];
  const Icon    = meta.icon;
  const pct     = goal.target_value > 0 ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0;
  const done    = goal.completed || pct >= 100;

  // Detect if this is a range goal
  let isRange = false;
  let rangeMeta: CircleGoal | null = null;
  try {
    const parsed = JSON.parse(goal.description || '{}');
    if (parsed.type === 'range') {
      isRange = true;
      rangeMeta = parsed;
    }
  } catch(e) {}

  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

  return (
    <Animated.View entering={FadeInDown.duration(400).easing(Easing.out(Easing.exp))}>
      <View style={[styles.goalCard, { backgroundColor: bg, borderColor: done ? meta.color + '60' : colors.border }]}>
        <View style={styles.goalCardHeader}>
          <View style={[styles.goalIconBox, { backgroundColor: meta.color + '18' }]}>
            <Icon size={16} color={meta.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.title}</Text>
            <Text style={[styles.goalMeta, { color: colors.textTertiary }]}>
              {meta.label} · {goal.current_value}/{goal.target_value} {UNIT_LABELS[goal.target_unit]}
            </Text>
            {isRange && rangeMeta && (
              <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 11, color: meta.color, marginTop: 2 }}>
                Surah {rangeMeta.startSurah}:{rangeMeta.startAyah} → {rangeMeta.endSurah}:{rangeMeta.endAyah}
              </Text>
            )}
            {goal.description && !isRange && (
              <Text style={[styles.goalMeta, { color: colors.textSecondary, marginTop: 4 }]} numberOfLines={2}>
                {goal.description}
              </Text>
            )}
          </View>
          {done ? (
            <CheckCircle size={20} color={meta.color} />
          ) : (
            <TouchableOpacity onPress={() => {
                if (isRange && rangeMeta) {
                  requestSurah(rangeMeta.startSurah, rangeMeta.startAyah);
                  router.push('/reader');
                } else {
                  onLog(goal, 1);
                }
              }}
              style={[styles.readBtn, { backgroundColor: isRange ? colors.surface : meta.color, borderColor: colors.border }]}
            >
              {isRange ? <BookOpen size={16} color={colors.textSecondary} /> : <Plus size={16} color="#fff" />}
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 }}>
          <View style={[styles.progressTrack, { backgroundColor: colors.skeleton, flex: 1 }]}>
            <LinearGradient
              colors={[meta.color, meta.color + 'aa']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${pct}%` as any }]}
            />
          </View>
          <Text style={[styles.progressPct, { color: meta.color, marginTop: 0 }]}>{Math.round(pct)}%</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Journal Bubble (rendered as a "user" message) ────────────────────────────
function JournalBubble({ entry, colors, isDark }: { entry: JournalEntry; colors: any; isDark: boolean }) {
  const time = new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const bg = isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)';

  return (
    <Animated.View entering={FadeInUp.duration(400).easing(Easing.out(Easing.exp))} style={styles.bubbleRow}>
      <View style={[styles.bubble, { backgroundColor: bg, borderColor: 'rgba(99, 102, 241, 0.2)' }]}>
        <Text style={[styles.bubbleText, { color: colors.text }]}>{entry.content}</Text>
        <Text style={[styles.bubbleTime, { color: colors.textTertiary }]}>{time}</Text>
      </View>
    </Animated.View>
  );
}

function HifzStruggleCard({ entry, colors, isDark }: { entry: JournalEntry; colors: any; isDark: boolean }) {
  const time = new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const bg = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)';
  
  // Extract the title (e.g., "Struggled with Al-Baqarah 2:15:") from the content if we can
  const parts = entry.content.split(':\n\n');
  const title = parts.length > 1 ? parts[0] : 'Memorization Struggle';
  const ayahText = parts.length > 1 ? parts.slice(1).join(':\n\n') : entry.content;

  return (
    <Animated.View entering={FadeInUp.duration(400).easing(Easing.out(Easing.exp))} style={styles.bubbleRow}>
      <View style={[styles.bubble, { backgroundColor: bg, borderColor: 'rgba(239, 68, 68, 0.3)', width: '90%', padding: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 }}>
          <Flame size={14} color="#ef4444" />
          <Text style={{ color: '#ef4444', fontFamily: Fonts.sansSemiBold, fontSize: 13 }}>{title}</Text>
        </View>
        <Text style={[styles.bubbleText, { color: colors.text, fontFamily: 'AmiriQuran', fontSize: 24, lineHeight: 46, textAlign: 'right', marginBottom: 8 }]}>{ayahText}</Text>
        <Text style={[styles.bubbleTime, { color: colors.textTertiary, alignSelf: 'flex-start' }]}>{time}</Text>
      </View>
    </Animated.View>
  );
}

function MilestonePill({ entry, colors }: { entry: JournalEntry; colors: any }) {
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.milestoneRow}>
      <View style={[styles.milestonePill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Flame size={14} color="#f59e0b" />
        <Text style={[styles.milestoneText, { color: colors.textSecondary }]}>{entry.content}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MeChatScreen() {
  const { colors, isDark } = useAppTheme();
  
  const [userId, setUserId]           = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [journal, setJournal]         = useState<JournalEntry[]>([]);
  const [feed, setFeed]               = useState<FeedItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [text, setText]               = useState('');
  const [sending, setSending]         = useState(false);
  const flatRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      
      const parts = user.email ? user.email.split('@')[0].split('.') : ['User'];
      setDisplayName(parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '));

      // Fetch personal goals
      const { data: goalsData } = await supabase
        .from('personal_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch journal entries
      const { data: journalData } = await supabase
        .from('personal_journal')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const mappedGoals = (goalsData || []).map(g => ({
        ...g,
        id: g.id.toString(),
      })) as Goal[];

      const mappedJournal = (journalData || []).map(j => ({
        ...j,
        id: j.id.toString(),
      })) as JournalEntry[];

      setJournal(mappedJournal);

      // Merge into a single feed sorted by created_at (oldest first for chat layout, wait actually we usually do newest at bottom)
      // Actually standard chat is inverted or scroll to bottom. We'll sort by ascending.
      const items: FeedItem[] = [
        ...mappedGoals.map(g => ({ id: `g-${g.id}`, itemType: 'goal' as const, data: g, created_at: g.created_at })),
        ...mappedJournal.map(j => ({ id: `j-${j.id}`, itemType: j.type as EntryType, data: j, created_at: j.created_at }))
      ];

      items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      setFeed(items);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddGoal = async (g: Omit<Goal, 'id' | 'created_at' | 'completed' | 'current_value'>) => {
    if (!userId) return;
    try {
      await supabase.from('personal_goals').insert({
        user_id: userId,
        type: g.type,
        title: g.title,
        description: g.description,
        target_value: g.target_value,
        target_unit: g.target_unit,
        current_value: 0,
        completed: false,
        deadline: g.deadline,
      });
      load();
    } catch (e) {
      Alert.alert('Error saving goal');
    }
  };

  const handleLogGoal = async (goal: Goal, amount: number) => {
    if (!userId || goal.completed) return;
    const nextVal = goal.current_value + amount;
    const completed = nextVal >= goal.target_value;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await supabase.from('personal_goals').update({ current_value: nextVal, completed }).eq('id', goal.id);
      
      if (completed) {
        await supabase.from('personal_journal').insert({
          user_id: userId,
          type: 'milestone',
          content: `Alhamdulillah! Completed goal: ${goal.title}`,
          goal_id: goal.id,
        });
      } else {
        await supabase.from('personal_journal').insert({
          user_id: userId,
          type: 'goal_update',
          content: `Progressed on ${goal.title} (+${amount} ${UNIT_LABELS[goal.target_unit]})`,
          goal_id: goal.id,
        });
      }
      load();
    } catch (e) {
      Alert.alert('Error updating goal');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await supabase.from('personal_goals').delete().eq('id', id);
      load();
    } catch (e) {}
  };

  const handleSend = async () => {
    if (!text.trim() || !userId) return;
    setSending(true);
    try {
      await supabase.from('personal_journal').insert({
        user_id: userId,
        type: 'reflection',
        content: text.trim(),
      });
      setText('');
      load();
    } catch (e) {
      Alert.alert('Failed to save reflection');
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.itemType === 'goal') {
      return <GoalCard goal={item.data as Goal} onLog={handleLogGoal} onDelete={handleDeleteGoal} colors={colors} isDark={isDark} />;
    }
    if (item.itemType === 'milestone') {
      return <MilestonePill entry={item.data as JournalEntry} colors={colors} />;
    }
    if (item.itemType === 'hifz_struggle') {
      return <HifzStruggleCard entry={item.data as JournalEntry} colors={colors} isDark={isDark} />;
    }
    return <JournalBubble entry={item.data as JournalEntry} colors={colors} isDark={isDark} />;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/messages')} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', marginRight: 24 }}>
          <Text style={[styles.headerAvatarText, { color: colors.text, fontSize: 18 }]}>Me</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/messages/hifz')} style={[styles.addBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
          <Brain size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Feed ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.text} size="large" />
        </View>
      ) : feed.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Target size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Your personal space</Text>
            <Text style={[styles.emptySub, { color: colors.textTertiary }]}>
              Set a Quran goal, track your progress, and write reflections — all in one place.
            </Text>
            <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.text }]} onPress={() => setShowRangePicker(true)}>
              <Plus size={16} color={colors.background} />
              <Text style={[styles.emptyBtnText, { color: colors.background }]}>Set First Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={feed}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        />
        )}

        {/* ── Composer ── */}
        <GlassBlur intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.composer, { backgroundColor: isDark ? 'rgba(10,10,10,0.85)' : 'rgba(255,255,255,0.85)' }]}>
          <TouchableOpacity onPress={() => setShowRangePicker(true)} style={[styles.composerGoalBtn, { borderColor: colors.border }]}>
            <Target size={20} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Journal your reflections..."
            placeholderTextColor={colors.textTertiary}
            multiline
            style={[styles.composerInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.surface }]}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color={text.trim() ? '#fff' : colors.textTertiary} />}
          </TouchableOpacity>
        </GlassBlur>
      </KeyboardAvoidingView>

      <CircleGoalPickerModal
        visible={showRangePicker}
        onClose={() => setShowRangePicker(false)}
        personalMode
        onPersonalGoalSaved={(r) => {
          handleAddGoal({
            type: 'recitation',
            title: `Read Surah ${r.startSurah}:${r.startAyah} to ${r.endSurah}:${r.endAyah}`,
            description: JSON.stringify({ type: 'range', ...r }),
            target_value: r.totalAyahs,
            target_unit: 'ayahs'
          });
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { padding: 6 },
  headerAvatarText: { fontFamily: Fonts.sansBold, fontSize: 16, letterSpacing: -0.3 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  feedContent: { padding: 16, paddingBottom: 32 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyCard: { alignItems: 'center', gap: 14, padding: 32, borderRadius: 24, borderWidth: 0, width: '100%' },
  emptyTitle: { fontFamily: Fonts.sansBold, fontSize: 20, letterSpacing: -0.4 },
  emptySub: { fontFamily: Fonts.sans, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100 },
  emptyBtnText: { fontFamily: Fonts.sansBold, fontSize: 15 },
  goalCard: { borderRadius: 24, padding: 18, borderWidth: 0, marginBottom: 16 },
  goalCardHeader: { flexDirection: 'row', alignItems: 'center' },
  goalIconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goalTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 16, marginBottom: 2, letterSpacing: -0.3 },
  goalMeta: { fontFamily: Fonts.sans, fontSize: 13 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressPct: { fontFamily: Fonts.mono, fontSize: 11, marginTop: 4, textAlign: 'right' },
  readBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },
  milestoneRow: { alignItems: 'center', marginBottom: 16 },
  milestonePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 0 },
  milestoneText: { fontFamily: Fonts.sansSemiBold, fontSize: 12, letterSpacing: 0.2 },
  bubbleRow: { marginBottom: 8, alignItems: 'flex-end' },
  bubble: { maxWidth: '82%', padding: 14, borderRadius: 20, borderWidth: 0 },
  bubbleText: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  bubbleTime: { fontFamily: Fonts.mono, fontSize: 10, marginTop: 6, textAlign: 'right', letterSpacing: 0.5 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  composerGoalBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 0 },
  composerInput: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontFamily: Fonts.sans, fontSize: 15, maxHeight: 120, borderWidth: 0 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
