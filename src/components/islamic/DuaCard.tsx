import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, UIManager, TouchableOpacity, LayoutAnimation } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { Dua } from '../../services/ummahApi';
import { FolioFonts, FolioColors, label, Rule, Step } from '../../constants/folio';
import { Heart } from 'lucide-react-native';
import { useSavedItems } from '../../hooks/useSavedItems';
import { DoubleTapHeart } from '../ui/DoubleTapHeart';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const formatCategory = (cat: string) => {
  return cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

interface DuaCardProps {
  dua: Dua;
}

export function DuaCard({ dua }: DuaCardProps) {
  const { isDark, colors } = useAppTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const categoryLabel = formatCategory(dua.category) || 'Dua';
  const { toggleDuaSave, isDuaSaved } = useSavedItems();

  const saved = isDuaSaved(dua);

  const handleDoubleTap = () => {
    if (!saved) toggleDuaSave(dua);
  };

  return (
    <DoubleTapHeart onDoubleTap={handleDoubleTap}>
      <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <View style={styles.cardContent}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={[label, { color: colors.textSecondary }]}>{categoryLabel.toUpperCase()}</Text>
              <TouchableOpacity 
                onPress={() => toggleDuaSave(dua)}
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
            {dua.arabic}
          </Text>

          {/* ── Transliteration ── */}
          <Text 
            style={[styles.transliteration, { color: '#D4B896' }]}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {dua.transliteration}
          </Text>

          {/* ── Translation ── */}
          <Text 
            style={[styles.translation, { color: colors.textSecondary }]}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {dua.translation}
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
            <Text style={[styles.sourceText, { color: colors.textTertiary }]}>{dua.source}</Text>
          </View>
          </View>
        </View>
    </DoubleTapHeart>
  );
}

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
  transliteration: {
    fontFamily: FolioFonts.bodyMedium,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
    fontStyle: 'italic',
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

