import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { GlassBlur } from '../ui/GlassCard';
import { X, ChevronDown, ChevronUp, BookOpen, ArrowRight, Target } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Fonts } from '../../constants/theme';
import { fetchChapters } from '../../services/quranApi';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { requestSurah } from '../../state/readerState';

const ITEM_HEIGHT = 44;

const SURAH_AYAH_COUNTS = [
  7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,
  59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,
  52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,
  21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6,
];

function getTotalAyahsBetween(ss: number, sa: number, es: number, ea: number): number {
  if (ss === es) return Math.max(0, ea - sa + 1);
  let total = (SURAH_AYAH_COUNTS[ss - 1] || 0) - sa + 1;
  for (let s = ss + 1; s < es; s++) total += SURAH_AYAH_COUNTS[s - 1] || 0;
  total += ea;
  return total;
}

// ── Wheel Picker ──────────────────────────────────────────
interface WheelPickerProps {
  data: any[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  renderItem: (item: any, isSelected: boolean, index: number) => React.ReactNode;
}

const WheelPicker = ({ data, selectedIndex, onIndexChange, renderItem }: WheelPickerProps) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const paddedData = [null, null, ...data, null, null];

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    }, 100);
  }, []);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (index !== selectedIndex && index >= 0 && index < data.length) {
      onIndexChange(index);
    }
  };

  return (
    <View style={{ height: ITEM_HEIGHT * 5, overflow: 'hidden' }}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {paddedData.map((item, i) => {
          const actualIndex = i - 2;
          const isSelected = actualIndex === selectedIndex;
          return (
            <View key={i} style={{ height: ITEM_HEIGHT, justifyContent: 'center' }}>
              {item !== null ? renderItem(item, isSelected, actualIndex) : null}
            </View>
          );
        })}
      </ScrollView>
      <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', justifyContent: 'center' }]}>
        <View style={{ height: ITEM_HEIGHT, backgroundColor: 'rgba(150,150,150,0.12)', borderRadius: 8, marginHorizontal: 8 }} />
      </View>
    </View>
  );
};

// ── Progress Ring ─────────────────────────────────────────
function ProgressRing({ pct, size, color }: { pct: number; size: number; color: string }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, borderWidth: 4, borderColor: 'rgba(150,150,150,0.15)' }]} />
      <View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, borderWidth: 4, borderColor: color, opacity: Math.max(0.2, pct / 100) }]} />
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontFamily: Fonts.sansBold, fontSize: size * 0.22, color }}>{Math.round(pct)}%</Text>
      </View>
    </View>
  );
}

// ── Types ─────────────────────────────────────────────────
export interface CircleGoal {
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
  totalAyahs: number;
}

interface MemberProgress {
  userId: string;
  name: string;
  ayahsRead: number;
  lastSurah: number | null;
  lastAyah: number | null;
}

interface CircleGoalPickerModalProps {
  visible: boolean;
  onClose: () => void;
  // Circle mode
  circleId?: string;
  isAdmin?: boolean;
  currentReadingGoal?: CircleGoal | null;
  currentHifzGoal?: CircleGoal | null;
  onGoalSaved?: (goal: CircleGoal, type: 'reading' | 'hifz') => void;
  // Personal mode — skips all circle-specific UI
  personalMode?: boolean;
  onPersonalGoalSaved?: (goal: CircleGoal) => void;
}

