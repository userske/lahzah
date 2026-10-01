/**
 * QuranBrowse — Landing screen for the Reader tab.
 * Shows a Surahs/Juz' toggle, recent pages, and a grouped list
 * of chapters (Surah mode) or juz sections (Juz' mode).
 * Tapping any row navigates into the full reader.
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Image,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassBlur } from '../../../components/ui/GlassCard';
import { router } from 'expo-router';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { Menu, Search, XCircle } from 'lucide-react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Fonts } from '../../../constants/theme';
import { useReadingProgress } from '../../../hooks/useReadingProgress';
import { fetchChapters } from '../../../services/quranApi';
import { AppBackground } from '../../../components/ui/AppBackground';
import { requestSurah } from '../../../state/readerState';
import { JUZ_DATA, SURAH_NAMES_ARABIC, SURAH_NAMES_SIMPLE, type JuzEntry } from '../../../data/juzData';
import { ReaderSettingsModal } from '../../../components/reader/ReaderSettingsModal';



interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  translated_name?: { name: string };
  revelation_place?: string;
  verses_count: number;
  pages?: number[];
}

type Tab = 'surahs' | 'juz';

export default function QuranBrowseScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { position } = useReadingProgress();

  const [tab, setTab] = useState<Tab>('surahs');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const smoothEntry = FadeInDown.duration(400).easing(Easing.out(Easing.quad));

  useEffect(() => {
    fetchChapters('en').then((data) => {
      if (data?.chapters) setChapters(data.chapters);
      setLoading(false);
    });
  }, []);

  const openReader = useCallback((surahId: number, ayahId?: number) => {
    requestSurah(surahId, ayahId);
    router.push('/reader');
  }, []);

  const openPageView = useCallback((pageNum: number = 1) => {
    // Page view navigates to the reader (mushaf page view toggled in reader settings)
    requestSurah(1);
    router.push('/(tabs)/reader');
  }, []);

  // ── Surahs tab ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return chapters;
    return chapters.filter(
      (c) =>
        c.name_simple.toLowerCase().includes(q) ||
        (c.translated_name?.name ?? '').toLowerCase().includes(q) ||
        String(c.id).includes(q)
    );
  }, [chapters, query]);

  // Group JUZ_DATA by juz number for SectionList
  const juzSections = useMemo(() => {
    const map = new Map<number, JuzEntry[]>();
    for (const entry of JUZ_DATA) {
      if (!map.has(entry.juz)) map.set(entry.juz, []);
      map.get(entry.juz)!.push(entry);
    }
    return Array.from(map.entries()).map(([juz, data]) => ({ juz, data }));
  }, []);

  // Recent pages (from reading progress)
  const recents: Array<{ name: string; surahId: number; page?: number }> = useMemo(() => {
    const out: Array<{ name: string; surahId: number; page?: number }> = [];
    if (position && chapters.length) {
      const ch = chapters.find((c) => c.id === position.surahNumber);
      if (ch) out.push({ name: ch.name_simple, surahId: ch.id });
    }
    return out;
  }, [position, chapters]);

  // ── Renderers ─────────────────────────────────────────────────────────
  const renderSurahRow = useCallback(
    ({ item, index }: { item: Chapter; index: number }) => {
      const isCurrent = position?.surahNumber === item.id;
      return (
        <Animated.View entering={smoothEntry.delay(Math.min(index * 20, 300))}>
          <TouchableOpacity
            style={[styles.surahRow, isCurrent && styles.surahRowActive]}
            onPress={() => openReader(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.surahNumBadge, isCurrent && styles.surahNumBadgeActive]}>
              <Text style={[styles.surahNum, isCurrent && styles.surahNumActive]}>
                {item.id}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.surahName, isCurrent && styles.surahNameActive]}>
                {item.name_simple}
              </Text>
              <Text style={styles.surahMeta}>
                {item.translated_name?.name ?? ''} · {item.revelation_place ?? ''} · {item.verses_count} verses
              </Text>
            </View>
            <Text style={[styles.surahArabic, isCurrent && { color: colors.primary }]}>
              {item.name_arabic}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [position, colors, styles, openReader, smoothEntry]
  );

  // ── Juz' entry renderer ────────────────────────────────────────────────────
  const renderJuzEntry = useCallback(
    ({ item, index }: { item: JuzEntry; index: number }) => {
      const surahName = SURAH_NAMES_SIMPLE[item.surah] ?? `Surah ${item.surah}`;
      const surahArabic = SURAH_NAMES_ARABIC[item.surah] ?? '';
      const isJuzStart = item.hizbLabel === 'Juz';
      const hizbDisplay = isJuzStart ? `Juz' ${item.juz}` : `${item.hizbLabel} ${Math.ceil(item.hizb / 2)}`;

      return (
        <TouchableOpacity
          style={styles.juzEntry}
          onPress={() => openReader(item.surah, item.ayah)}
          activeOpacity={0.7}
        >
          {/* Left content */}
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.hizbLabel}>{hizbDisplay}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.juzSurahName}>{surahName}</Text>
              <Text style={styles.juzSurahArabic}>{surahArabic}</Text>
              <Text style={styles.juzAyahRef}>· {item.surah}:{item.ayah}</Text>
            </View>
            <Text style={styles.juzAyahPreview} numberOfLines={1}>
              {/* Short Arabic snippet — fetched lazily or hardcoded for start ayahs */}
              {item.surah === 1 && item.ayah === 1 ? 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ...' :
               item.surah === 2 && item.ayah === 1 ? 'الم...' :
               item.surah === 2 && item.ayah === 25 ? 'وَبَشِّرِ الَّذِينَ آمَنُوا...' :
               item.surah === 2 && item.ayah === 43 ? 'وَأَقِيمُوا الصَّلَاةَ...' :
               item.surah === 2 && item.ayah === 60 ? 'وَإِذِ اسْتَسْقَىٰ مُوسَىٰ...' :
               item.surah === 2 && item.ayah === 75 ? 'أَفَتَطْمَعُونَ أَن يُؤْمِنُوا...' :
               item.surah === 2 && item.ayah === 92 ? 'وَلَقَدْ جَاءَكُم مُّوسَىٰ...' :
               item.surah === 2 && item.ayah === 106 ? 'مَا نَنسَخْ مِنْ آيَةٍ...' :
               item.surah === 2 && item.ayah === 124 ? 'وَإِذِ ابْتَلَىٰ إِبْرَاهِيمَ...' :
               '...'}
            </Text>
          </View>
          {/* Page number */}
          <Text style={styles.juzPageNum}>{item.page}</Text>
        </TouchableOpacity>
      );
    },
    [colors, styles, openReader]
  );

  const renderJuzHeader = ({ section }: { section: { juz: number } }) => (
    <View style={styles.juzSectionHeader}>
      <Text style={styles.juzSectionTitle}>Juz' {section.juz}</Text>
    </View>
  );

  if (loading) {
    return (
      <AppBackground>
        <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>Loading Quran…</Text>
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Top Nav ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navIconBtn} onPress={() => setShowSettings(true)}>
          <Menu size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>QURAN</Text>
        <TouchableOpacity style={styles.navIconBtn} onPress={() => router.push('/(tabs)/reader/search')}>
          <Search size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* ── Golden Last Read Card ── */}
      {recents.length > 0 && !query && (
        <TouchableOpacity 
          style={styles.heroCardWrap}
          activeOpacity={0.9}
          onPress={() => openReader(recents[0].surahId)}
        >
          <View style={styles.heroGradient}>
            <Image 
              source={require('../../../../assets/images/mosque_pastel_bg.jpg')} 
              style={StyleSheet.absoluteFill} 
            />
            <GlassBlur intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
              <View style={styles.heroContent}>
                <Text style={styles.heroLabel}>Last Read</Text>
                <Text style={styles.heroTitle}>{recents[0].name}</Text>
                <Text style={styles.heroSubtitle}>Ayah No: {position?.ayahNumber ?? 1}</Text>
              </View>
            </GlassBlur>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Section Title & Tabs ── */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Al Quran</Text>
        <View style={styles.tabPill}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'surahs' && styles.tabBtnActive]}
            onPress={() => setTab('surahs')}
          >
            <Text style={[styles.tabText, tab === 'surahs' && styles.tabTextActive]}>Surah</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'juz' && styles.tabBtnActive]}
            onPress={() => setTab('juz')}
          >
            <Text style={[styles.tabText, tab === 'juz' && styles.tabTextActive]}>Juz</Text>
          </TouchableOpacity>
        </View>
      </View>


      {/* ── Content ── */}
      {tab === 'surahs' ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSurahRow}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <SectionList
          sections={juzSections}
          keyExtractor={(item, index) => `juz-${item.juz}-${item.surah}-${item.ayah}-${index}`}
          renderSectionHeader={renderJuzHeader}
          renderItem={renderJuzEntry}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={true}
          initialNumToRender={20}
        />
      )}
    </SafeAreaView>

      <ReaderSettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        colors={colors}
        onMushafEnabled={() => {
          requestSurah(1);
          router.push('/(tabs)/reader');
        }}
      />
    </AppBackground>
  );
}

