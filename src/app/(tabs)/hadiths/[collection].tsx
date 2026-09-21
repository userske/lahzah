import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bookmark } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AppBackground } from '../../../components/ui/AppBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Fonts } from '../../../constants/theme';
import { fetchHadithsByCollection } from '../../../services/ummahApi';
import type { Hadith } from '../../../services/ummahApi';
import { useHadithState } from '../../../hooks/useHadithState';
import { COLLECTIONS } from './index';

export default function HadithReaderScreen() {
  const { collection } = useLocalSearchParams();
  const { colors, isDark } = useAppTheme();
  
  const colDetails = COLLECTIONS.find((c) => c.id === collection) ?? COLLECTIONS[0];
  const accentColor = colors.primary;

  const { toggleSave, isHadithSaved, saveReadingProgress, getReadingProgress, loading: stateLoading } = useHadithState();

  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadHadiths = useCallback(async (pageNum: number, isInitial = false) => {
    if (!hasMore && !isInitial) return;
    
    if (isInitial) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    const data = await fetchHadithsByCollection(collection as string, pageNum, 20);
    
    if (data && data.length > 0) {
      if (isInitial) {
        setHadiths(data);
      } else {
        setHadiths((prev) => [...prev, ...data]);
      }
      setPage(pageNum);
      saveReadingProgress(collection as string, pageNum);
      // If we received fewer than 20 items, we've likely hit the end
      if (data.length < 20) {
        setHasMore(false);
      }
    } else {
      setHasMore(false);
    }
    
    setLoading(false);
    setLoadingMore(false);
  }, [collection, hasMore, saveReadingProgress]);

  useEffect(() => {
    if (!stateLoading) {
      const savedPage = getReadingProgress(collection as string);
      // To resume, we fetch the page they were last on
      loadHadiths(savedPage, true);
    }
  }, [collection, stateLoading]);

  const handleEndReached = () => {
    if (!loading && !loadingMore && hasMore) {
      loadHadiths(page + 1, false);
    }
  };

  const gradeColor = (grade: string) =>
    grade?.toLowerCase().includes('sahih') ? '#10b981' : '#f59e0b';

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/hadiths')} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.iconBox, { backgroundColor: accentColor + '15' }]}>
              <colDetails.Icon size={16} color={accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {colDetails.name}
              </Text>
              <Text style={[styles.headerSub, { color: colors.textTertiary }]}>
                {colDetails.author}
              </Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={accentColor} />
          </View>
        ) : (
          <FlatList
            data={hadiths}
            keyExtractor={(item, index) => `${item.id ?? item.hadithnumber}-${index}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator style={{ marginVertical: 24 }} color={accentColor} />
              ) : (
                <View style={{ height: 120 }} />
              )
            }
            renderItem={({ item }) => (
              <GlassCard style={[styles.card, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.numberBadge, { backgroundColor: colors.divider }]}>
                      <Text style={[styles.numberText, { color: colors.textSecondary }]}>
                        Hadith {item.hadithnumber}
                      </Text>
                    </View>
                    {item.grade ? (
                      <View style={[styles.gradePill, { backgroundColor: gradeColor(item.grade) + '15' }]}>
                        <Text style={[styles.gradeText, { color: gradeColor(item.grade) }]}>
                          {item.grade}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => toggleSave(item)} style={styles.saveBtn}>
                    <Bookmark 
                      size={20} 
                      color={isHadithSaved(item) ? '#ec4899' : colors.textTertiary} 
                    />
                  </TouchableOpacity>
                </View>

                {item.arabic ? (
                  <Text style={[styles.arabicText, { color: colors.text }]}>
                    {item.arabic}
                  </Text>
                ) : null}

                {item.english ? (
                  <Text style={[styles.englishText, { color: colors.textSecondary }]}>
                    {item.english}
                  </Text>
                ) : null}
              </GlassCard>
            )}
          />
        )}
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: { 
    width: 40, height: 40, borderRadius: 20, 
    alignItems: 'center', justifyContent: 'center' 
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { 
    fontFamily: Fonts.display, fontSize: 18, letterSpacing: -0.2 
  },
  headerSub: { 
    fontFamily: Fonts.sans, fontSize: 12, marginTop: 2 
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  numberBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  numberText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
  },
  gradePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gradeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  saveBtn: {
    padding: 4,
  },
  arabicText: {
    fontFamily: Fonts.display,
    fontSize: 22,
    lineHeight: 44,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 20,
  },
  englishText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 15,
    lineHeight: 26,
  },
});
