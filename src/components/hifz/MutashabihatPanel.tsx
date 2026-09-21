import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, Alert, Modal, FlatList, Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { BookOpen, Shuffle, ChevronDown, ChevronRight, X, Search, Eye, Volume2 } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, Easing } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { Fonts } from '../../constants/theme';

const ARABIC_FONT = 'AmiriQuran';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Verse {
  verse_key: string;
  surah: number;
  ayah: number;
  surah_name_english: string;
  surah_name_arabic: string;
  arabic: string;
  translation: string;
  similar_verses?: Verse[];
}

interface SurahMutashabihatResponse {
  surah: number;
  surah_name_english: string;
  surah_name_arabic: string;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  verses: Verse[];
}

const SURAH_NAMES: Record<number, string> = {
  1:'Al-Fatihah',2:'Al-Baqarah',3:"Ali 'Imran",4:"An-Nisa'",5:"Al-Ma'idah",
  6:"Al-An'am",7:"Al-A'raf",8:'Al-Anfal',9:'At-Tawbah',10:'Yunus',
  11:'Hud',12:'Yusuf',13:"Ar-Ra'd",14:'Ibrahim',15:'Al-Hijr',
  16:'An-Nahl',17:"Al-Isra'",18:'Al-Kahf',19:'Maryam',20:'Ta-Ha',
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
  86:'At-Tariq',87:"Al-A'la",88:'Al-Ghashiyah',89:'Al-Fajr',90:'Al-Balad',
  91:'Ash-Shams',92:'Al-Layl',93:'Ad-Duha',94:'Ash-Sharh',95:'At-Tin',
  96:"Al-'Alaq",97:'Al-Qadr',98:'Al-Bayyinah',99:'Az-Zalzalah',100:"Al-'Adiyat",
  101:"Al-Qari'ah",102:'At-Takathur',103:"Al-'Asr",104:'Al-Humazah',105:'Al-Fil',
  106:'Quraysh',107:"Al-Ma'un",108:'Al-Kawthar',109:'Al-Kafirun',110:'An-Nasr',
  111:'Al-Masad',112:'Al-Ikhlas',113:'Al-Falaq',114:'An-Nas',
};

