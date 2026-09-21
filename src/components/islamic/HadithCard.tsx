import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, UIManager, TouchableOpacity, LayoutAnimation, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Hadith } from '../../services/ummahApi';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FolioFonts, FolioColors, label, Rule, Step } from '../../constants/folio';
import { Heart } from 'lucide-react-native';
import { useSavedItems } from '../../hooks/useSavedItems';
import { DoubleTapHeart } from '../ui/DoubleTapHeart';
import { router } from 'expo-router';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface HadithCardProps {
  hadith: Hadith | null;
}

export const HadithCard = ({ hadith }: HadithCardProps) => {
  const { colors, isDark } = useAppTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const { toggleHadithSave, isHadithSaved } = useSavedItems();

  if (!hadith) return null;

  const saved = isHadithSaved(hadith);

  const handleDoubleTap = () => {
    if (!saved) toggleHadithSave(hadith);
  };

  const handleSingleTap = () => {
    router.push(`/hadiths/detail?collection=${hadith.collection}&number=${hadith.hadithnumber}`);
  };

  return (
    <DoubleTapHeart onDoubleTap={handleDoubleTap} onSingleTap={handleSingleTap}>
      <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <View style={styles.cardContent}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={[label, { color: colors.textSecondary }]}>Hadith of the Day</Text>
              <TouchableOpacity 
                onPress={() => toggleHadithSave(hadith)}
                style={{ padding: 4 }}
              >
                <Heart size={18} color={saved ? '#ec4899' : colors.textSecondary} fill={saved ? '#ec4899' : 'transparent'} />
              </TouchableOpacity>
            </View>

            {/* ── Arabic text ── */}
            <Text 
              style={[styles.arabic, { color: colors.text }]}
              numberOfLines={isExpanded ? undefined : 3}
            >
              {hadith.arabic}
            </Text>

            {/* ── Translation ── */}
            <Text 
              style={[styles.translation, { color: colors.textSecondary }]}
              numberOfLines={isExpanded ? undefined : 3}
            >
              {hadith.english}
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
                {hadith.collection_name} · #{hadith.hadithnumber}
              </Text>

              {hadith.grade ? (
                <View style={styles.gradeContainer}>
                  <Text 
                    style={[
                      styles.gradeText, 
                      { color: hadith.grade.toLowerCase().includes('sahih') ? '#D4B896' : colors.textTertiary }
                    ]}
                  >
                    {hadith.grade}
                  </Text>
                </View>
              ) : null}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Step.base,
    borderTopWidth: Rule,
  },
  sourceText: {
    fontFamily: FolioFonts.plateItalic,
    fontSize: 14,
  },
  gradeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  gradeText: {
    fontFamily: FolioFonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

