import * as Haptics from 'expo-haptics';
import { Bookmark, BookOpen, Heart, PlayCircle, X } from 'lucide-react-native';
import ligatures from '../../../assets/fonts/qcf_surah_mapping.json';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { fetchVersesByPage } from '../../services/quranApi';
import { getMushafPageLayout, MushafPageLayout } from '../../services/quranDatabase';
import {
  getPageHeaderInfo,
  getSajdaForVerse,
  isRukuStart,
} from '../../services/quranMetadata';

interface Word {
  id: number;
  position: number;
  text: string;
  text_uthmani?: string;
  text_uthmani_tajweed?: string;
  char_type_name?: string;
  line_number: number;
  verse_key?: string; // injected by flatMap
}

interface Verse {
  id: number;
  verse_key: string;
  verse_number: number;
  text_uthmani: string;
  text_uthmani_tajweed?: string;
  juz_number: number;
  words?: Word[];
}

interface PageData {
  pageNumber: number;
  verses: Verse[];
  layout: MushafPageLayout[];
  loading: boolean;
}

const toArabicNumeral = (n: number) => {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);
};

interface MushafViewProps {
  initialPage: number;
  onClose: () => void;
  chapters?: any[];
  onChapterChange?: (chapterId: number) => void;
  onPlayAyah?: (verseKey: string) => void;
  onOpenTafsir?: (verseKey: string, arabic: string, translation: string) => void;
  onMarkDifficult?: (verseKey: string, surahName?: string, ayahText?: string) => void;
  onSaveProgress?: (verseKey: string) => void;
  onPageChange?: (pageNum: number, firstVerseKey: string | null) => void;
  onToggleImmersive?: () => void;
  activeVerseKey?: string | null;
  isHifzMode?: boolean;
  hifzMistakes?: Set<string>;
  unblurredVerses?: Set<string>;
  onUnblurVerse?: (verseKey: string) => void;
  onMarkMemorized?: (verseKey: string) => void;
  showTajweed?: boolean;
}

const WINDOW_SIZE = 2; // pages to keep in each direction

// Regex to match divine names (Allah, Ar-Rahman, Rabb) with any diacritics
const DIVINE_REGEX = /(ا[\u064B-\u065F\u0670]*ل[\u064B-\u065F\u0670]*ل[\u064B-\u065F\u0670]*ه[\u064B-\u065F\u0670]*|ا[\u064B-\u065F\u0670]*ل[\u064B-\u065F\u0670]*ر[\u064B-\u065F\u0670]*ح[\u064B-\u065F\u0670]*م[\u064B-\u065F\u0670]*ٰ?[\u064B-\u065F\u0670]*ن[\u064B-\u065F\u0670]*|^ر[\u064B-\u065F\u0670]*ب[\u064B-\u065F\u0670]*$)/g;