// ── BlurredSimilarVerse ───────────────────────────────────────────────────────
function BlurredSimilarVerse({ verse, colors, isDark, playVerseAudio }: { verse: Verse; colors: any; isDark: boolean; playVerseAudio?: (s: number, a: number) => void }) {
  const [revealed, setRevealed] = useState(false);
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : colors.border;
  const cardBg    = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  return (
    <View style={[s.similarCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
      {/* Header always visible */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={[s.verseRef, { color: colors.primary }]}>
          {verse.surah_name_english}  ·  {verse.surah}:{verse.ayah}
        </Text>
        {revealed && playVerseAudio && (
          <TouchableOpacity onPress={() => playVerseAudio(verse.surah, verse.ayah)} style={{ padding: 4 }}>
            <Volume2 size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Arabic text — blurred until revealed */}
      <View style={s.blurWrapper}>
        <Text style={[s.arabicTextSimilar, { color: colors.text }]}>
          {verse.arabic}
        </Text>
        {!revealed && (
          <BlurView
            intensity={isDark ? 30 : 22}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}
        {!revealed && (
          <TouchableOpacity
            style={s.revealOverlay}
            onPress={() => {
              setRevealed(true);
              if (playVerseAudio) playVerseAudio(verse.surah, verse.ayah);
            }}
            activeOpacity={0.7}
          >
            <View style={[s.revealBadge, { backgroundColor: colors.primary }]}>
              <Eye size={14} color="#fff" />
              <Text style={s.revealText}>Tap to reveal</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Translation — only show after reveal */}
      {revealed && (
        <Animated.Text entering={FadeIn.duration(300)} style={[s.translationText, { color: colors.textSecondary, fontSize: 13, marginTop: 8 }]}>
          {verse.translation}
        </Animated.Text>
      )}
    </View>
  );
}

// ── VersePair card ─────────────────────────────────────────────────────────────
function VersePair({ verse, colors, isDark, index, autoPlay, playVerseAudio }: { verse: Verse; colors: any; isDark: boolean; index: number; autoPlay?: boolean; playVerseAudio?: (s: number, a: number) => void }) {
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : colors.border;
  const cardBg    = isDark ? 'rgba(255,255,255,0.06)' : '#fff';

  useEffect(() => {
    if (autoPlay && playVerseAudio) {
      playVerseAudio(verse.surah, verse.ayah);
    }
  }, [verse.verse_key, autoPlay]);

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(380).easing(Easing.out(Easing.cubic))}>
      <View style={[s.pairCard, { backgroundColor: cardBg, borderColor: borderCol }]}>

        {/* ── Source verse — always fully shown ── */}
        <View style={s.sourceHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[s.sourceBadge, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[s.sourceBadgeText, { color: colors.primary }]}>Source verse</Text>
            </View>
            {playVerseAudio && (
              <TouchableOpacity onPress={() => playVerseAudio(verse.surah, verse.ayah)} style={[s.sourceBadge, { backgroundColor: colors.primary + '18', paddingHorizontal: 6 }]}>
                <Volume2 size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          {verse.similar_verses && verse.similar_verses.length > 0 && (
            <View style={[s.pairCount, { backgroundColor: colors.primary + '22' }]}>
              <Text style={[s.pairCountText, { color: colors.primary }]}>
                {verse.similar_verses.length} similar
              </Text>
            </View>
          )}
        </View>

        <Text style={[s.verseRef, { color: colors.primary, marginBottom: 8, marginTop: 6 }]}>
          {verse.surah_name_english}  ·  {verse.surah}:{verse.ayah}
        </Text>

        {/* Full Arabic in AmiriQuran */}
        <Text style={[s.arabicTextSource, { color: colors.text }]}>
          {verse.arabic}
        </Text>

        {/* English translation */}
        <Text style={[s.translationText, { color: colors.textSecondary }]}>
          {verse.translation}
        </Text>

        {/* ── Similar verses — blurred ── */}
        {verse.similar_verses && verse.similar_verses.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <View style={[s.divider, { backgroundColor: borderCol }]} />
            <Text style={[s.sectionLabel, { color: colors.textTertiary, marginTop: 12 }]}>
              {verse.similar_verses.length === 1 ? 'Similar Verse' : `${verse.similar_verses.length} Similar Verses`} — tap to reveal
            </Text>
            {verse.similar_verses.map((sv, i) => (
              <BlurredSimilarVerse key={i} verse={sv} colors={colors} isDark={isDark} playVerseAudio={playVerseAudio} />
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ── Surah Picker Modal ────────────────────────────────────────────────────────
function SurahPickerModal({
  visible, onClose, onSelect, colors,
}: {
  visible: boolean; onClose: () => void; onSelect: (n: number) => void; colors: any;
}) {
  const surahs = Array.from({ length: 114 }, (_, i) => i + 1);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <View style={[s.sheet, { backgroundColor: colors.background }]}>
        <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />
        <View style={s.sheetHeader}>
          <Text style={[s.sheetTitle, { color: colors.text }]}>Browse by Surah</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={surahs}
          keyExtractor={n => String(n)}
          renderItem={({ item: n }) => (
            <TouchableOpacity
              style={[s.surahRow, { borderBottomColor: colors.border }]}
              onPress={() => { onSelect(n); onClose(); }}
            >
              <Text style={[s.surahNum, { color: colors.primary }]}>{n}</Text>
              <Text style={[s.surahName, { color: colors.text }]}>{SURAH_NAMES[n]}</Text>
              <ChevronRight size={14} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────
type Mode = 'random' | 'browse';

export function MutashabihatPanel({ colors, isDark }: { colors: any; isDark: boolean }) {
  const [isFocused, setIsFocused]   = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  const [mode, setMode]             = useState<Mode>('random');
  const [loading, setLoading]       = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (!isFocused && player) {
      player.pause();
    }
  }, [isFocused, player]);

  useEffect(() => {
    if (status.isLoaded && !status.playing && audioUrl) {
      player.play();
    }
  }, [status.isLoaded, audioUrl]);

  const playVerseAudio = useCallback((surah: number, ayah: number) => {
    if (!isFocused) return;
    const surahStr = String(surah).padStart(3, '0');
    const ayahStr = String(ayah).padStart(3, '0');
    const url = `https://verses.quran.com/Alafasy/mp3/${surahStr}${ayahStr}.mp3`;
    setAudioUrl(url);
  }, [isFocused]);

  // Random
  const [randomVerse, setRandomVerse] = useState<Verse | null>(null);

  // Browse
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [browseData, setBrowseData]       = useState<Verse[]>([]);
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [surahInfo, setSurahInfo]         = useState<{ name: string; total: number } | null>(null);
  const [loadingMore, setLoadingMore]     = useState(false);

  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : colors.border;
  const cardBg    = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';

  const fetchRandom = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('https://ummahapi.com/api/quran/mutashabihat/random');
      const json = await res.json();
      if (json.success && json.data) setRandomVerse(json.data);
    } catch { Alert.alert('Error', 'Could not load a random verse pair.'); }
    setLoading(false);
  }, []);

  const fetchSurahPage = useCallback(async (surah: number, pg: number, append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(`https://ummahapi.com/api/quran/mutashabihat/${surah}?page=${pg}&limit=20`);
      const json = await res.json();
      if (json.success && json.data) {
        const d: SurahMutashabihatResponse = json.data;
        setSurahInfo({ name: d.surah_name_english, total: d.total });
        setTotalPages(d.total_pages);
        setBrowseData(prev => append ? [...prev, ...d.verses] : d.verses);
        setPage(d.page);
      }
    } catch { Alert.alert('Error', 'Could not load surah data.'); }
    if (!append) setLoading(false); else setLoadingMore(false);
  }, []);

  useEffect(() => {
    if (mode === 'random') fetchRandom();
  }, [mode, fetchRandom]);

  const onSurahSelect = (surah: number) => {
    setSelectedSurah(surah);
    setBrowseData([]);
    setPage(1);
    setSurahInfo(null);
    fetchSurahPage(surah, 1, false);
  };

  const loadNextPage = () => {
    if (selectedSurah && page < totalPages && !loadingMore) {
      fetchSurahPage(selectedSurah, page + 1, true);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Mode toggle */}
      <View style={[s.modeRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderColor: borderCol }]}>
        <TouchableOpacity
          style={[s.modeBtn, mode === 'random' && { backgroundColor: colors.primary }]}
          onPress={() => setMode('random')}
        >
          <Shuffle size={13} color={mode === 'random' ? '#fff' : colors.textTertiary} />
          <Text style={[s.modeBtnText, { color: mode === 'random' ? '#fff' : colors.textTertiary }]}>Random</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modeBtn, mode === 'browse' && { backgroundColor: colors.primary }]}
          onPress={() => { setMode('browse'); if (!selectedSurah) setPickerVisible(true); }}
        >
          <Search size={13} color={mode === 'browse' ? '#fff' : colors.textTertiary} />
          <Text style={[s.modeBtnText, { color: mode === 'browse' ? '#fff' : colors.textTertiary }]}>Browse Surah</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        onMomentumScrollEnd={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 80) loadNextPage();
        }}
        scrollEventThrottle={400}
      >
        {/* ── RANDOM MODE ─────────────────────────────────────────────────── */}
        {mode === 'random' && (
          <>
            <Text style={[s.intro, { color: colors.textTertiary }]}>
              1,200+ verses · 2,300+ similar-verse pairs across 81 surahs. Tap to reveal its similar pairs.
            </Text>

            {loading && !randomVerse && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}

            {randomVerse && !loading && (
              <Animated.View key={randomVerse.verse_key} entering={FadeIn.duration(400)}>
                <VersePair verse={randomVerse} colors={colors} isDark={isDark} index={0} autoPlay={true} playVerseAudio={playVerseAudio} />
              </Animated.View>
            )}

            <TouchableOpacity
              onPress={fetchRandom}
              style={[s.actionBtn, { backgroundColor: colors.primary }]}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Shuffle size={16} color="#fff" />}
              <Text style={s.actionBtnText}>Next Random Pair</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── BROWSE MODE ─────────────────────────────────────────────────── */}
        {mode === 'browse' && (
          <>
            <TouchableOpacity
              style={[s.surahBar, { backgroundColor: cardBg, borderColor: borderCol }]}
              onPress={() => setPickerVisible(true)}
            >
              <BookOpen size={16} color={colors.primary} />
              <Text style={[s.surahBarText, { color: colors.text }]}>
                {selectedSurah ? `${SURAH_NAMES[selectedSurah]} (${selectedSurah})` : 'Select a Surah'}
              </Text>
              {surahInfo && (
                <View style={[s.badge, { backgroundColor: colors.primary + '22' }]}>
                  <Text style={[s.badgeText, { color: colors.primary }]}>{surahInfo.total} pairs</Text>
                </View>
              )}
              <ChevronDown size={16} color={colors.textTertiary} />
            </TouchableOpacity>

            {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}

            {!loading && browseData.length === 0 && selectedSurah && (
              <View style={s.emptyState}>
                <Text style={[s.emptyText, { color: colors.textTertiary }]}>
                  No similar verse pairs found in {SURAH_NAMES[selectedSurah]}.
                </Text>
              </View>
            )}

            {!selectedSurah && !loading && (
              <View style={s.emptyState}>
                <BookOpen size={36} color={colors.textTertiary} />
                <Text style={[s.emptyText, { color: colors.textTertiary, marginTop: 12 }]}>
                  Select a surah to browse its similar verse pairs.
                </Text>
              </View>
            )}

            {browseData.map((v, i) => (
              <VersePair key={v.verse_key} verse={v} colors={colors} isDark={isDark} index={i} playVerseAudio={playVerseAudio} />
            ))}

            {loadingMore && <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />}

            {!loading && !loadingMore && browseData.length > 0 && page >= totalPages && (
              <Text style={[s.endText, { color: colors.textTertiary }]}>
                All {surahInfo?.total} pairs shown
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <SurahPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={onSurahSelect}
        colors={colors}
      />
    </View>
  );
}

const s = StyleSheet.create({
  modeRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 3, marginBottom: 16 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 11 },
  modeBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  intro: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17, marginBottom: 16 },

  // Source verse card
  pairCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14, overflow: 'hidden' },
  sourceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sourceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sourceBadgeText: { fontFamily: Fonts.sansSemiBold, fontSize: 11 },
  pairCount: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pairCountText: { fontFamily: Fonts.sansBold, fontSize: 11 },
  verseRef: { fontFamily: Fonts.sansSemiBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },

  // AmiriQuran arabic text
  arabicTextSource: { fontFamily: ARABIC_FONT, fontSize: 26, lineHeight: 50, textAlign: 'right', marginBottom: 10 },
  arabicTextSimilar: { fontFamily: ARABIC_FONT, fontSize: 22, lineHeight: 44, textAlign: 'right' },
  translationText: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },

  divider: { height: StyleSheet.hairlineWidth },
  sectionLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  // Blurred similar verse
  similarCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10, overflow: 'hidden' },
  blurWrapper: { position: 'relative', minHeight: 60, borderRadius: 8, overflow: 'hidden' },
  revealOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  revealBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  revealText: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: '#fff' },

  // Browse mode
  surahBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  surahBarText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontFamily: Fonts.sansBold, fontSize: 11 },

  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  actionBtnText: { fontFamily: Fonts.sansBold, color: '#fff', fontSize: 15 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyText: { fontFamily: Fonts.sans, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  endText: { fontFamily: Fonts.sans, fontSize: 12, textAlign: 'center', paddingVertical: 16 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { maxHeight: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 10, paddingHorizontal: 16 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle: { fontFamily: Fonts.sansBold, fontSize: 17 },
  surahRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  surahNum: { fontFamily: Fonts.sansBold, fontSize: 13, width: 28, textAlign: 'center' },
  surahName: { fontFamily: Fonts.sans, fontSize: 15, flex: 1 },
});


