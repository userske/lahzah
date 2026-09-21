import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, BookOpen, Quote, Sparkles } from 'lucide-react-native';
import { useSavedItems } from '../../hooks/useSavedItems';
import { AppBackground } from '../../components/ui/AppBackground';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Fonts } from '../../constants/theme';
import { router } from 'expo-router';
import { requestSurah } from '../../state/readerState';

type FeedItem = {
  type: 'ayah' | 'dua' | 'hadith';
  id: string;
  timestamp: number;
  data: any;
};

export default function SavedFeedScreen() {
  const { colors, isDark } = useAppTheme();
  const { savedAyahs, savedDuas, savedHadiths } = useSavedItems();

  const feedItems = useMemo(() => {
    const items: FeedItem[] = [];

    savedAyahs.forEach(a => {
      items.push({ type: 'ayah', id: a.id, timestamp: a.timestamp, data: a });
    });

    savedDuas.forEach((d, i) => {
      // Duas don't have a stable ID in data right now, so we use index + arabic text
      items.push({ type: 'dua', id: `dua-${i}-${d.arabic.substring(0,10)}`, timestamp: d.timestamp, data: d });
    });

    savedHadiths.forEach(h => {
      // For hadiths we don't have timestamps saved yet (legacy), default to 0 so they sort at bottom
      items.push({ type: 'hadith', id: `${h.collection}-${h.hadithnumber}`, timestamp: Date.now(), data: h });
    });

    // Sort by most recent
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [savedAyahs, savedDuas, savedHadiths]);

  const renderItem = ({ item }: { item: FeedItem }) => {
    switch (item.type) {
      case 'ayah':
        return (
          <TouchableOpacity 
            style={[styles.feedItem, { borderBottomColor: colors.divider }]}
            onPress={() => {
              requestSurah(item.data.surahNumber, item.data.ayahNumberInSurah);
              router.push('/(tabs)/reader');
            }}
          >
            <View style={[styles.iconBox, { backgroundColor: '#ec489915' }]}>
              <Heart size={20} color="#ec4899" fill="#ec4899" />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemText, { color: colors.text }]}>
                You liked <Text style={{ fontFamily: Fonts.sansBold }}>{item.data.surahName}</Text>, Ayah {item.data.ayahNumberInSurah}.
              </Text>
              <Text style={[styles.itemSubtext, { color: colors.textTertiary }]} numberOfLines={1}>
                "{item.data.translationText}"
              </Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: colors.border }]}>
              <BookOpen size={14} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        );

      case 'hadith':
        return (
          <TouchableOpacity 
            style={[styles.feedItem, { borderBottomColor: colors.divider }]}
            onPress={() => {
              router.push(`/hadiths/detail?collection=${item.data.collection}&number=${item.data.hadithnumber}`);
            }}
          >
            <View style={[styles.iconBox, { backgroundColor: '#ec489915' }]}>
              <Heart size={20} color="#ec4899" fill="#ec4899" />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemText, { color: colors.text }]}>
                You liked <Text style={{ fontFamily: Fonts.sansBold }}>{item.data.collection_name || item.data.collection}</Text> #{item.data.hadithnumber}.
              </Text>
              <Text style={[styles.itemSubtext, { color: colors.textTertiary }]} numberOfLines={1}>
                "{item.data.english}"
              </Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: colors.border }]}>
              <Quote size={14} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        );

      case 'dua':
        return (
          <View style={[styles.feedItem, { borderBottomColor: colors.divider }]}>
            <View style={[styles.iconBox, { backgroundColor: '#ec489915' }]}>
              <Heart size={20} color="#ec4899" fill="#ec4899" />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemText, { color: colors.text }]}>
                You liked a <Text style={{ fontFamily: Fonts.sansBold }}>{item.data.category}</Text> dua.
              </Text>
              <Text style={[styles.itemSubtext, { color: colors.textTertiary }]} numberOfLines={1}>
                "{item.data.translation}"
              </Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: colors.border }]}>
              <Sparkles size={14} color={colors.textSecondary} />
            </View>
          </View>
        );
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Activity</Text>
        </View>
        
        {feedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={48} color={colors.border} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Activity On Your Posts</Text>
            <Text style={[styles.emptySub, { color: colors.textTertiary }]}>When you like ayahs, hadiths, or duas, they'll appear here.</Text>
          </View>
        ) : (
          <FlatList
            data={feedItems}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 24,
  },
  listContent: {
    paddingBottom: 40,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    marginBottom: 4,
    lineHeight: 20,
  },
  itemSubtext: {
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  typeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 18,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
