import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bookmark } from 'lucide-react-native';
import { router } from 'expo-router';
import { AppBackground } from '../../../components/ui/AppBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Fonts } from '../../../constants/theme';
import { useHadithState } from '../../../hooks/useHadithState';

export default function SavedHadithsScreen() {
  const { colors, isDark } = useAppTheme();
  const { savedHadiths, toggleSave, isHadithSaved } = useHadithState();

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
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              Saved Hadiths
            </Text>
            <Text style={[styles.headerSub, { color: colors.textTertiary }]}>
              {savedHadiths.length} saved
            </Text>
          </View>
        </View>

        {savedHadiths.length === 0 ? (
          <View style={styles.emptyState}>
            <Bookmark size={48} color={colors.textTertiary} style={{ opacity: 0.5, marginBottom: 16 }} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No saved hadiths yet</Text>
            <Text style={[styles.emptySub, { color: colors.textTertiary }]}>
              Tap the bookmark icon on any hadith to save it here for later reading.
            </Text>
          </View>
        ) : (
          <FlatList
            data={savedHadiths}
            keyExtractor={(item, index) => `${item.id ?? item.hadithnumber}-${item.collection}-${index}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <GlassCard style={[styles.card, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.numberBadge, { backgroundColor: colors.divider }]}>
                      <Text style={[styles.numberText, { color: colors.textSecondary }]}>
                        {item.collection} · Hadith {item.hadithnumber}
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
  headerTitle: { 
    fontFamily: Fonts.display, fontSize: 18, letterSpacing: -0.2 
  },
  headerSub: { 
    fontFamily: Fonts.sans, fontSize: 12, marginTop: 2 
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
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
    textTransform: 'capitalize',
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
