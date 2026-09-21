import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { AppBackground } from '../../../components/ui/AppBackground';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Fonts } from '../../../constants/theme';
import { fetchHadithByNumber } from '../../../services/ummahApi';
import type { Hadith } from '../../../services/ummahApi';
import { ArrowLeft, Bookmark } from 'lucide-react-native';
import { GlassCard } from '../../../components/ui/GlassCard';
import { FolioFonts, FolioColors, Step, Rule } from '../../../constants/folio';
import { useSavedItems } from '../../../hooks/useSavedItems';

export default function HadithDetailScreen() {
  const { collection, number } = useLocalSearchParams();
  const { colors, isDark } = useAppTheme();
  const plate = isDark ? FolioColors.night : FolioColors.day;
  const accentColor = colors.primary;

  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [loading, setLoading] = useState(true);
  const { toggleHadithSave, isHadithSaved } = useSavedItems();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchHadithByNumber(collection as string, parseInt(number as string, 10));
      setHadith(data);
      setLoading(false);
    }
    load();
  }, [collection, number]);

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
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              Hadith {number}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={accentColor} />
          </View>
        ) : hadith ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <GlassCard style={[styles.card, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.numberBadge, { backgroundColor: colors.divider }]}>
                    <Text style={[styles.numberText, { color: colors.textSecondary }]}>
                      Hadith {hadith.hadithnumber}
                    </Text>
                  </View>
                  {hadith.grade ? (
                    <View style={[styles.gradePill, { backgroundColor: gradeColor(hadith.grade) + '15' }]}>
                      <Text style={[styles.gradeText, { color: gradeColor(hadith.grade) }]}>
                        {hadith.grade}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => toggleHadithSave(hadith)} style={styles.saveBtn}>
                  <Bookmark 
                    size={20} 
                    color={isHadithSaved(hadith) ? '#ec4899' : colors.textTertiary} 
                    fill={isHadithSaved(hadith) ? '#ec4899' : 'transparent'}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.arabicText, { color: colors.text }]} selectable>
                {hadith.arabic}
              </Text>
              
              <View style={[styles.typographyDivider, { backgroundColor: colors.divider }]} />

              <Text style={[styles.englishText, { color: colors.textSecondary }]} selectable>
                {hadith.english}
              </Text>

              <View style={[styles.cardFooter, { borderTopColor: colors.divider }]}>
                <Text style={[styles.sourceText, { color: colors.textTertiary }]}>
                  {hadith.collection_name || hadith.collection}
                </Text>
              </View>
            </GlassCard>
          </ScrollView>
        ) : (
          <View style={styles.centerLoading}>
            <Text style={{ color: colors.textSecondary, fontFamily: Fonts.sansMedium }}>
              Hadith not found.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 12,
  },
  headerTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    marginLeft: 4,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  card: {
    padding: 24,
    borderRadius: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  numberBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  numberText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
  },
  gradePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gradeText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  saveBtn: {
    padding: 8,
    marginRight: -8,
    marginTop: -8,
  },
  arabicText: {
    fontFamily: FolioFonts.quran,
    fontSize: 28,
    lineHeight: 48,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: 8,
  },
  typographyDivider: {
    height: 1,
    width: 60,
    alignSelf: 'center',
    marginVertical: 16,
    opacity: 0.7,
  },
  englishText: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    lineHeight: 28,
    marginBottom: 24,
  },
  cardFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
  },
  sourceText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
  },
});
