import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Search } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { NAMES_OF_ALLAH, NameOfAllah } from '../data/names';
import { FolioFonts, Step } from '../constants/folio';
import { Fonts } from '../constants/theme';
import { GlassCard } from '../components/ui/GlassCard';

export default function NamesOfAllahScreen() {
  const { colors, isDark } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNames = React.useMemo(() => {
    if (!searchQuery) return NAMES_OF_ALLAH;
    const lowerQuery = searchQuery.toLowerCase();
    return NAMES_OF_ALLAH.filter(
      (n) =>
        n.english.toLowerCase().includes(lowerQuery) ||
        n.transliteration.toLowerCase().includes(lowerQuery) ||
        n.meaning.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  const renderItem = ({ item }: { item: NameOfAllah }) => (
    <GlassCard radius={24} style={[styles.card, { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.numberBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <Text style={[styles.number, { color: colors.text }]}>{item.number}</Text>
        </View>
        <Text style={[styles.arabic, { color: colors.text }]}>{item.arabic}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.transliteration, { color: colors.text }]}>{item.transliteration}</Text>
        <Text style={[styles.english, { color: colors.primary }]}>{item.english}</Text>
        <Text style={[styles.meaning, { color: colors.textSecondary }]}>{item.meaning}</Text>
      </View>
    </GlassCard>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>99 Names of Allah</Text>
        <View style={{ flex: 1 }} />
        {/* Placeholder for symmetry */}
        <View style={{ width: 24, marginHorizontal: 16 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <Search size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search names, meanings..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>
      </View>

      <FlatList
        data={filteredNames}
        keyExtractor={(item) => String(item.number)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontFamily: FolioFonts.plateMedium,
    fontSize: 18,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: Step.margin,
    paddingVertical: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FolioFonts.body,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: Step.margin,
    paddingBottom: 40,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontFamily: FolioFonts.plateMedium,
    fontSize: 13,
  },
  arabic: {
    fontFamily: FolioFonts.quran,
    fontSize: 40,
    textAlign: 'right',
  },
  cardBody: {
    alignItems: 'flex-start',
  },
  transliteration: {
    fontFamily: Fonts.display,
    fontSize: 22,
    marginBottom: 4,
  },
  english: {
    fontFamily: FolioFonts.plateMedium,
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.8,
  },
  meaning: {
    fontFamily: FolioFonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
});
