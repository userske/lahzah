import { useMemo } from 'react';
import { BookOpen, Scroll, HandHeart, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { FeedItem } from '../../hooks/useFeed';
import { GlassCard } from '../ui/GlassCard';

const TYPE_CONFIG: Record<string, { label: string; icon: any; accent: string }> = {
  ayah:   { label: 'Ayah of the Day',  icon: BookOpen, accent: '#007054' },
  hadith: { label: 'Hadith',            icon: Scroll, accent: '#5B3B9B' },
  dua:    { label: 'Du\'a',             icon: HandHeart, accent: '#B45309' },
  name:   { label: 'Name of Allah',     icon: Sparkles, accent: '#0E7490' },
};

interface FeedCardProps {
  item: FeedItem;
}

export function FeedCard({ item }: FeedCardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.ayah;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <config.icon size={16} color={config.accent} />
        <Text style={[styles.label, { color: config.accent }]}>{config.label}</Text>
      </View>

      {item.arabic ? (
        <Text style={styles.arabic}>{item.arabic}</Text>
      ) : null}

      <Text style={styles.text} numberOfLines={6}>{item.text}</Text>

      {item.source ? (
        <Text style={styles.source}>{item.source}</Text>
      ) : null}
    </GlassCard>
  );
}

const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    card: {
      padding: 20,
      marginBottom: 14,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    icon: {
      fontSize: 16,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    arabic: {
      fontSize: 22,
      lineHeight: 40,
      textAlign: 'right',
      color: colors.text,
      marginBottom: 12,
      direction: 'rtl',
    },
    text: {
      fontSize: 15,
      lineHeight: 24,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    source: {
      marginTop: 10,
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
    },
  });
