import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Share as ShareIcon, Volume2 } from 'lucide-react-native';
import { AppBackground } from '../../../components/ui/AppBackground';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { FolioFonts, FolioColors, Rule } from '../../../constants/folio';
import { fetchDuas, type Dua } from '../../../services/ummahApi';

const formatCategory = (cat: string) => {
  if (!cat) return '';
  return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function DuaChapterScreen() {
  const { chapter } = useLocalSearchParams();
  const { isDark } = useAppTheme();
  const plate = isDark ? FolioColors.night : FolioColors.day;

  const [duas, setDuas] = useState<Dua[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchDuas(chapter as string);
      setDuas(data || []);
      setLoading(false);
    }
    load();
  }, [chapter]);

  const handleShare = async (dua: Dua) => {
    try {
      await Share.share({
        message: `${dua.arabic}\n\n${dua.transliteration}\n\n${dua.translation}\n\n- ${dua.source}`,
      });
    } catch (error) {
    }
  };

  if (!loading && duas.length === 0) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/duas')} style={styles.backBtn}>
              <ArrowLeft size={22} color={plate.ink} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: plate.ink }]}>Not Found</Text>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/duas')} style={styles.backBtn}>
            <ArrowLeft size={22} color={plate.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginRight: 40 }}>
            <Text style={[styles.headerTitle, { color: plate.ink }]} numberOfLines={2}>
              {formatCategory(chapter as string)}
            </Text>
            <Text style={[styles.headerSub, { color: plate.graphite }]}>
              {loading ? 'Loading...' : `${duas.length} ${duas.length === 1 ? 'Dua' : 'Duas'}`}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {duas.map((dua: Dua, index: number) => (
            <View key={dua.id} style={[styles.duaCard, { backgroundColor: plate.ground, borderColor: plate.rule }]}>
              {/* Card Header */}
              <View style={[styles.cardHeader, { borderBottomColor: plate.rule }]}>
                <View style={[styles.numberBadge, { backgroundColor: plate.rule }]}>
                  <Text style={[styles.numberText, { color: plate.graphite }]}>{index + 1}</Text>
                </View>
                <View style={styles.actionRow}>
                  {dua.repeat && dua.repeat > 1 && (
                     <View style={[styles.repeatBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                       <Text style={[styles.repeatText, { color: plate.ink }]}>x{dua.repeat}</Text>
                     </View>
                  )}
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(dua)}>
                    <ShareIcon size={20} color={plate.graphite} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Arabic */}
              <Text style={[styles.arabicText, { color: plate.ink }]}>
                {dua.arabic}
              </Text>

              {/* Transliteration */}
              {dua.transliteration ? (
                <Text style={[styles.transliterationText, { color: plate.ink }]}>
                  {dua.transliteration}
                </Text>
              ) : null}

              {/* Divider */}
              <View style={[styles.innerDivider, { backgroundColor: plate.rule }]} />

              {/* English Translation */}
              <Text style={[styles.translationText, { color: plate.graphite }]}>
                {dua.translation}
              </Text>

            </View>
          ))}
        </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: FolioFonts.plateMedium,
    fontSize: 20,
    marginBottom: 4,
  },
  headerSub: {
    fontFamily: FolioFonts.body,
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 24,
  },
  duaCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontFamily: FolioFonts.bodyMedium,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 8,
  },
  repeatBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  repeatText: {
    fontFamily: FolioFonts.bodyMedium,
    fontSize: 12,
  },
  arabicText: {
    fontFamily: 'AmiriQuran',
    fontSize: 28,
    lineHeight: 52,
    textAlign: 'right',
    marginBottom: 20,
  },
  transliterationText: {
    fontFamily: FolioFonts.bodyMedium,
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  innerDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginBottom: 20,
  },
  translationText: {
    fontFamily: FolioFonts.plate,
    fontSize: 16,
    lineHeight: 26,
  },
});
