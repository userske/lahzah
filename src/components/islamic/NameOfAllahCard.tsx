import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { NAMES_OF_ALLAH } from '../../data/names';
import type { NameOfAllah } from '../../data/names';
import { FolioFonts, Step } from '../../constants/folio';
import { useAppTheme } from '../../hooks/useAppTheme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;

// Warm earthy tones
const ACCENT = '#7C5C3A';
const DARK   = '#2D1F0F';

interface NameOfAllahCardProps {
  nameData?: NameOfAllah | null;
  allNames?: NameOfAllah[] | null;
}

export const NameOfAllahCard = ({
  nameData,
  allNames,
}: NameOfAllahCardProps) => {
  const { isDark, colors } = useAppTheme();
  const textPrimary = isDark ? '#fff' : DARK;
  const textSecondary = isDark ? 'rgba(255,255,255,0.7)' : ACCENT;
  const textTertiary = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(80,55,30,0.65)';

  const names = allNames ?? NAMES_OF_ALLAH;
  const item = useMemo(() => {
    if (nameData) return nameData;
    if (!names.length) return null;
    return names[Math.floor(Math.random() * names.length)];
  }, [nameData, names]);

  if (!item) return null;

  return (
    <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth }]}>
      <View style={styles.cardContent}>
        {/* Number chip — top right */}
        <Text style={[styles.numberChip, { color: textSecondary }]}>#{item.number}</Text>

        {/* Arabic name */}
        <Text style={[styles.arabic, { color: textPrimary }]}>{item.arabic}</Text>

        {/* Transliteration · English */}
        <Text style={[styles.transliteration, { color: textSecondary }]}>
          {item.transliteration}{'  ·  '}{item.english}
        </Text>

        {/* Meaning */}
        <Text style={[styles.meaning, { color: textTertiary }]}>{item.meaning}</Text>
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

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
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  numberChip: {
    position: 'absolute',
    top: 14,
    right: 16,
    fontFamily: FolioFonts.plateMedium,
    fontSize: 13,
    opacity: 0.75,
  },
  arabic: {
    fontFamily: FolioFonts.quran,
    fontSize: 42,
    lineHeight: 62,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  transliteration: {
    fontFamily: FolioFonts.plateMedium,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  meaning: {
    fontFamily: FolioFonts.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
