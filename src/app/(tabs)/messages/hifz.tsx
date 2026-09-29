import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassBlur } from '../../../components/ui/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft, Brain, Calculator, Calendar, CheckCircle,
  ChevronRight, Flame, RefreshCw, Target, TrendingUp,
  Shuffle, BookOpen, AlertCircle, X, Check, Minus, Share, Play, Pause, Lock,
} from 'lucide-react-native';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { supabase } from '../../../lib/supabase';
import { fetchVerseByKey } from '../../../services/quranApi';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Fonts } from '../../../constants/theme';

import { MutashabihatPanel } from '../../../components/hifz/MutashabihatPanel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Quran Data ───────────────────────────────────────────────────────────────
const TOTAL_AYAHS = 6236;
const TOTAL_JUZ   = 30;
const AYAH_PER_JUZ = Math.ceil(TOTAL_AYAHS / TOTAL_JUZ); // ~208

// Surah names (1-indexed)
const SURAH_NAMES: Record<number, string> = {
  1:'Al-Fatihah',2:'Al-Baqarah',3:"Ali 'Imran",4:"An-Nisa'",5:'Al-Ma\'idah',
  6:"Al-An'am",7:"Al-A'raf",8:'Al-Anfal',9:'At-Tawbah',10:'Yunus',
  11:'Hud',12:'Yusuf',13:'Ar-Ra\'d',14:'Ibrahim',15:'Al-Hijr',
  16:'An-Nahl',17:'Al-Isra',18:'Al-Kahf',19:'Maryam',20:'Ta-Ha',
  21:'Al-Anbiya',22:'Al-Hajj',23:"Al-Mu'minun",24:'An-Nur',25:'Al-Furqan',
  26:"Ash-Shu'ara",27:'An-Naml',28:'Al-Qasas',29:"Al-'Ankabut",30:'Ar-Rum',
  31:'Luqman',32:'As-Sajdah',33:'Al-Ahzab',34:'Saba',35:'Fatir',
  36:'Ya-Sin',37:'As-Saffat',38:'Sad',39:'Az-Zumar',40:'Ghafir',
  41:'Fussilat',42:'Ash-Shura',43:'Az-Zukhruf',44:'Ad-Dukhan',45:'Al-Jathiyah',
  46:'Al-Ahqaf',47:'Muhammad',48:'Al-Fath',49:'Al-Hujurat',50:'Qaf',
  51:'Adh-Dhariyat',52:'At-Tur',53:'An-Najm',54:'Al-Qamar',55:'Ar-Rahman',
  56:"Al-Waqi'ah",57:'Al-Hadid',58:'Al-Mujadila',59:'Al-Hashr',60:'Al-Mumtahanah',
  61:'As-Saf',62:"Al-Jumu'ah",63:'Al-Munafiqun',64:'At-Taghabun',65:'At-Talaq',
  66:'At-Tahrim',67:'Al-Mulk',68:'Al-Qalam',69:'Al-Haqqah',70:"Al-Ma'arij",
  71:'Nuh',72:'Al-Jinn',73:'Al-Muzzammil',74:'Al-Muddaththir',75:'Al-Qiyamah',
  76:'Al-Insan',77:'Al-Mursalat',78:"An-Naba'",79:"An-Nazi'at",80:"'Abasa",
  81:'At-Takwir',82:'Al-Infitar',83:'Al-Mutaffifin',84:'Al-Inshiqaq',85:'Al-Buruj',
  86:'At-Tariq',87:'Al-A\'la',88:'Al-Ghashiyah',89:'Al-Fajr',90:'Al-Balad',
  91:'Ash-Shams',92:'Al-Layl',93:'Ad-Duha',94:'Ash-Sharh',95:'At-Tin',
  96:"Al-'Alaq",97:'Al-Qadr',98:'Al-Bayyinah',99:'Az-Zalzalah',100:"Al-'Adiyat",
  101:'Al-Qari\'ah',102:'At-Takathur',103:"Al-'Asr",104:'Al-Humazah',105:'Al-Fil',
  106:'Quraysh',107:"Al-Ma'un",108:'Al-Kawthar',109:'Al-Kafirun',110:'An-Nasr',
  111:'Al-Masad',112:'Al-Ikhlas',113:'Al-Falaq',114:'An-Nas',
};

const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

// JUZ boundaries (which surah each juz starts at)
const JUZ_SURAH_START: Record<number, { surah: number; ayah: number }> = {
  1:{surah:1,ayah:1},2:{surah:2,ayah:142},3:{surah:2,ayah:253},4:{surah:3,ayah:93},
  5:{surah:4,ayah:24},6:{surah:4,ayah:148},7:{surah:5,ayah:82},8:{surah:6,ayah:111},
  9:{surah:7,ayah:88},10:{surah:8,ayah:41},11:{surah:9,ayah:93},12:{surah:11,ayah:6},
  13:{surah:12,ayah:53},14:{surah:15,ayah:1},15:{surah:17,ayah:1},16:{surah:18,ayah:75},
  17:{surah:21,ayah:1},18:{surah:23,ayah:1},19:{surah:25,ayah:21},20:{surah:27,ayah:56},
  21:{surah:29,ayah:46},22:{surah:33,ayah:31},23:{surah:36,ayah:28},24:{surah:39,ayah:32},
  25:{surah:41,ayah:47},26:{surah:46,ayah:1},27:{surah:51,ayah:31},28:{surah:58,ayah:1},
  29:{surah:67,ayah:1},30:{surah:78,ayah:1},
};