function renderWordText(text: string | undefined, isAyahBlurred: boolean) {
  if (!text) return null;
  const parts = text.split(DIVINE_REGEX);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    // In JS split with capture groups, odd indices are the matched regex captures
    if (i % 2 === 1) {
      return (
        <Text key={i} style={{ color: isAyahBlurred ? 'transparent' : '#D9383A' }}>
          {part}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

const TAJWEED_COLORS: Record<string, string> = {
  ham_wasl: '#AAAAAA',
  laam_shamsiyah: '#AAAAAA',
  madda_normal: '#537DEF',
  madda_permissible: '#4050FF',
  madda_necessary: '#000EAA',
  madda_obligatory: '#2144C1',
  qalaqah: '#DD0008',
  ikhafa: '#9400A8',
  idgham_shafawi: '#58B800',
  iqlab: '#26BFFD',
  idgham_with_ghunnah: '#169200',
  idgham_without_ghunnah: '#169200',
  ghunnah: '#FF7E1E',
};

function renderTajweedWord(tajweedHtml: string, isAyahBlurred: boolean, defaultColor: string) {
  if (!tajweedHtml) return null;
  
  const elements: React.ReactNode[] = [];
  let currentText = "";
  const colorStack: string[] = [];
  
  let i = 0;
  let key = 0;
  
  const pushText = () => {
    if (currentText) {
      const ruleClass = colorStack[colorStack.length - 1];
      const color = ruleClass ? (TAJWEED_COLORS[ruleClass] || defaultColor) : defaultColor;
      elements.push(
        <Text key={key++} style={{ color: isAyahBlurred ? 'transparent' : color }}>
          {currentText}
        </Text>
      );
      currentText = "";
    }
  }
  
  while (i < tajweedHtml.length) {
    if (tajweedHtml[i] === '<') {
      pushText();
      const endIdx = tajweedHtml.indexOf('>', i);
      if (endIdx === -1) break;
      const tag = tajweedHtml.substring(i + 1, endIdx);
      i = endIdx + 1;
      
      if (tag.startsWith('/')) {
        colorStack.pop();
      } else {
        const match = tag.match(/class="?([^">]+)"?/);
        if (match) {
          colorStack.push(match[1]);
        } else {
          colorStack.push(''); // placeholder for nameless tags
        }
      }
    } else {
      currentText += tajweedHtml[i];
      i++;
    }
  }
  pushText();
  
  return elements;
}

export default function MushafView({
  initialPage,
  onClose,
  chapters,
  onChapterChange,
  onPlayAyah,
  onOpenTafsir,
  onMarkDifficult,
  onSaveProgress,
  onPageChange,
  onToggleImmersive,
  activeVerseKey,
  isHifzMode = false,
  hifzMistakes = new Set(),
  unblurredVerses = new Set(),
  onUnblurVerse,
  onMarkMemorized,
  showTajweed = false,
}: MushafViewProps) {
  const { colors, isDark } = useAppTheme();
  const { width: W, height: SCREEN_H } = useWindowDimensions();

  // ── Fixed page geometry (pages 3–604 only) ──────────────────────────────────
  // Reserve: top header ~68px, page number 30px, padding 24px, plus 60px extra
  // to reduce the overall line height a bit vs the full screen.
  const PAGE_CHROME_H = 68 + 30 + 24 + 60;
  const PAGE_BODY_H   = SCREEN_H - PAGE_CHROME_H;
  const LINE_SLOT_H   = PAGE_BODY_H / 15; // exact height each line must occupy
  const FONT_SIZE     = Math.min(Math.round(LINE_SLOT_H * 0.52), 23); // ~52% of slot
  const LINE_HEIGHT   = LINE_SLOT_H;      // word lineHeight fills the slot
  const [isFavorite, setIsFavorite] = useState(false);

  // Cache of page data keyed by page number
  const pageCache = useRef<Map<number, PageData>>(new Map());
  const flatListRef = useRef<FlatList>(null);
  const currentPageRef = useRef(initialPage);
  const onChapterChangeRef = useRef(onChapterChange);

  // The full range of 604 pages in the Quran
  const ALL_PAGES = useRef(Array.from({ length: 604 }, (_, i) => i + 1)).current;

  const [pageDataMap, setPageDataMap] = useState<Map<number, PageData>>(new Map());
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);

  const bgColor = isDark ? '#000000' : colors.background;

  useEffect(() => {
    onChapterChangeRef.current = onChapterChange;
  }, [onChapterChange]);

  // Fetch a single page and update state
  const fetchPage = useCallback(async (pageNum: number) => {
    if (pageNum < 1 || pageNum > 604) return;
    if (pageCache.current.has(pageNum)) return;

    // Mark as loading immediately
    const loadingEntry: PageData = { pageNumber: pageNum, verses: [], layout: [], loading: true };
    pageCache.current.set(pageNum, loadingEntry);

    try {
      const res = await fetchVersesByPage(pageNum);
      const layout = await getMushafPageLayout(pageNum);
      const verses: Verse[] = res?.verses || [];
      const entry: PageData = { pageNumber: pageNum, verses, layout, loading: false };
      pageCache.current.set(pageNum, entry);

      setPageDataMap(prev => {
        const next = new Map(prev);
        next.set(pageNum, entry);
        return next;
      });
    } catch (err) {
      pageCache.current.delete(pageNum); // allow retry
    }
  }, []);


  // Build the window to fetch data for
  const buildWindowAround = useCallback((page: number) => {
    const pages: number[] = [];
    for (let p = Math.max(1, page - WINDOW_SIZE); p <= Math.min(604, page + WINDOW_SIZE); p++) {
      pages.push(p);
    }
    return pages;
  }, []);

  // Initialize
  useEffect(() => {
    pageCache.current.clear();
    currentPageRef.current = initialPage;
    const window = buildWindowAround(initialPage);
    setPageDataMap(new Map());
    window.forEach(p => fetchPage(p));
  }, [initialPage, buildWindowAround, fetchPage]);

  // Jump to specific page dynamically if initialPage changes
  useEffect(() => {
    if (initialPage >= 1 && initialPage <= 604 && flatListRef.current) {
      if (initialPage !== currentPageRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: initialPage - 1, animated: false });
        }, 50);
      }
    }
  }, [initialPage]);

  const onPageChangeRef = useRef(onPageChange);
  useEffect(() => { onPageChangeRef.current = onPageChange; }, [onPageChange]);

  const onMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const rawIndex = Math.round(e.nativeEvent.contentOffset.x / W);
    const pageIndex = rawIndex;
    const pageNum = ALL_PAGES[pageIndex] ?? currentPageRef.current;

    if (pageNum === currentPageRef.current) return;
    currentPageRef.current = pageNum;

    // Notify parent of chapter change + page change
    const pageData = pageCache.current.get(pageNum);
    let firstVerseKey: string | null = null;
    if (pageData && pageData.verses.length > 0) {
      firstVerseKey = pageData.verses[0].verse_key;
      if (firstVerseKey) {
        const chapterId = parseInt(firstVerseKey.split(':')[0], 10);
        if (chapterId && onChapterChangeRef.current) {
          onChapterChangeRef.current(chapterId);
        }
      }
    }
    onPageChangeRef.current?.(pageNum, firstVerseKey);

    // Fetch any missing pages in the new window
    const newWindow = buildWindowAround(pageNum);
    newWindow.forEach(p => fetchPage(p));
  }, [ALL_PAGES, W, buildWindowAround, fetchPage]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: W,
    offset: W * index,
    index,
  }), [W]);

  const renderPage = useCallback(({ item: pageNum }: { item: number }) => {
    const data = pageDataMap.get(pageNum) ?? pageCache.current.get(pageNum);

    if (!data || data.loading) {
      return (
        <View style={[styles.pageContainer, { backgroundColor: bgColor, width: W }]}>
          <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
        </View>
      );
    }

    if (data.verses.length === 0 || data.layout.length === 0) {
      return (
        <View style={[styles.pageContainer, { backgroundColor: bgColor, width: W, justifyContent: 'center', alignItems: 'center', gap: 12 }]}>
          <Text style={{ fontFamily: 'AmiriQuran', fontSize: 28, color: colors.text, opacity: 0.3 }}>لَحظَة</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 }}>
            Quran data is still loading.{'\n'}Please wait a moment.
          </Text>
        </View>
      );
    }

    const firstVerse = data.verses[0];
    const isNewSurah = firstVerse && firstVerse.verse_number === 1;
    const showBismillah =
      isNewSurah &&
      !firstVerse.verse_key.startsWith('9:') &&
      !firstVerse.verse_key.startsWith('1:');

    // Use offline metadata for accurate header info (surah + juz)
    const verseKeys = data.verses.map(v => v.verse_key);
    const headerInfo = firstVerse ? getPageHeaderInfo(verseKeys) : null;

    // Group API words by line_number for rendering
    const allWords = data.verses.flatMap((v) =>
      (v.words || []).map(w => ({ ...w, verse_key: v.verse_key }))
    );
    const apiLinesMap = new Map<number, typeof allWords>();

    allWords.forEach((w) => {
      if (!apiLinesMap.has(w.line_number)) apiLinesMap.set(w.line_number, []);
      apiLinesMap.get(w.line_number)!.push(w);
    });

    return (
      <View style={[styles.pageContainer, { backgroundColor: bgColor, width: W }]}>
        <TouchableWithoutFeedback onPress={onToggleImmersive}>
          <ScrollView 
            maximumZoomScale={3} 
            minimumZoomScale={1} 
            bouncesZoom={true} 
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start' }}
          >
            {/* Top Page Header — powered by offline QUL metadata */}
            {headerInfo && (
              <View style={styles.pageHeader}>
                <Text style={[styles.pageHeaderLeft, { color: isDark ? '#FFFFFF' : colors.text }]}>
                  Juz' {headerInfo.juzNumber}
                </Text>
                <View style={styles.pageHeaderRight}>
                  <Text style={[styles.pageHeaderSurahLatin, { color: isDark ? '#FFFFFF' : colors.text }]}>
                    {headerInfo.surahName}
                  </Text>
                  <Text style={[styles.pageHeaderSurahArabic, { color: isDark ? '#FFFFFF' : colors.text }]}>
                    {headerInfo.surahArabic}
                  </Text>
                </View>
              </View>
            )}

            <View style={[
          styles.pageContent,
          (pageNum === 1 || pageNum === 2) && { paddingHorizontal: W * 0.12 }
        ]}>
          <View style={[
            styles.linesContainer,
            (pageNum === 1 || pageNum === 2)
              ? { justifyContent: 'flex-start' }
              : {
                height: PAGE_BODY_H,
                paddingHorizontal: 10,
                justifyContent: 'space-between',
              }
          ]}>

            {data.layout.map((line, lineIdx) => {
              if (line.line_type === 'surah_name') {
                // Pages 1 & 2 have W * 0.12 paddingHorizontal on pageContent
                // Other pages have 12 paddingHorizontal on pageContent and 10 on linesContainer (total 22)
                const isFirstPages = pageNum === 1 || pageNum === 2;
                const containerPadding = isFirstPages ? (W * 0.12 * 2) : 44;
                const headerWidth = W - containerPadding;
                const headerFontSize = headerWidth / 3.3;

                return (
                  <View
                    key={`surah-${line.surah_number}-${lineIdx}`}
                    style={styles.surahHeaderBg}
                  >
                    <Text 
                      style={[
                        styles.surahHeaderText,
                        { 
                          fontSize: headerFontSize,
                          lineHeight: headerFontSize,
                          marginTop: -headerFontSize * 0.3,
                          marginBottom: -headerFontSize * 0.3,
                          color: isDark ? '#FFFFFF' : colors.text,
                        }
                      ]}
                    >
                      {line.surah_number ? ligatures[`surah-${line.surah_number}` as keyof typeof ligatures] : ''}
                    </Text>
                  </View>
                );
              }

              if (line.line_type === 'basmallah') {
                return <Text key={`bismillah-${lineIdx}`} style={[styles.bismillah, { color: colors.text }]}>﷽</Text>;
              }

              if (line.line_type === 'ayah') {
                const isCentered = Boolean(line.is_centered);
                const lineWords = apiLinesMap.get(line.line_number) || [];

                // Check first word's verse for ruku/sajda markers
                const firstWordKey = lineWords[0]?.verse_key;
                const showRukuMarker = firstWordKey ? isRukuStart(firstWordKey) : false;
                const sajdaInfo     = firstWordKey ? getSajdaForVerse(firstWordKey) : null;

                return (
                  // Pages 1 & 2: natural height. Pages 3+: fixed slot for uniform spacing.
                  <View key={`line-wrapper-${line.line_number}`} style={(pageNum === 1 || pageNum === 2) ? {} : { height: LINE_SLOT_H, justifyContent: 'center' }}>
                    {/* Ruku / Sajda markers — absolutely positioned so they don't push content */}
                    {(showRukuMarker || sajdaInfo) && (
                      <View style={[styles.verseMarkerRow, { position: 'absolute', top: 0, right: 0, left: 0, zIndex: 1 }]}>
                        {showRukuMarker && (
                          <Text style={[styles.rukuMarker, { color: colors.textTertiary }]}>ع</Text>
                        )}
                        {sajdaInfo && (
                          <Text style={[styles.sajdaMarker, { color: sajdaInfo.sajdah_type === 'required' ? '#D9383A' : '#F59E0B' }]}>
                            ۩{sajdaInfo.sajdah_type === 'required' ? ' واجب' : ''}
                          </Text>
                        )}
                      </View>
                    )}
                    <View
                      style={[
                        styles.mushafLine,
                        isCentered ? { justifyContent: 'center', gap: 6 } : { justifyContent: 'space-between' }
                      ]}
                    >
                      {lineWords.map((w, idx) => {
                        const isSelected = w.verse_key === selectedVerseKey || w.verse_key === activeVerseKey;
                        const isMistake = w.verse_key ? hifzMistakes.has(w.verse_key) : false;
                        const isAyahBlurred = isHifzMode && (!w.verse_key || !unblurredVerses.has(w.verse_key));
                        const isEnd = w.char_type_name === 'end';
                        const dynamicAyahSize = Math.round(FONT_SIZE * 1.15);

                        const wordBgColor = isSelected
                          ? (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)')
                          : isMistake
                            ? (colors.primary + '15')
                            : 'transparent';

                        return (
                          <Text
                            key={`${w.id}-${idx}`}
                            numberOfLines={1}
                            onPress={() => {
                              if (isAyahBlurred && onUnblurVerse && w.verse_key) {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                onUnblurVerse(w.verse_key);
                              } else if (w.verse_key) {
                                setSelectedVerseKey(isSelected ? null : w.verse_key);
                              }
                            }}
                            style={[
                              styles.mushafWord,
                              {
                                color: isAyahBlurred ? 'transparent' : colors.text,
                                fontSize: FONT_SIZE,
                                lineHeight: LINE_HEIGHT,
                                backgroundColor: wordBgColor,
                                textShadowColor: isAyahBlurred ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') : undefined,
                                textShadowRadius: isAyahBlurred ? 12 : undefined,
                              }
                            ]}
                          >
                            {isEnd ? (
                              <Text style={[styles.ayahNumber, {
                                color: isAyahBlurred ? 'transparent' : colors.primary,
                                fontSize: dynamicAyahSize,
                                textShadowColor: isAyahBlurred ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') : undefined,
                                textShadowRadius: isAyahBlurred ? 12 : undefined,
                              }]}>
                                ۝{w.text_uthmani ? w.text_uthmani : toArabicNumeral(parseInt(w.text, 10))}
                              </Text>
                            ) : showTajweed && w.text_uthmani_tajweed ? (
                              renderTajweedWord(w.text_uthmani_tajweed, isAyahBlurred, colors.text)
                            ) : (
                              renderWordText(w.text_uthmani || w.text, isAyahBlurred)
                            )}
                          </Text>
                        );
                      })}
                    </View>
                  </View>
                );
              }
            })}
          </View>
          <Text style={[styles.pageNumber, { color: colors.textTertiary }]}>
            {pageNum}
          </Text>
          </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </View>
    );
  }, [pageDataMap, bgColor, W, colors, chapters]);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <FlatList
        ref={flatListRef}
        data={ALL_PAGES}
        keyExtractor={(item) => item.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        inverted={true}
        initialScrollIndex={initialPage - 1}
        renderItem={renderPage}
        getItemLayout={getItemLayout}
        initialNumToRender={1}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={true}
        onMomentumScrollEnd={onMomentumScrollEnd}
        decelerationRate="fast"
      />

      {/* Floating Action Bar for Selected Ayah */}
      {selectedVerseKey && (
        <View style={[styles.actionBar, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.selectionAsync();
              onPlayAyah?.(selectedVerseKey);
              setSelectedVerseKey(null);
            }}
          >
            <PlayCircle size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Play</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.selectionAsync();
              // We need the arabic text and translation. For Mushaf, we might just pass the key.
              onOpenTafsir?.(selectedVerseKey, 'Ayah ' + selectedVerseKey, 'View Tafsir');
              setSelectedVerseKey(null);
            }}
          >
            <BookOpen size={24} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>Tafsir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.selectionAsync();
              
              let surahName;
              let ayahText;
              
              if (selectedVerseKey) {
                const chapterId = parseInt(selectedVerseKey.split(':')[0], 10);
                surahName = chapters?.find(c => c.id === chapterId)?.name_simple;
                
                // Find the full verse text in the pageDataMap or pageCache
                const pageNum = currentPageRef.current;
                const data = pageDataMap.get(pageNum) ?? pageCache.current.get(pageNum);
                if (data) {
                  const verse = data.verses.find(v => v.verse_key === selectedVerseKey);
                  if (verse) {
                    ayahText = verse.text_uthmani;
                  }
                }
              }

              onMarkDifficult?.(selectedVerseKey, surahName, ayahText);
              if (onSaveProgress) {
                onSaveProgress(selectedVerseKey);
              }
              setSelectedVerseKey(null);
            }}
          >
            <Bookmark size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setIsFavorite(!isFavorite);
            }}
          >
            <Heart size={24} color={isFavorite ? '#EF4444' : colors.textTertiary} />
            <Text style={[styles.actionText, { color: isFavorite ? '#EF4444' : colors.textTertiary }]}>Heart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedVerseKey(null);
            }}
          >
            <X size={24} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  pageContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 40,
    maxWidth: 1116,
  },
  // ── Page header (Juz' left | Surah right) ──
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 4,
    width: '100%',
  },
  pageHeaderLeft: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  pageHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageHeaderSurahLatin: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  pageHeaderSurahArabic: {
    fontSize: 16,
    fontFamily: 'AmiriQuran',
  },
  // ── Surah name header inside page ──
  surahHeaderBg: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    width: '100%',
  },
  surahHeaderText: {
    fontFamily: 'SurahHeader',
    width: '100%',
    textAlign: 'center',
    marginBottom: 4,
  },
  surahHeaderSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.5,
  },
  // ── Ruku / Sajda markers ──
  verseMarkerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 4,
    gap: 4,
    height: 14,
  },
  rukuMarker: {
    fontSize: 10,
    fontFamily: 'AmiriQuran',
    opacity: 0.55,
  },
  sajdaMarker: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
  },
  bismillah: {
    fontFamily: 'AmiriQuran',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 52,
  },
  linesContainer: {
    width: '100%',
    // Height and justifyContent are set inline from computed PAGE_BODY_H / LINE_SLOT_H
  },
  mushafLine: {
    flexDirection: 'row-reverse',
    width: '100%',
    alignItems: 'center',
    marginBottom: 0, // Keep zero to allow tight 15-line packing
  },
  mushafWord: {
    fontFamily: 'AmiriQuran',
    marginHorizontal: -3, // Pull words closer together to reduce spacing and fit the 24px font size
    fontSize: 23, // Tuned for horizontal width
    lineHeight: 40, // Tuned for 15-line vertical packing
  },
  pageNumber: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textAlign: 'center',
    paddingTop: 6,
  },
  ayahNumber: {
    fontFamily: 'AmiriQuran',
    fontSize: 14,
  },
  actionBar: {
    position: 'absolute',
    bottom: 80, // Sits exactly above the audio player
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
});
