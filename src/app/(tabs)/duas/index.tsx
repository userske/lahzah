import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpen, Feather as FeatherIcon, Star, Moon, Sun, Shield } from 'lucide-react-native';
import { router } from 'expo-router';
import { AppBackground } from '../../../components/ui/AppBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { FolioFonts, FolioColors, Rule } from '../../../constants/folio';
import { fetchDuaCategories } from '../../../services/ummahApi';



export default function DuasBrowseScreen() {
  const { isDark, colors } = useAppTheme();
  const plate = isDark ? FolioColors.night : FolioColors.day;

  const [categories, setCategories] = React.useState<{ id: string; name: string; count: number }[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchDuaCategories();
      if (data) setCategories(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Floating Back Button */}
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)')} 
          style={[styles.floatingBackBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)' }]}
        >
          <ArrowLeft size={22} color={plate.ink} />
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {loading ? (
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              <Text style={{ color: plate.graphite }}>Loading categories...</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {categories.map((cat: any) => {
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/duas/${cat.id}`)}
                    style={styles.cardContainer}
                  >
                    <GlassCard style={[styles.card, { borderColor: plate.rule }]}>
                      <View style={styles.cardContent}>
                        <Text style={[styles.collectionName, { color: plate.ink }]} numberOfLines={2}>
                          {cat.name}
                        </Text>
                        <Text style={[styles.authorName, { color: plate.graphite }]}>
                          {cat.count} Duas
                        </Text>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  floatingBackBtn: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backdropFilter: 'blur(10px)',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 80, // space for floating button
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  cardContainer: {
    width: '47%',
    marginBottom: 4,
  },
  card: {
    padding: 12,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardContent: {
    alignItems: 'center',
  },
  collectionName: {
    fontFamily: FolioFonts.plateMedium,
    fontSize: 16,
    marginBottom: 6,
    lineHeight: 22,
    textAlign: 'center',
  },
  authorName: {
    fontFamily: FolioFonts.body,
    fontSize: 12,
    textAlign: 'center',
  },
});