// ─── Hifz Calculator Engine ───────────────────────────────────────────────────
// REVIEW_CONSTANT: fraction of daily capacity needed per memorized ayah
// Tuned conservatively (~0.002 → reviewing 500 ayahs takes ~1 ayah/day capacity)
const REVIEW_CONSTANT = 0.002;

function calcCompletion(memorizedAyahs: number, dailyPace: number): {
  optimisticDays: number;
  realisticDays: number;
  milestones: { juz: number; day: number }[];
} {
  const remaining = TOTAL_AYAHS - memorizedAyahs;
  if (remaining <= 0) return { optimisticDays: 0, realisticDays: 0, milestones: [] };

  // Optimistic: flat pace
  const optimisticDays = Math.ceil(remaining / dailyPace);

  // Realistic: simulate day-by-day with growing review burden
  let memorized = memorizedAyahs;
  let days = 0;
  const milestones: { juz: number; day: number }[] = [];
  const ayahsPerJuz = TOTAL_AYAHS / TOTAL_JUZ;

  while (memorized < TOTAL_AYAHS && days < 99999) {
    const reviewLoad = memorized * REVIEW_CONSTANT;
    const netNew = Math.max(1, dailyPace - reviewLoad);
    memorized = Math.min(TOTAL_AYAHS, memorized + netNew);
    days++;

    // Check juz milestones
    const juzDone = Math.floor(memorized / ayahsPerJuz);
    const prevJuzDone = Math.floor((memorized - netNew) / ayahsPerJuz);
    for (let j = prevJuzDone + 1; j <= juzDone; j++) {
      if (j <= TOTAL_JUZ && !milestones.find(m => m.juz === j)) {
        milestones.push({ juz: j, day: days });
      }
    }
  }

  return { optimisticDays: optimisticDays, realisticDays: days, milestones };
}

