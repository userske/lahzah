import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, ChevronLeft, ChevronRight, Frown, Search, XCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Fonts } from '../../../constants/theme';
import { AppBackground } from '../../../components/ui/AppBackground';
import { fetchSearchResults } from '../../../services/quranApi';
import { requestSurah } from '../../../state/readerState';

interface SearchResult {
  verse_key: string;
  text: string;
  translations: { text: string }[];
}

export default function QuranSearchScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string, pg = 1) => {
    if (!q.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }
    setLoading(true);
    const res = await fetchSearchResults(q.trim(), 85, pg, 20);
    if (res?.search) {
      const verses = (res.search.results ?? []) as SearchResult[];
      setResults(pg === 1 ? verses : (prev) => [...prev, ...verses]);
      setTotalResults(res.search.total_results ?? 0);
      setHasMore(pg < (res.search.total_pages ?? 1));
      setPage(pg);
    }
    setLoading(false);
  }, []);

  const onChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text, 1), 500);
  };

  const loadMore = () => {
    if (!loading && hasMore) doSearch(query, page + 1);
  };

  const goToVerse = (verseKey: string) => {
    const [surah, ayah] = verseKey.split(':').map(Number);
    requestSurah(surah, ayah);
    router.push('/(tabs)/reader');
  };

  const cleanText = (text: string) =>
    text.replace(/<[^>]+>/g, '').replace(/\[.*?\]/g, '').trim();

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.resultCard} onPress={() => goToVerse(item.verse_key)} activeOpacity={0.7}>
      <View style={styles.resultHeader}>
        <View style={styles.verseKeyBadge}>
          <Text style={styles.verseKeyText}>{item.verse_key}</Text>
        </View>
        <ChevronRight size={16} color={colors.textTertiary} />
      </View>
      {item.text ? (
        <Text style={styles.arabicText} numberOfLines={2}>{item.text}</Text>
      ) : null}
      {item.translations?.[0]?.text ? (
        <Text style={styles.translationText} numberOfLines={3}>
          {cleanText(item.translations[0].text)}
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <AppBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)/reader/browse')}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Search Quran</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { borderColor: query ? colors.primary : colors.border }]}>
            <Search size={18} color={query ? colors.primary : colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by keyword or phrase…"
              placeholderTextColor={colors.textTertiary}
              value={query}
              onChangeText={onChangeText}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => doSearch(query, 1)}
            />
            {query ? (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                <XCircle size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Results Meta */}
        {totalResults > 0 && !loading && (
          <Text style={styles.resultsMeta}>{totalResults} results for "{query}"</Text>
        )}

        {/* Empty / Prompt */}
        {!query && !loading && (
          <View style={styles.emptyState}>
            <BookOpen size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Search the Quran</Text>
            <Text style={styles.emptySubtitle}>
              Type a word or phrase in English to find verses across all 114 Surahs.
            </Text>
          </View>
        )}

        {/* No Results */}
        {query && !loading && results.length === 0 && (
          <View style={styles.emptyState}>
            <Frown size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>Try a different keyword or phrase.</Text>
          </View>
        )}

        {/* Results List */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.verse_key}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListFooterComponent={loading ? <ActivityIndicator color={colors.primary} style={{ margin: 20 }} /> : null}
          keyboardShouldPersistTaps="handled"
        />
      </SafeAreaView>
    </AppBackground>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: Fonts.sansBold,
      fontSize: 18,
      color: colors.text,
    },
    searchRow: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
      borderRadius: 16,
      borderWidth: 1.5,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
    },
    searchIcon: { marginRight: 2 },
    searchInput: {
      flex: 1,
      fontFamily: Fonts.sans,
      fontSize: 15,
      color: colors.text,
    },
    resultsMeta: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: colors.textTertiary,
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    resultCard: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    verseKeyBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: colors.primaryLight ?? colors.primary + '22',
      borderRadius: 8,
    },
    verseKeyText: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 12,
      color: colors.primary,
    },
    arabicText: {
      fontFamily: 'AmiriQuran',
      fontSize: 20,
      lineHeight: 38,
      textAlign: 'right',
      writingDirection: 'rtl',
      color: colors.text,
      marginBottom: 8,
    },
    translationText: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingBottom: 80,
      gap: 12,
    },
    emptyTitle: {
      fontFamily: Fonts.sansBold,
      fontSize: 20,
      color: colors.text,
      marginTop: 8,
    },
    emptySubtitle: {
      fontFamily: Fonts.sans,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