const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    navIconBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Fonts.display,
      fontSize: 20,
      letterSpacing: 0.5,
    },
    heroCardWrap: {
      marginHorizontal: 20,
      marginBottom: 24,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    heroGradient: {
      borderRadius: 24,
      overflow: 'hidden',
    },
    heroContent: {
      padding: 24,
      minHeight: 140,
      justifyContent: 'center',
    },
    heroLabel: {
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: 8,
    },
    heroTitle: {
      fontFamily: Fonts.display,
      fontSize: 28,
      color: '#ffffff',
      marginBottom: 4,
    },
    heroSubtitle: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    pageTitle: {
      fontFamily: Fonts.display,
      fontSize: 24,
    },
    tabPill: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 30,
      padding: 4,
    },
    tabBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    tabBtnActive: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontFamily: Fonts.sansMedium,
      fontSize: 13,
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: '#fff',
      fontFamily: Fonts.sansSemiBold,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      marginBottom: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      padding: 0,
    },
    recentsBox: {
      marginHorizontal: 20,
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    recentsLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
    },
    recentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    recentName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    recentSub: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 1,
    },
    pageNum: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textTertiary,
      minWidth: 28,
      textAlign: 'right',
    },
    // Surah rows
    surahRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(0,0,0,0.05)',
      gap: 16,
    },
    surahRowActive: {
      backgroundColor: colors.primaryLight,
    },
    surahNumBadge: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    surahNumBadgeActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    surahNum: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 14,
      color: colors.text,
    },
    surahNumActive: {
      color: '#fff',
    },
    surahName: {
      fontFamily: Fonts.display,
      fontSize: 17,
      color: colors.text,
      marginBottom: 2,
    },
    surahNameActive: {
      color: colors.primary,
    },
    surahMeta: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      color: colors.textTertiary,
    },
    surahArabic: {
      fontSize: 22,
      color: colors.primary,
      fontFamily: 'AmiriQuran',
      textAlign: 'right',
    },
    surahArabicSmall: {
      fontSize: 15,
      color: colors.textSecondary,
      fontFamily: 'AmiriQuran',
    },
    // Juz' section header (sticky)
    juzSectionHeader: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: colors.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    juzSectionTitle: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 13,
      color: colors.textTertiary,
      letterSpacing: 0.3,
    },
    // Juz' flat entry row
    juzEntry: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 12,
    },
    hizbLabel: {
      fontFamily: Fonts.sans,
      fontSize: 11,
      color: colors.textTertiary,
      letterSpacing: 0.2,
    },
    juzSurahName: {
      fontFamily: Fonts.display,
      fontSize: 16,
      color: colors.text,
    },
    juzSurahArabic: {
      fontFamily: 'AmiriQuran',
      fontSize: 14,
      color: colors.textSecondary,
    },
    juzAyahRef: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      color: colors.textTertiary,
    },
    juzAyahPreview: {
      fontFamily: 'AmiriQuran',
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    juzPageNum: {
      fontFamily: Fonts.mono,
      fontSize: 14,
      color: colors.textTertiary,
      minWidth: 28,
      textAlign: 'right',
    },
  });