function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Calculator Panel ─────────────────────────────────────────────────────────
function CalculatorPanel({ colors, isDark, userId }: { colors: any; isDark: boolean; userId: string }) {
  const [memorizedAyahs, setMemorizedAyahs] = useState('0');
  const [dailyPace, setDailyPace]           = useState(10);
  const [saving, setSaving]                 = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);

  const PACE_OPTIONS = [5, 10, 20, 30];

  const result = useMemo(() =>
    calcCompletion(Number(memorizedAyahs) || 0, dailyPace),
    [memorizedAyahs, dailyPace]
  );

  // Load saved settings
  useEffect(() => {
    supabase.from('hifz_settings').select('*').eq('user_id', userId).single()
      .then(({ data }) => {
        if (data) {
          setMemorizedAyahs(String(data.total_memorized_ayahs ?? 0));
          setDailyPace(data.daily_pace_ayahs ?? 10);
        }
      });
  }, [userId]);

  const save = async () => {
    setSaving(true);
    await supabase.from('hifz_settings').upsert({
      user_id: userId,
      total_memorized_ayahs: Number(memorizedAyahs) || 0,
      daily_pace_ayahs: dailyPace,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Your Hifz settings have been updated.');
  };

  const pct = Math.min(100, Math.round(((Number(memorizedAyahs) || 0) / TOTAL_AYAHS) * 100));

  // Build load curve data (5 sample points)
  const curvePoints = useMemo(() => {
    const pts = [];
    for (let step = 0; step <= 4; step++) {
      const simMemorized = (Number(memorizedAyahs) || 0) + (step / 4) * (TOTAL_AYAHS - (Number(memorizedAyahs) || 0));
      const reviewLoad = simMemorized * REVIEW_CONSTANT;
      const newLoad = Math.max(0, dailyPace - reviewLoad);
      const total = newLoad + reviewLoad;
      pts.push({ newPct: total > 0 ? (newLoad / total) * 100 : 100, reviewPct: total > 0 ? (reviewLoad / total) * 100 : 0 });
    }
    return pts;
  }, [memorizedAyahs, dailyPace]);

  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Overall Progress */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <TrendingUp size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>My Hifz Journey</Text>
          </View>

          {/* Progress arc replaced with clean bar */}
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>
                {Number(memorizedAyahs).toLocaleString()} / {TOTAL_AYAHS.toLocaleString()} ayahs
              </Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{pct}%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.skeleton }]}>
              <LinearGradient
                colors={[colors.primary, colors.primary + 'aa']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${pct}%` as any }]}
              />
            </View>
          </View>

          {/* Memorized ayahs input */}
          <Text style={[styles.sheetLabel, { color: colors.textTertiary, marginTop: 20 }]}>AYAHS MEMORIZED SO FAR</Text>
          <TextInput
            value={memorizedAyahs}
            onChangeText={setMemorizedAyahs}
            keyboardType="number-pad"
            placeholder="e.g. 500"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          />
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            1 Juz ≈ {AYAH_PER_JUZ} ayahs · Full Quran = 6,236 ayahs
          </Text>
        </View>
      </Animated.View>

      {/* Daily Pace */}
      <Animated.View entering={FadeInDown.duration(400).delay(80)}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Flame size={18} color="#f59e0b" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Daily Pace</Text>
          </View>
          <View style={styles.paceRow}>
            {PACE_OPTIONS.map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setDailyPace(p)}
                style={[styles.paceBtn, {
                  backgroundColor: dailyPace === p ? colors.text : colors.surface,
                  borderColor: dailyPace === p ? colors.text : colors.border,
                }]}
              >
                <Text style={[styles.paceBtnNum, { color: dailyPace === p ? colors.background : colors.text }]}>{p}</Text>
                <Text style={[styles.paceBtnUnit, { color: dailyPace === p ? colors.background + 'cc' : colors.textTertiary }]}>ayahs</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10 }}>
            <Text style={[styles.hint, { color: colors.textTertiary, flex: 1 }]}>Custom pace:</Text>
            <TextInput
              value={String(dailyPace)}
              onChangeText={t => { const n = parseInt(t); if (!isNaN(n) && n > 0) setDailyPace(n); }}
              keyboardType="number-pad"
              style={[styles.input, { flex: 0, width: 80, textAlign: 'center', backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, paddingVertical: 8 }]}
            />
          </View>
        </View>
      </Animated.View>

      {/* Projection Results */}
      {(Number(memorizedAyahs) < TOTAL_AYAHS) && (
        <Animated.View entering={FadeInDown.duration(400).delay(160)}>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Calendar size={18} color="#6366f1" />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Projected Completion</Text>
            </View>

            {/* Two-column comparison */}
            <View style={styles.projRow}>
              <View style={[styles.projBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.projLabel, { color: colors.textTertiary }]}>Optimistic</Text>
                <Text style={[styles.projDays, { color: colors.textSecondary }]}>{result.optimisticDays}</Text>
                <Text style={[styles.projUnit, { color: colors.textTertiary }]}>days</Text>
                <Text style={[styles.projDate, { color: colors.textSecondary }]}>{addDays(result.optimisticDays)}</Text>
                <Text style={[styles.projNote, { color: colors.textTertiary }]}>No review modeled</Text>
              </View>
              <View style={[styles.projBox, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '40' }]}>
                <Text style={[styles.projLabel, { color: colors.primary }]}>Realistic</Text>
                <Text style={[styles.projDays, { color: colors.primary }]}>{result.realisticDays}</Text>
                <Text style={[styles.projUnit, { color: colors.primary + 'aa' }]}>days</Text>
                <Text style={[styles.projDate, { color: colors.primary }]}>{addDays(result.realisticDays)}</Text>
                <Text style={[styles.projNote, { color: colors.primary + '99' }]}>With review load</Text>
              </View>
            </View>

            {/* Load curve visualization */}
            <Text style={[styles.sheetLabel, { color: colors.textTertiary, marginTop: 20 }]}>DAILY CAPACITY SPLIT (OVER YOUR JOURNEY)</Text>
            <View style={styles.curveContainer}>
              {curvePoints.map((pt, i) => (
                <View key={i} style={styles.curveBar}>
                  <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                    {/* Review load (lighter, on top) */}
                    <View style={{
                      height: `${pt.reviewPct}%` as any,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                      borderRadius: 3,
                    }} />
                    {/* New memorization (colored, on bottom) */}
                    <View style={{
                      height: `${pt.newPct}%` as any,
                      backgroundColor: colors.primary,
                      borderRadius: 3,
                    }} />
                  </View>
                  <Text style={[styles.curveLabel, { color: colors.textTertiary }]}>
                    {['Start', '25%', '50%', '75%', 'End'][i]}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.textTertiary }]}>New memorization</Text>
              <View style={[styles.legendDot, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
              <Text style={[styles.legendText, { color: colors.textTertiary }]}>Review</Text>
            </View>

            {/* Milestones toggle */}
            <TouchableOpacity
              onPress={() => setShowMilestones(s => !s)}
              style={[styles.milestonesToggle, { borderTopColor: colors.border }]}
            >
              <Text style={[styles.milestonesToggleText, { color: colors.text }]}>
                {showMilestones ? 'Hide' : 'Show'} Juz milestones
              </Text>
              <ChevronRight size={16} color={colors.textTertiary}
                style={{ transform: [{ rotate: showMilestones ? '90deg' : '0deg' }] }} />
            </TouchableOpacity>

            {showMilestones && (
              <View style={{ gap: 6, marginTop: 8 }}>
                {result.milestones.slice(0, 30).map(m => (
                  <View key={m.juz} style={styles.milestoneRow}>
                    <Text style={[styles.milestoneJuz, { color: colors.textSecondary }]}>Juz {m.juz}</Text>
                    <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: 8 }} />
                    <Text style={[styles.milestoneDate, { color: colors.textTertiary }]}>{addDays(m.day)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      )}

      {Number(memorizedAyahs) >= TOTAL_AYAHS && (
        <View style={[styles.card, { backgroundColor: '#10b98118', borderColor: '#10b981' }]}>
          <CheckCircle size={28} color="#10b981" style={{ alignSelf: 'center' }} />
          <Text style={[styles.cardTitle, { color: '#10b981', textAlign: 'center', marginTop: 8 }]}>
            MashaAllah — Full Quran Memorized!
          </Text>
          <Text style={[styles.hint, { color: '#10b981aa', textAlign: 'center' }]}>
            Use the Retention Test to protect your hifz.
          </Text>
        </View>
      )}

      {/* Save button */}
      <TouchableOpacity
        onPress={save}
        disabled={saving}
        style={[styles.saveBtn, { backgroundColor: colors.text, opacity: saving ? 0.6 : 1 }]}
      >
        {saving ? <ActivityIndicator color={colors.background} size="small" />
          : <Text style={[styles.saveBtnText, { color: colors.background }]}>Save Settings</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Retention Test Panel ─────────────────────────────────────────────────────
type TestMode = 'random_drop' | 'spot_check' | 'full_khatm' | 'transitions';
type Rating   = 'correct' | 'hesitated' | 'incorrect';

const MODE_META: Record<TestMode, { label: string; sub: string; icon: any; color: string }> = {
  random_drop: { label: 'Random Ayah Drop',   sub: 'A random starting point from your memorized range',  icon: Shuffle,    color: '#6366f1' },
  spot_check:  { label: 'Juz Spot-Check',      sub: '5 random points within a chosen juz — 5 min check', icon: Target,     color: '#f59e0b' },
  full_khatm:  { label: 'Full Khatm Cycle',    sub: 'All 30 juz over a 60–90 day rolling schedule',       icon: RefreshCw,  color: '#10b981' },
  transitions: { label: 'Transition Points',   sub: 'Surah/juz boundaries — known weak spots',            icon: AlertCircle,color: '#ef4444' },
};

// Ayahs at surah boundaries (transition points) — subset of well-known ones
const TRANSITION_AYAHS = [
  {surah:2,ayah:1},{surah:3,ayah:1},{surah:4,ayah:1},{surah:5,ayah:1},
  {surah:6,ayah:1},{surah:7,ayah:1},{surah:9,ayah:1},{surah:10,ayah:1},
  {surah:18,ayah:1},{surah:36,ayah:1},{surah:67,ayah:1},{surah:78,ayah:1},
];

// Surahs that begin with Muqatta'at (disjointed letters) — Ayah 1 of these
// surahs shows only the mysterious letters (e.g. "الم", "يس") which are
// not suitable as a recitation prompt in a Hifz test.
const MUQATTAAT_SURAHS = new Set([
  2, 3, 7, 10, 11, 12, 13, 14, 15, 19, 20, 26, 27, 28, 29, 30, 31, 32, 36,
  38, 40, 41, 42, 43, 44, 45, 46, 50, 68,
]);

function getRandomAyah(maxMemorizedAyahsInput: number | string): { surah: number; ayah: number } {
  const maxMemorizedAyahs = parseInt(String(maxMemorizedAyahsInput), 10);
  const maxAyah = Math.min(isNaN(maxMemorizedAyahs) ? TOTAL_AYAHS : maxMemorizedAyahs, TOTAL_AYAHS);
  let running = 0;
  const targetAyah = Math.floor(Math.random() * maxAyah) + 1;
  for (let s = 0; s < SURAH_AYAH_COUNTS.length; s++) {
    running += SURAH_AYAH_COUNTS[s];
    if (running >= targetAyah) {
      const surahNumber = s + 1;
      let ayahInSurah = Math.max(1, SURAH_AYAH_COUNTS[s] - (running - targetAyah));
      // Skip Ayah 1 of Muqatta'at surahs to avoid disjointed letter prompts
      if (MUQATTAAT_SURAHS.has(surahNumber) && ayahInSurah === 1) {
        ayahInSurah = 2;
      }
      return { surah: surahNumber, ayah: ayahInSurah };
    }
  }
  return { surah: 1, ayah: 1 };
}

function RetentionPanel({ colors, isDark, userId, memorizedAyahs }: {
  colors: any; isDark: boolean; userId: string; memorizedAyahs: number;
}) {
  const [selectedMode, setSelectedMode] = useState<TestMode>('random_drop');
  const [selectedJuz, setSelectedJuz]   = useState(1);
  const [testActive, setTestActive]     = useState(false);
  const [testAyah, setTestAyah]         = useState<{ surah: number; ayah: number } | null>(null);
  const [testAyahText, setTestAyahText] = useState<string>('');
  const [testLoading, setTestLoading]   = useState(false);
  const [audioUrl, setAudioUrl]         = useState<string | null>(null);
  const player                          = useAudioPlayer(audioUrl);
  const status                          = useAudioPlayerStatus(player);
  const [saving, setSaving]             = useState(false);
  const [sessions, setSessions]         = useState<any[]>([]);
  const [weakAyahs, setWeakAyahs]       = useState<any[]>([]);
  const [myCircles, setMyCircles]       = useState<any[]>([]);
  const [shareSessionTarget, setShareSessionTarget] = useState<any | null>(null);

  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  useEffect(() => {
    // Configure audio to play even if the device is on silent mode
    setAudioModeAsync({ playsInSilentMode: true });
    
    // Load recent sessions
    supabase.from('retention_sessions')
      .select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => { if (data) setSessions(data); });

    // Load weak ayahs (ease_factor < 2.0)
    supabase.from('ayah_retention')
      .select('*').eq('user_id', userId)
      .lt('ease_factor', 2.0)
      .order('ease_factor', { ascending: true }).limit(5)
      .then(({ data }) => { if (data) setWeakAyahs(data); });

    // Load user's circles for sharing
    supabase.from('circle_members')
      .select('circle_id, circles(name)')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .then(({ data }) => {
        if (data) setMyCircles(data.map((d: any) => ({ id: d.circle_id, name: d.circles.name })));
      });
  }, [userId]);

  const getCachedAudio = async (remoteUrl: string, ayahKey: string) => {
    const cacheDir = FileSystem.documentDirectory + 'quran_audio/';
    const fileUri = cacheDir + `${ayahKey.replace(':', '_')}.mp3`;
    
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }

    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      return fileUri;
    }

    const downloadResult = await FileSystem.downloadAsync(remoteUrl, fileUri);
    return downloadResult.uri;
  };

  const startTest = async () => {
    // Stop current audio if playing
    if (player.playing) {
      player.pause();
    }
    setAudioUrl(null);

    let ayah: { surah: number; ayah: number };
    if (selectedMode === 'random_drop') {
      ayah = getRandomAyah(memorizedAyahs || TOTAL_AYAHS);
    } else if (selectedMode === 'spot_check') {
      const juzBound = JUZ_SURAH_START[selectedJuz];
      const maxOffset = Math.min(20, Math.max(0, SURAH_AYAH_COUNTS[juzBound.surah - 1] - juzBound.ayah));
      ayah = { surah: juzBound.surah, ayah: juzBound.ayah + Math.floor(Math.random() * (maxOffset + 1)) };
    } else if (selectedMode === 'transitions') {
      ayah = TRANSITION_AYAHS[Math.floor(Math.random() * TRANSITION_AYAHS.length)];
    } else {
      ayah = getRandomAyah(memorizedAyahs || TOTAL_AYAHS);
    }
    
    setTestLoading(true);
    setTestAyah(ayah);
    setTestActive(true);

    try {
      // Find the verse directly from our local database for 0ms latency and 100% reliability
      let verseText = '';
      try {
        const resp = await fetch(`https://api.quran.com/api/v4/verses/by_key/${ayah.surah}:${ayah.ayah}?fields=text_uthmani`);
        const json = await resp.json();
        verseText = json?.verse?.text_uthmani ?? '';
      } catch {}
      
      if (verseText) {
        setTestAyahText(verseText);
        
        // Generate the audio URL manually
        const surahStr = String(ayah.surah).padStart(3, '0');
        const ayahStr = String(ayah.ayah).padStart(3, '0');
        const audioUrl = `https://verses.quran.com/Alafasy/mp3/${surahStr}${ayahStr}.mp3`;
        
        // Use our local caching logic
        const localAudioUri = await getCachedAudio(audioUrl, `${ayah.surah}:${ayah.ayah}`);
        setAudioUrl(localAudioUri);
      } else {
        setTestAyahText('Unable to load text.');
      }
    } catch (e) {
      setTestAyahText('Unable to load text.');
    }
    setTestLoading(false);
  };

  // Auto-play when audio is loaded
  useEffect(() => {
    if (status.isLoaded && !status.playing && audioUrl) {
      player.play();
    }
  }, [status.isLoaded, audioUrl]);

  const replayAudio = () => {
    if (audioUrl) {
      player.pause();
      player.seekTo(0);
      // Slight delay ensures the native layer processes the seek before attempting to play
      setTimeout(() => {
        player.play();
      }, 10);
    }
  };

  const submitRating = async (rating: Rating) => {
    if (!testAyah) return;
    setSaving(true);
    const score = rating === 'correct' ? 100 : rating === 'hesitated' ? 60 : 20;

    await supabase.from('retention_sessions').insert({
      user_id: userId,
      mode: selectedMode,
      surah_number: testAyah.surah,
      ayah_number: testAyah.ayah,
      score,
      self_rating: rating,
    });

    // Update spaced retention schedule
    const easeAdj = rating === 'correct' ? 0.1 : rating === 'hesitated' ? -0.05 : -0.2;
    const { data: existing } = await supabase.from('ayah_retention')
      .select('interval_days, ease_factor').eq('user_id', userId)
      .eq('surah_number', testAyah.surah).eq('ayah_number', testAyah.ayah).single();

    const prevInterval = existing?.interval_days ?? 1;
    const prevEase     = existing?.ease_factor ?? 2.5;
    const newEase      = Math.max(1.3, prevEase + easeAdj);
    const newInterval  = rating === 'incorrect' ? 1 : Math.round(prevInterval * newEase);
    const nextDue      = new Date();
    nextDue.setDate(nextDue.getDate() + newInterval);

    await supabase.from('ayah_retention').upsert({
      user_id: userId,
      surah_number: testAyah.surah,
      ayah_number: testAyah.ayah,
      last_tested_at: new Date().toISOString(),
      next_due_at: nextDue.toISOString(),
      interval_days: newInterval,
      ease_factor: newEase,
    });

    setTestActive(false);
    setTestAyah(null);
    setSaving(false);
    setAudioUrl(null);
    player.pause();

    // Reload
    const { data } = await supabase.from('retention_sessions')
      .select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(5);
    if (data) setSessions(data);
  };

  // Active test UI
  if (testActive && testAyah) {
    const meta = MODE_META[selectedMode];
    const Icon = meta.icon;
    return (
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.testCard, { backgroundColor: cardBg, borderColor: meta.color + '40' }]}>
          <View style={[styles.testBadge, { backgroundColor: meta.color + '18' }]}>
            <Icon size={16} color={meta.color} />
            <Text style={[styles.testBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>

          <Text style={[styles.testInstruction, { color: colors.textTertiary }]}>
            Recite from this point from memory:
          </Text>

          <View style={[styles.testAyahBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {testLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <Text style={[styles.testAyahArabic, { color: colors.text }]}>
                {testAyahText}
              </Text>
            )}
            
            <View style={styles.testAyahMeta}>
              <Text style={[styles.testSurahName, { color: colors.primary }]}>
                {SURAH_NAMES[testAyah.surah] ?? `Surah ${testAyah.surah}`}
              </Text>
              <View style={[styles.testDot, { backgroundColor: colors.border }]} />
              <Text style={[styles.testAyahNum, { color: colors.textTertiary }]}>
                Ayah {testAyah.ayah}
              </Text>
            </View>

            {audioUrl && (
              <TouchableOpacity onPress={replayAudio} style={[styles.replayBtn, { backgroundColor: colors.background }]}>
                {status.playing ? <Play size={16} color={colors.primary} /> : <RefreshCw size={16} color={colors.textTertiary} />}
                <Text style={[styles.replayText, { color: status.playing ? colors.primary : colors.textTertiary }]}>
                  {status.playing ? 'Playing...' : 'Replay Audio'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.testSelfLabel, { color: colors.textTertiary }]}>
            How did you do?
          </Text>

          {saving ? (
            <ActivityIndicator color={colors.text} style={{ marginTop: 16 }} />
          ) : (
            <View style={styles.ratingRow}>
              <TouchableOpacity
                onPress={() => submitRating('incorrect')}
                style={[styles.ratingBtn, { backgroundColor: '#ef444418', borderColor: '#ef4444' }]}
              >
                <X size={20} color="#ef4444" />
                <Text style={[styles.ratingText, { color: '#ef4444' }]}>Difficult</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => submitRating('hesitated')}
                style={[styles.ratingBtn, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b' }]}
              >
                <Minus size={20} color="#f59e0b" />
                <Text style={[styles.ratingText, { color: '#f59e0b' }]}>Hesitated</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => submitRating('correct')}
                style={[styles.ratingBtn, { backgroundColor: '#10b98118', borderColor: '#10b981' }]}
              >
                <Check size={20} color="#10b981" />
                <Text style={[styles.ratingText, { color: '#10b981' }]}>Fluent</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={() => setTestActive(false)} style={{ marginTop: 16, alignSelf: 'center' }}>
            <Text style={[styles.cancelTest, { color: colors.textTertiary }]}>Cancel test</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Mode selector */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>TEST MODE</Text>
        {(Object.keys(MODE_META) as TestMode[]).map(mode => {
          const meta = MODE_META[mode];
          const Icon = meta.icon;
          const active = selectedMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              onPress={() => setSelectedMode(mode)}
              style={[styles.modeRow, {
                backgroundColor: active ? meta.color + '12' : cardBg,
                borderColor: active ? meta.color : colors.border,
              }]}
            >
              <View style={[styles.modeIcon, { backgroundColor: meta.color + '18' }]}>
                <Icon size={16} color={meta.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.modeLabel, { color: colors.text }]}>{meta.label}</Text>
                <Text style={[styles.modeSub, { color: colors.textTertiary }]}>{meta.sub}</Text>
              </View>
              {active && <CheckCircle size={18} color={meta.color} />}
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Juz picker for spot check */}
      {selectedMode === 'spot_check' && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary, marginTop: 20 }]}>CHOOSE JUZ</Text>
          <View style={styles.juzGrid}>
            {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
              <TouchableOpacity
                key={j}
                onPress={() => setSelectedJuz(j)}
                style={[styles.juzBtn, {
                  backgroundColor: selectedJuz === j ? colors.text : colors.surface,
                  borderColor: selectedJuz === j ? colors.text : colors.border,
                }]}
              >
                <Text style={[styles.juzBtnText, { color: selectedJuz === j ? colors.background : colors.text }]}>{j}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Start test button */}
      <TouchableOpacity
        onPress={startTest}
        style={[styles.startBtn, { backgroundColor: colors.text }]}
      >
        <BookOpen size={18} color={colors.background} />
        <Text style={[styles.startBtnText, { color: colors.background }]}>Begin Test</Text>
      </TouchableOpacity>

      {/* Needs Reinforcement */}
      {weakAyahs.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary, marginTop: 24 }]}>NEEDS REINFORCEMENT</Text>
          <View style={[styles.card, { backgroundColor: '#ef444408', borderColor: '#ef444430' }]}>
            {weakAyahs.map((a, i) => (
              <View key={i} style={[styles.weakRow, i < weakAyahs.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <AlertCircle size={14} color="#ef4444" />
                <Text style={[styles.weakText, { color: colors.text }]}>
                  {SURAH_NAMES[a.surah_number]} · Ayah {a.ayah_number}
                </Text>
                <Text style={[styles.weakEase, { color: colors.textTertiary }]}>
                  Ease {Number(a.ease_factor).toFixed(1)}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(160)}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary, marginTop: 24 }]}>RECENT SESSIONS</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: colors.border }]}>
            {sessions.map((s, i) => {
              const ratingColor = s.self_rating === 'correct' ? '#10b981' : s.self_rating === 'hesitated' ? '#f59e0b' : '#ef4444';
              return (
                <View key={s.id} style={[styles.sessionRow, i < sessions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sessionSurah, { color: colors.text }]}>
                      {SURAH_NAMES[s.surah_number]} · Ayah {s.ayah_number}
                    </Text>
                    <Text style={[styles.sessionDate, { color: colors.textTertiary }]}>
                      {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.ratingPill, { backgroundColor: ratingColor + '18', borderColor: ratingColor + '40' }]}>
                      <Text style={[styles.ratingPillText, { color: ratingColor }]}>{s.self_rating}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShareSessionTarget(s)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Share size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>
      )}

      {/* Share to Circle Modal */}
      <Modal visible={!!shareSessionTarget} transparent animationType="slide">
        <GlassBlur intensity={isDark ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShareSessionTarget(null)} />
          <View style={{ backgroundColor: isDark ? 'rgba(18,18,18,0.92)' : 'rgba(250,250,250,0.92)', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.3)', alignSelf: 'center', marginBottom: 20 }} />
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 8, fontSize: 20 }]}>Share Outcome</Text>
            <Text style={[styles.testInstruction, { color: colors.textTertiary, marginBottom: 24 }]}>
              Select a circle to share your Hifz retention test outcome.
            </Text>

            {myCircles.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Target size={40} color={colors.textTertiary} style={{ marginBottom: 12 }} />
                <Text style={{ color: colors.textTertiary, fontFamily: Fonts.sans, textAlign: 'center' }}>You are not in any circles.</Text>
              </View>
            ) : (
              <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 20, overflow: 'hidden' }}>
                {myCircles.map((c, i) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.shareCircleRow, { borderBottomColor: colors.border, padding: 16 }, i < myCircles.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth }]}
                    onPress={async () => {
                      const s = shareSessionTarget;
                      const content = `Fluent on Surah ${SURAH_NAMES[s.surah_number]} Ayah ${s.ayah_number}: ${s.self_rating}`;
                      await supabase.from('circle_messages').insert({
                        circle_id: c.id,
                        user_id: userId,
                        type: 'hifz_outcome',
                        message: content
                      });
                      setShareSessionTarget(null);
                      Alert.alert('Shared', `Shared to ${c.name}`);
                    }}
                  >
                    <Text style={[styles.shareCircleName, { color: colors.text, fontFamily: Fonts.sansSemiBold, fontSize: 16 }]}>{c.name}</Text>
                    <Share size={18} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </GlassBlur>
      </Modal>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HifzScreen() {
  const { colors, isDark } = useAppTheme();
  const [userId, setUserId]               = useState('');
  const [isLoggedIn, setIsLoggedIn]       = useState<boolean | null>(null); // null = still checking
  const [memorizedAyahs, setMemorizedAyahs] = useState(0);
  const [activeTab, setActiveTab]         = useState<'calculator' | 'retention' | 'mutashabihat'>('calculator');
  const tint = isDark ? 'dark' : 'light';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setIsLoggedIn(false); return; }
      setIsLoggedIn(true);
      setUserId(user.id);
      supabase.from('hifz_settings').select('total_memorized_ayahs')
        .eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setMemorizedAyahs(data.total_memorized_ayahs ?? 0); });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserId(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUserId('');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Still checking auth
  if (isLoggedIn === null) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Not logged in — show gate
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <GlassBlur intensity={80} tint={tint} style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/messages')} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Hifz</Text>
          </View>
          <View style={{ width: 38 }} />
        </GlassBlur>
        {/* Auth gate */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 20 }}>
          <Animated.View entering={FadeInDown.duration(500).easing(Easing.out(Easing.exp))} style={{ alignItems: 'center', gap: 20 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: colors.primary + '18',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock size={32} color={colors.primary} />
            </View>
            <Text style={{ fontFamily: Fonts.display, fontSize: 22, color: colors.text, textAlign: 'center' }}>
              Hifz Tracker
            </Text>
            <Text style={{ fontFamily: Fonts.sans, fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
              Sign in to track your memorisation progress, run retention tests, and review similar verses.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 40,
                borderRadius: 28, marginTop: 8,
              }}
              onPress={() => router.push('/auth')}
              activeOpacity={0.85}
            >
              <Text style={{ fontFamily: Fonts.sansSemiBold, fontSize: 16, color: '#fff' }}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <GlassBlur intensity={80} tint={tint} style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/messages')} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Hifz</Text>
          <Text style={[styles.headerSub, { color: colors.textTertiary }]}>
            {memorizedAyahs > 0
              ? `${Math.round((memorizedAyahs / TOTAL_AYAHS) * 100)}% memorized`
              : 'Track your memorization journey'}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </GlassBlur>

      {/* Tab switcher */}
      <View style={[styles.tabRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['calculator', 'retention', 'mutashabihat'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.text, borderBottomWidth: 2 }]}
          >
            {tab === 'calculator'
              ? <Calculator size={14} color={activeTab === tab ? colors.text : colors.textTertiary} />
              : tab === 'retention'
              ? <Brain size={14} color={activeTab === tab ? colors.text : colors.textTertiary} />
              : <BookOpen size={14} color={activeTab === tab ? colors.text : colors.textTertiary} />}
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.text : colors.textTertiary }]}>
              {tab === 'calculator' ? 'Calculator' : tab === 'retention' ? 'Retention Test' : 'Mutashabihat'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Panels */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        {activeTab === 'calculator'
          ? <CalculatorPanel colors={colors} isDark={isDark} userId={userId} />
          : activeTab === 'retention'
          ? <RetentionPanel colors={colors} isDark={isDark} userId={userId} memorizedAyahs={memorizedAyahs} />
          : <MutashabihatPanel colors={colors} isDark={isDark} />}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:    { flex: 1 },
  header:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Fonts.display, fontSize: 18, letterSpacing: -0.4 },
  headerSub:   { fontFamily: Fonts.sans, fontSize: 13, marginTop: 2 },

  tabRow:  { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  tabText: { fontFamily: Fonts.sansSemiBold, fontSize: 14 },

  card:       { borderRadius: 24, padding: 20, borderWidth: 0, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardTitle:  { fontFamily: Fonts.sansSemiBold, fontSize: 16, letterSpacing: -0.3 },

  sheetLabel:  { fontFamily: Fonts.sansSemiBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  input:       { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14, fontFamily: Fonts.sans, fontSize: 15, borderWidth: 0, marginBottom: 8 },
  hint:        { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  metaLabel:   { fontFamily: Fonts.sans, fontSize: 13 },
  metaValue:   { fontFamily: Fonts.mono, fontSize: 14 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 4 },

  paceRow:     { flexDirection: 'row', gap: 10, marginTop: 14 },
  paceBtn:     { flex: 1, borderRadius: 16, borderWidth: 0, alignItems: 'center', paddingVertical: 14 },
  paceBtnNum:  { fontFamily: Fonts.mono, fontSize: 22 },
  paceBtnUnit: { fontFamily: Fonts.sans, fontSize: 12, marginTop: 2, letterSpacing: 0.2 },

  projRow:     { flexDirection: 'row', gap: 12, marginTop: 14 },
  projBox:     { flex: 1, borderRadius: 20, padding: 16, borderWidth: 0, alignItems: 'center', gap: 4 },
  projLabel:   { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  projDays:    { fontFamily: Fonts.sansBold, fontSize: 34, letterSpacing: -1 },
  projUnit:    { fontFamily: Fonts.sans, fontSize: 12, letterSpacing: 0.2 },
  projDate:    { fontFamily: Fonts.sansMedium, fontSize: 13, textAlign: 'center', marginTop: 4 },
  projNote:    { fontFamily: Fonts.sans, fontSize: 12, textAlign: 'center', lineHeight: 18 },

  curveContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 80, marginTop: 12, marginBottom: 8 },
  curveBar:       { flex: 1, height: '100%', alignItems: 'center', gap: 4 },
  curveLabel:     { fontFamily: Fonts.sans, fontSize: 10 },
  legendRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  legendDot:      { width: 8, height: 8, borderRadius: 4 },
  legendText:     { fontFamily: Fonts.sans, fontSize: 12, marginRight: 8 },

  milestonesToggle:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, marginTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  milestonesToggleText: { fontFamily: Fonts.sansMedium, fontSize: 15 },
  milestoneRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  milestoneJuz:         { fontFamily: Fonts.sansSemiBold, fontSize: 14, width: 60 },
  milestoneDate:        { fontFamily: Fonts.mono, fontSize: 13 },

  saveBtn:     { borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  saveBtnText: { fontFamily: Fonts.sansBold, fontSize: 16 },

  sectionTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },
  modeRow:  { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 0, padding: 16, marginBottom: 12 },
  modeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modeLabel:{ fontFamily: Fonts.sansSemiBold, fontSize: 16, letterSpacing: -0.3 },
  modeSub:  { fontFamily: Fonts.sans, fontSize: 13, marginTop: 2, lineHeight: 18 },

  juzGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  juzBtn:    { width: 46, height: 46, borderRadius: 14, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },
  juzBtnText:{ fontFamily: Fonts.mono, fontSize: 14 },

  startBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 100, paddingVertical: 16, marginTop: 12 },
  startBtnText: { fontFamily: Fonts.sansBold, fontSize: 16 },

  testCard:        { borderRadius: 24, padding: 24, borderWidth: 0, marginBottom: 16 },
  testBadge:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', marginBottom: 20 },
  testBadgeText:   { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  testInstruction: { fontFamily: Fonts.sans, fontSize: 15, marginBottom: 16, lineHeight: 22 },
  testAyahBox:     { borderRadius: 20, padding: 24, borderWidth: 0, alignItems: 'center', marginVertical: 24, width: '100%' },
  testAyahArabic:  { fontFamily: Fonts.arabic, fontSize: 36, textAlign: 'center', lineHeight: 68, paddingVertical: 12, marginBottom: 16 },
  testAyahMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  testSurahName:   { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  testDot:         { width: 4, height: 4, borderRadius: 2 },
  testAyahNum:     { fontFamily: Fonts.mono, fontSize: 14 },
  testAyahHint:    { fontFamily: Fonts.sans, fontSize: 13 },
  replayBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 },
  replayText:      { fontFamily: Fonts.sansMedium, fontSize: 14 },
  testSelfLabel:   { fontFamily: Fonts.sansSemiBold, fontSize: 15, textAlign: 'center', marginBottom: 16 },
  ratingRow:       { flexDirection: 'row', gap: 12 },
  ratingBtn:       { flex: 1, borderRadius: 16, borderWidth: 0, alignItems: 'center', paddingVertical: 14, gap: 4 },
  ratingText:      { fontFamily: Fonts.sansSemiBold, fontSize: 14 },
  cancelTest:      { fontFamily: Fonts.sans, fontSize: 15 },

  weakRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  weakText:   { fontFamily: Fonts.sansMedium, fontSize: 15, flex: 1 },
  weakEase:   { fontFamily: Fonts.sans, fontSize: 13 },

  sessionRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  sessionSurah: { fontFamily: Fonts.sansMedium, fontSize: 15, marginBottom: 2 },
  sessionDate:  { fontFamily: Fonts.sans, fontSize: 13 },
  ratingPill:   { borderRadius: 100, borderWidth: 0, paddingHorizontal: 12, paddingVertical: 6 },
  ratingPillText: { fontFamily: Fonts.sansSemiBold, fontSize: 12, textTransform: 'capitalize' },
  
  // Modal & Share Styles
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 48 },
  modalTitle: { fontFamily: Fonts.sansBold, fontSize: 20, marginBottom: 8, letterSpacing: -0.4 },
  modalDesc: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  modalBtnText: { color: '#fff', fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  shareCircleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  shareCircleName: { fontFamily: Fonts.sansMedium, fontSize: 16 },
  cancelBtn: { marginTop: 20, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 16, color: '#ef4444' }
});
