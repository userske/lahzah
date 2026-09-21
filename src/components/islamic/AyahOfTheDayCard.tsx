import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, LayoutAnimation, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAppTheme } from '../../hooks/useAppTheme';
import { requestSurah } from '../../state/readerState';
import { FolioFonts, FolioColors, label, Rule, Step } from '../../constants/folio';
import { Heart } from 'lucide-react-native';
import { useSavedItems } from '../../hooks/useSavedItems';
import { DoubleTapHeart } from '../ui/DoubleTapHeart';

interface AyahData {
  surahName: string;
  surahNumber: number;
  ayahNumberInSurah: number;
  arabicText: string;
  translationText: string;
}

export const AyahOfTheDayCard = () => {
  const { colors, isDark } = useAppTheme();
  const [data, setData] = useState<AyahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toggleAyahSave, isAyahSaved } = useSavedItems();

  useEffect(() => {
    const getDayOfYear = () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    const fetchAyah = async () => {
      try {
        const randomAyahNum = (getDayOfYear() * 37) % 6236 + 1;
        const res = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahNum}/editions/quran-uthmani,en.asad`);
        const json = await res.json();
        if (json.code === 200 && json.data.length >= 2) {
          const arabic = json.data[0];
          const english = json.data[1];
          setData({
            surahName: arabic.surah.englishName,
            surahNumber: arabic.surah.number,
            ayahNumberInSurah: arabic.numberInSurah,
            arabicText: arabic.text,
            translationText: english.text,
          });
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchAyah();
  }, []);

  if (loading) {
    return (
      <View style={[styles.cardContainer, styles.loadingCard]}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  if (!data) return null;

  const saved = isAyahSaved(data.surahNumber, data.ayahNumberInSurah);

  const handleDoubleTap = () => {
    if (!saved) {
      toggleAyahSave({
        surahName: data.surahName,
        surahNumber: data.surahNumber,
        ayahNumberInSurah: data.ayahNumberInSurah,
        arabicText: data.arabicText,
        translationText: data.translationText,
      });
    }
  };

  const handleSingleTap = () => {
    requestSurah(data.surahNumber, data.ayahNumberInSurah);
    router.push('/(tabs)/reader');
  };

  return (
    <DoubleTapHeart onDoubleTap={handleDoubleTap} onSingleTap={handleSingleTap}>
      <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <View style={styles.cardContent}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={[label, { color: colors.textSecondary }]}>Ayah of the Day</Text>
              <TouchableOpacity 
                onPress={() => toggleAyahSave({
                  surahName: data.surahName,
                  surahNumber: data.surahNumber,
                  ayahNumberInSurah: data.ayahNumberInSurah,
                  arabicText: data.arabicText,
                  translationText: data.translationText,
                })}
                style={{ padding: 4 }}
              >
                <Heart size={18} color={saved ? '#ec4899' : 'rgba(255,255,255,0.8)'} fill={saved ? '#ec4899' : 'transparent'} />
              </TouchableOpacity>
            </View>

            {/* ── Arabic text ── */}
            <Text 
              style={[styles.arabic, { color: colors.text }]} 
              numberOfLines={isExpanded ? undefined : 3}
            >
              {data.arabicText}
            </Text>

            {/* ── Translation ── */}
            <Text 
              style={[styles.translation, { color: colors.textSecondary }]}
              numberOfLines={isExpanded ? undefined : 3}
            >
              {data.translationText}
            </Text>

            <TouchableOpacity 
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsExpanded(!isExpanded);
              }}
              style={{ marginBottom: 16 }}
            >
              <Text style={{ color: '#D4B896', fontFamily: FolioFonts.body, fontSize: 14 }}>
                {isExpanded ? "Show Less" : "Read More"}
              </Text>
            </TouchableOpacity>

            {/* ── Footer ── */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <Text style={[styles.sourceText, { color: colors.textTertiary }]}>
                {data.surahName} · Ayah {data.ayahNumberInSurah}
              </Text>
            </View>
          </View>
        </View>
    </DoubleTapHeart>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: Step.margin,
    marginBottom: 14,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 180,
  },
  imageBg: {
    width: '100%',
  },
  imageStyle: {
    borderRadius: 24,
  },
  cardContent: {
    padding: Step.band,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Step.band,
  },
  arabic: {
    fontFamily: FolioFonts.quran,
    fontSize: 26,
    lineHeight: 46,
    textAlign: 'right',
    marginBottom: Step.band,
    writingDirection: 'rtl',
  },
  translation: {
    fontFamily: FolioFonts.body,
    fontSize: 16,
    lineHeight: 26,
    marginBottom: Step.bandGap,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Step.base,
    borderTopWidth: Rule,
  },
  sourceText: {
    fontFamily: FolioFonts.plateItalic,
    fontSize: 14,
  },
});