// ── Main Component ────────────────────────────────────────
export function CircleGoalPickerModal({
  visible,
  onClose,
  circleId,
  isAdmin,
  currentReadingGoal,
  currentHifzGoal,
  onGoalSaved,
  personalMode = false,
  onPersonalGoalSaved,
}: CircleGoalPickerModalProps) {
  const { colors, isDark } = useAppTheme();
  const [goalType, setGoalType] = useState<'reading' | 'hifz'>('reading');

  const currentGoal = goalType === 'reading' ? currentReadingGoal : currentHifzGoal;

  const [chapters, setChapters] = useState<any[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [saving, setSaving] = useState(false);

  const [startSurah, setStartSurah] = useState(currentGoal?.startSurah ?? 2);
  const [startAyah, setStartAyah] = useState(currentGoal?.startAyah ?? 1);
  const [endSurah, setEndSurah] = useState(currentGoal?.endSurah ?? 2);
  const [endAyah, setEndAyah] = useState(currentGoal?.endAyah ?? 286);
  const [expandedSection, setExpandedSection] = useState<'from' | 'to' | null>(null);

  useEffect(() => {
    setStartSurah(currentGoal?.startSurah ?? 2);
    setStartAyah(currentGoal?.startAyah ?? 1);
    setEndSurah(currentGoal?.endSurah ?? 2);
    setEndAyah(currentGoal?.endAyah ?? 286);
  }, [goalType, currentGoal]);

  const [memberProgress, setMemberProgress] = useState<MemberProgress[]>([]);
  const [myProgress, setMyProgress] = useState<MemberProgress | null>(null);
  const [avgPct, setAvgPct] = useState(0);
  const [userId, setUserId] = useState('');

  const textPrimary = isDark ? '#fff' : '#000';
  const textSecondary = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    fetchChapters('en').then(data => {
      setChapters(data?.chapters || []);
      setLoadingChapters(false);
    });
  }, []);

  useEffect(() => {
    if (!visible || personalMode) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data: allMembers } = await supabase
        .from('circle_members')
        .select('user_id, goal_ayahs_read, goal_last_surah, goal_last_ayah, status, role, users(display_name)')
        .eq('circle_id', circleId!);

      if (allMembers) {
        const members = allMembers.filter((m: any) => m.status === 'approved' || m.role === 'admin');
        const parsed: MemberProgress[] = members.map((m: any) => ({
          userId: m.user_id,
          name: m.users?.display_name || 'Member',
          ayahsRead: m.goal_ayahs_read || 0,
          lastSurah: m.goal_last_surah,
          lastAyah: m.goal_last_ayah,
        }));
        setMemberProgress(parsed);
        const me = parsed.find(p => p.userId === user?.id) || null;
        setMyProgress(me);

        const total = currentGoal?.totalAyahs || 1;
        const avg = parsed.length > 0
          ? parsed.reduce((acc, p) => acc + Math.min(p.ayahsRead / total, 1), 0) / parsed.length * 100
          : 0;
        setAvgPct(avg);
      }
    })();
  }, [visible, circleId, personalMode]);
  const getSurahName = (id: number) => {
    const ch = (chapters || []).find(c => c.id === id);
    return ch ? ch.name_simple : `Surah ${id}`;
  };

  const totalAyahs = getTotalAyahsBetween(startSurah, startAyah, endSurah, endAyah);

  const handleSave = async () => {
    const goal: CircleGoal = { startSurah, startAyah, endSurah, endAyah, totalAyahs };

    if (personalMode) {
      onPersonalGoalSaved?.(goal);
      onClose();
      return;
    }

    if (!isAdmin) return;
    setSaving(true);
    
    const updates: any = goalType === 'reading' ? {
      goal_start_surah: startSurah,
      goal_start_ayah: startAyah,
      goal_end_surah: endSurah,
      goal_end_ayah: endAyah,
      goal_total_ayahs: totalAyahs,
      group_goal_type: 'ayahs',
      group_goal_target: String(totalAyahs),
    } : {
      hifz_goal_start_surah: startSurah,
      hifz_goal_start_ayah: startAyah,
      hifz_goal_end_surah: endSurah,
      hifz_goal_end_ayah: endAyah,
      hifz_goal_total_ayahs: totalAyahs,
    };

    const { error } = await supabase.from('circles').update(updates).eq('id', circleId!);
    setSaving(false);
    if (!error) {
      onGoalSaved?.(goal, goalType);
      onClose();
    }
  };

  const handleGoRead = () => {
    if (!currentGoal) return;
    onClose();
    // We pass the circleId into the internal readerState so it resumes from the circle's last position!
    requestSurah(currentGoal.startSurah, currentGoal.startAyah, circleId);
    router.push({
      pathname: '/(tabs)/reader',
    });
  };

  const myPct = currentGoal?.totalAyahs
    ? Math.min((myProgress?.ayahsRead || 0) / currentGoal.totalAyahs * 100, 100)
    : 0;

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <GlassBlur intensity={isDark ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: isDark ? 'rgba(18,18,18,0.92)' : 'rgba(250,250,250,0.92)' }]}>
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: textPrimary }]}>
                {personalMode ? 'Set Reading Goal' : 'Circle Goal'}
              </Text>
              {!personalMode && currentGoal ? (
                <Text style={[styles.headerSub, { color: textSecondary }]} numberOfLines={1}>
                  {getSurahName(currentGoal.startSurah)} {currentGoal.startSurah}:{currentGoal.startAyah} → {getSurahName(currentGoal.endSurah)} {currentGoal.endSurah}:{currentGoal.endAyah}
                </Text>
              ) : (
                <Text style={[styles.headerSub, { color: textSecondary }]}>
                  {personalMode ? 'Pick the ayahs you want to read' : 'No goal set yet'}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
              <X size={18} color={textSecondary} />
            </TouchableOpacity>
          </View>

          {!personalMode && (
            <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 10, backgroundColor: cardBg, borderRadius: 8, padding: 4 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: goalType === 'reading' ? colors.primary : 'transparent' }}
                onPress={() => setGoalType('reading')}
              >
                <Text style={{ color: goalType === 'reading' ? '#fff' : textSecondary, fontFamily: Fonts.sansSemiBold }}>Reading Goal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: goalType === 'hifz' ? colors.primary : 'transparent' }}
                onPress={() => setGoalType('hifz')}
              >
                <Text style={{ color: goalType === 'hifz' ? '#fff' : textSecondary, fontFamily: Fonts.sansSemiBold }}>Hifz Goal</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}>

            {/* Progress Section — circle mode only */}
            {!personalMode && currentGoal && (
              <View style={{ marginTop: 20 }}>
                <View style={[styles.progressCard, { backgroundColor: cardBg }]}>
                  <View style={styles.progressCardInner}>
                    <ProgressRing pct={avgPct} size={72} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: 20 }}>
                      <Text style={[styles.progressLabel, { color: textPrimary }]}>Group Progress</Text>
                      <Text style={[styles.progressSub, { color: textSecondary }]}>
                        Avg across {memberProgress.length} member{memberProgress.length !== 1 ? 's' : ''}
                      </Text>
                      <Text style={[styles.progressMeta, { color: textSecondary }]}>
                        {currentGoal.totalAyahs} ayahs total
                      </Text>
                    </View>
                  </View>

                  {/* My progress */}
                  <View style={[styles.myProgressRow, { borderTopColor: borderColor }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.myProgressLabel, { color: textPrimary }]}>Your Progress</Text>
                      <Text style={[styles.myProgressSub, { color: textSecondary }]}>
                        {myProgress?.ayahsRead || 0} / {currentGoal.totalAyahs} ayahs
                        {myProgress?.lastSurah
                          ? ` · Last: ${getSurahName(myProgress.lastSurah)} ${myProgress.lastSurah}:${myProgress.lastAyah}`
                          : ''}
                      </Text>
                    </View>
                    <View style={styles.miniBarContainer}>
                      <View style={[styles.miniBar, { backgroundColor: borderColor }]}>
                        <View style={[styles.miniBarFill, { backgroundColor: colors.primary, width: `${myPct}%` as any }]} />
                      </View>
                      <Text style={[styles.miniBarPct, { color: colors.primary }]}>{Math.round(myPct)}%</Text>
                    </View>
                  </View>
                </View>

                {/* Open in Reader */}
                <TouchableOpacity style={[styles.goReadBtn, { backgroundColor: colors.primary }]} onPress={handleGoRead}>
                  <BookOpen size={18} color={isDark ? '#000' : '#fff'} />
                  <Text style={[styles.goReadText, { color: isDark ? '#000' : '#fff' }]}>Open in Reader</Text>
                  <ArrowRight size={16} color={isDark ? '#000' : 'rgba(255,255,255,0.7)'} />
                </TouchableOpacity>

                {/* Member Leaderboard */}
                {memberProgress.length > 1 && (
                  <View style={{ marginTop: 24 }}>
                    <Text style={[styles.sectionLabel, { color: textSecondary }]}>MEMBERS</Text>
                    <View style={[styles.membersCard, { backgroundColor: cardBg }]}>
                      {memberProgress
                        .sort((a, b) => b.ayahsRead - a.ayahsRead)
                        .map((m, idx) => {
                          const pct = currentGoal.totalAyahs > 0
                            ? Math.min(m.ayahsRead / currentGoal.totalAyahs * 100, 100)
                            : 0;
                          const isMe = m.userId === userId;
                          return (
                            <View
                              key={m.userId}
                              style={[
                                styles.memberRow,
                                idx < memberProgress.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
                              ]}
                            >
                              <Text style={[styles.memberRank, { color: textSecondary }]}>#{idx + 1}</Text>
                              <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.memberName, { color: isMe ? colors.primary : textPrimary }]}>
                                  {m.name}{isMe ? ' (You)' : ''}
                                </Text>
                                <View style={styles.memberBarWrap}>
                                  <View style={[styles.memberBar, { backgroundColor: borderColor }]}>
                                    <View style={[styles.memberBarFill, {
                                      backgroundColor: isMe ? colors.primary : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                                      width: `${pct}%` as any,
                                    }]} />
                                  </View>
                                  <Text style={[styles.memberBarPct, { color: textSecondary }]}>{Math.round(pct)}%</Text>
                                </View>
                              </View>
                            </View>
                          );
                        })}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Goal Picker — admin (circle) or personalMode */}
            {(personalMode || isAdmin) && (
              <View style={{ marginTop: 28 }}>
                <Text style={[styles.sectionLabel, { color: textSecondary }]}>
                  {currentGoal ? 'UPDATE GOAL RANGE' : 'SET GOAL RANGE'}
                </Text>

                {loadingChapters ? (
                  <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
                ) : (
                  <View style={[styles.rangeCard, { backgroundColor: cardBg }]}>
                    {/* FROM */}
                    <TouchableOpacity
                      style={[styles.rangeRow, { borderBottomColor: borderColor, borderBottomWidth: StyleSheet.hairlineWidth }]}
                      onPress={() => setExpandedSection(expandedSection === 'from' ? null : 'from')}
                    >
                      <Text style={[styles.rangeLabel, { color: textPrimary }]}>From</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.rangeValue, { color: colors.primary }]}>
                          {getSurahName(startSurah)} {startSurah}:{startAyah}
                        </Text>
                        {expandedSection === 'from' ? <ChevronUp size={16} color={textSecondary} /> : <ChevronDown size={16} color={textSecondary} />}
                      </View>
                    </TouchableOpacity>

                    {expandedSection === 'from' && (
                      <View style={[styles.pickerContainer, { borderBottomColor: borderColor }]}>
                        <View style={{ flex: 2 }}>
                          <WheelPicker
                            data={chapters}
                            selectedIndex={startSurah - 1}
                            onIndexChange={i => { setStartSurah(i + 1); setStartAyah(1); }}
                            renderItem={(item, isSel) => (
                              <Text style={[styles.pickerItem, { color: isSel ? textPrimary : textSecondary }, isSel && { fontFamily: Fonts.sansSemiBold }]} numberOfLines={1}>
                                {item.id}. {item.name_simple}
                              </Text>
                            )}
                          />
                        </View>
                        <View style={[styles.pickerDivider, { backgroundColor: borderColor }]} />
                        <View style={{ flex: 1 }}>
                          <WheelPicker
                            data={Array.from({ length: chapters.find((c: any) => c.id === startSurah)?.verses_count || 0 }, (_, k) => k + 1)}
                            selectedIndex={startAyah - 1}
                            onIndexChange={i => setStartAyah(i + 1)}
                            renderItem={(_, isSel, i) => (
                              <Text style={[styles.pickerItem, { color: isSel ? textPrimary : textSecondary, textAlign: 'center' }, isSel && { fontFamily: Fonts.sansSemiBold }]}>
                                Ayah {i + 1}
                              </Text>
                            )}
                          />
                        </View>
                      </View>
                    )}

                    {/* TO */}
                    <TouchableOpacity
                      style={[styles.rangeRow, expandedSection === 'to' && { borderBottomColor: borderColor, borderBottomWidth: StyleSheet.hairlineWidth }]}
                      onPress={() => setExpandedSection(expandedSection === 'to' ? null : 'to')}
                    >
                      <Text style={[styles.rangeLabel, { color: textPrimary }]}>To</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.rangeValue, { color: colors.primary }]}>
                          {getSurahName(endSurah)} {endSurah}:{endAyah}
                        </Text>
                        {expandedSection === 'to' ? <ChevronUp size={16} color={textSecondary} /> : <ChevronDown size={16} color={textSecondary} />}
                      </View>
                    </TouchableOpacity>

                    {expandedSection === 'to' && (
                      <View style={[styles.pickerContainer, { borderBottomColor: borderColor }]}>
                        <View style={{ flex: 2 }}>
                          <WheelPicker
                            data={chapters}
                            selectedIndex={endSurah - 1}
                            onIndexChange={i => { setEndSurah(i + 1); setEndAyah(1); }}
                            renderItem={(item, isSel) => (
                              <Text style={[styles.pickerItem, { color: isSel ? textPrimary : textSecondary }, isSel && { fontFamily: Fonts.sansSemiBold }]} numberOfLines={1}>
                                {item.id}. {item.name_simple}
                              </Text>
                            )}
                          />
                        </View>
                        <View style={[styles.pickerDivider, { backgroundColor: borderColor }]} />
                        <View style={{ flex: 1 }}>
                          <WheelPicker
                            data={Array.from({ length: chapters.find((c: any) => c.id === endSurah)?.verses_count || 0 }, (_, k) => k + 1)}
                            selectedIndex={endAyah - 1}
                            onIndexChange={i => setEndAyah(i + 1)}
                            renderItem={(_, isSel, i) => (
                              <Text style={[styles.pickerItem, { color: isSel ? textPrimary : textSecondary, textAlign: 'center' }, isSel && { fontFamily: Fonts.sansSemiBold }]}>
                                Ayah {i + 1}
                              </Text>
                            )}
                          />
                        </View>
                      </View>
                    )}

                    {/* Total */}
                    <View style={[styles.totalRow, { borderTopColor: borderColor }]}>
                      <Target size={14} color={textSecondary} />
                      <Text style={[styles.totalText, { color: textSecondary }]}>{totalAyahs} ayahs selected</Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator size="small" color={isDark ? '#000' : '#fff'} /> : <Text style={[styles.saveBtnText, { color: isDark ? '#000' : '#fff' }]}>Save Goal</Text>}
                </TouchableOpacity>
              </View>
            )}

            {!isAdmin && !currentGoal && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Target size={48} color={textSecondary} />
                <Text style={[styles.emptyText, { color: textPrimary }]}>No group goal set yet</Text>
                <Text style={[styles.emptySub, { color: textSecondary }]}>Ask an admin to set a reading goal.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </GlassBlur>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '90%', overflow: 'hidden' },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.3)', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontFamily: Fonts.sansBold, fontSize: 20 },
  headerSub: { fontFamily: Fonts.sans, fontSize: 13, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  sectionLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
  progressCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  progressCardInner: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  progressLabel: { fontFamily: Fonts.sansBold, fontSize: 16, marginBottom: 4 },
  progressSub: { fontFamily: Fonts.sans, fontSize: 13 },
  progressMeta: { fontFamily: Fonts.sans, fontSize: 12, marginTop: 4 },
  myProgressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, gap: 12 },
  myProgressLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 14, marginBottom: 2 },
  myProgressSub: { fontFamily: Fonts.sans, fontSize: 12 },
  miniBarContainer: { alignItems: 'flex-end', gap: 4 },
  miniBar: { width: 80, height: 4, borderRadius: 2, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 2 },
  miniBarPct: { fontFamily: Fonts.sansSemiBold, fontSize: 12 },
  goReadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 16, marginBottom: 4 },
  goReadText: { fontFamily: Fonts.sansBold, fontSize: 16, color: '#fff' },
  membersCard: { borderRadius: 16, overflow: 'hidden' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  memberRank: { fontFamily: Fonts.sansBold, fontSize: 13, width: 28 },
  memberName: { fontFamily: Fonts.sansSemiBold, fontSize: 14, marginBottom: 6 },
  memberBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberBar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  memberBarFill: { height: '100%', borderRadius: 2 },
  memberBarPct: { fontFamily: Fonts.sansMedium, fontSize: 12, width: 36, textAlign: 'right' },
  rangeCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  rangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  rangeLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  rangeValue: { fontFamily: Fonts.sans, fontSize: 15 },
  pickerContainer: { flexDirection: 'row', height: ITEM_HEIGHT * 5, borderBottomWidth: StyleSheet.hairlineWidth },
  pickerDivider: { width: 1, marginVertical: 20 },
  pickerItem: { fontFamily: Fonts.sans, fontSize: 15, paddingHorizontal: 12 },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 14, borderTopWidth: StyleSheet.hairlineWidth },
  totalText: { fontFamily: Fonts.sansMedium, fontSize: 13 },
  saveBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontFamily: Fonts.sansBold, fontSize: 16, color: '#fff' },
  emptyText: { fontFamily: Fonts.sansBold, fontSize: 17, marginTop: 16, marginBottom: 4 },
  emptySub: { fontFamily: Fonts.sans, fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
});
