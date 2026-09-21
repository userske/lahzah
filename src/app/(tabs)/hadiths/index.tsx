import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Bookmark, BookOpen, Book, Feather as FeatherIcon, Star, Layers, Compass, Sun, Heart, FileText, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { AppBackground } from '../../../components/ui/AppBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useHadithState } from '../../../hooks/useHadithState';
import { FolioFonts, FolioColors, Rule, Step, label } from '../../../constants/folio';

export const COLLECTIONS = [
  { id: 'bukhari',   name: 'Sahih al-Bukhari',       Icon: BookOpen, total: 7580, author: 'Imam Bukhari' },
  { id: 'muslim',    name: 'Sahih Muslim',           Icon: Book, total: 7360, author: 'Imam Muslim' },
  { id: 'abudawud',  name: 'Sunan Abu Dawud',        Icon: FeatherIcon, total: 5272, author: 'Abu Dawud' },
  { id: 'tirmidhi',  name: 'Jami at-Tirmidhi',       Icon: Star, total: 3926, author: 'Imam Tirmidhi' },
  { id: 'ibnmajah',  name: 'Sunan Ibn Majah',        Icon: Layers, total: 4340, author: 'Ibn Majah' },
  { id: 'nasai',     name: "Sunan an-Nasa'i",        Icon: Compass, total: 5679, author: "Imam an-Nasa'i" },
  { id: 'malik',     name: 'Muwatta Malik',          Icon: Sun, total: 1829, author: 'Imam Malik' },
  { id: 'nawawi',    name: "Nawawi's 40 Hadith",     Icon: Heart, total: 42, author: 'Imam an-Nawawi' },
];

export default function HadithBrowseScreen() {
  const { isDark } = useAppTheme();
  const plate = isDark ? FolioColors.night : FolioColors.day;
  const { savedHadiths, lastRead } = useHadithState();

  const lastReadCollection = lastRead 
    ? COLLECTIONS.find((c) => c.id === lastRead.collection)
    : null;

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backBtn}>
            <ArrowLeft size={22} color={plate.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: plate.ink }]}>Hadith Library</Text>
            <Text style={[styles.headerSub, { color: plate.graphite }]}>
              36,000+ hadiths · Authentic collections
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.grid}>

            {/* Resume Reading Card (if exists) */}
            {lastReadCollection && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push(`/hadiths/${lastReadCollection.id}`)}
                style={styles.cardContainer}
              >
                <GlassCard style={[styles.card, { borderColor: plate.rule }]}>
                  <View style={styles.cardContent}>
                    <Text style={[styles.collectionName, { color: plate.ink }]} numberOfLines={1}>
                      Resume {lastReadCollection.name}
                    </Text>
                    <Text style={[styles.authorName, { color: plate.graphite }]} numberOfLines={1}>
                      Continue where you left off
                    </Text>
                    <View style={styles.metaRow}>
                      <Clock size={12} color={plate.graphite} />
                      <Text style={[styles.metaText, { color: plate.graphite }]}>
                        Page {lastRead?.page}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            )}
            
            {/* Saved Hadiths Special Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/hadiths/saved')}
              style={styles.cardContainer}
            >
              <GlassCard style={[styles.card, { borderColor: plate.rule }]}>
                <View style={styles.cardContent}>
                  <Text style={[styles.collectionName, { color: plate.ink }]} numberOfLines={1}>
                    Saved Hadiths
                  </Text>
                  <Text style={[styles.authorName, { color: plate.graphite }]} numberOfLines={1}>
                    Your personal collection
                  </Text>
                  <View style={styles.metaRow}>
                    <Bookmark size={12} color={plate.graphite} />
                    <Text style={[styles.metaText, { color: plate.graphite }]}>
                      {savedHadiths.length} saved
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>

            {/* Standard Collections */}
            {COLLECTIONS.map((col) => (
              <TouchableOpacity
                key={col.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/hadiths/${col.id}`)}
                style={styles.cardContainer}
              >
                <GlassCard style={[styles.card, { borderColor: plate.rule }]}>
                  <View style={styles.cardContent}>
                    <Text style={[styles.collectionName, { color: plate.ink }]} numberOfLines={1}>
                      {col.name}
                    </Text>
                    <Text style={[styles.authorName, { color: plate.graphite }]} numberOfLines={1}>
                      {col.author}
                    </Text>
                    <View style={styles.metaRow}>
                      <FileText size={12} color={plate.graphite} />
                      <Text style={[styles.metaText, { color: plate.graphite }]}>
                        {col.total} hadiths
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
    paddingHorizontal: Step.margin,
    paddingVertical: Step.band,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FolioFonts.plateMedium, fontSize: 24 },
  headerSub: { fontFamily: FolioFonts.body, fontSize: 14, marginTop: 2 },
  scrollContent: {
    paddingHorizontal: Step.margin,
    paddingBottom: 120,
    paddingTop: 8,
  },
  grid: {
    gap: 12,
  },
  cardContainer: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Step.band,
    borderWidth: Rule,
    borderRadius: 20,
    gap: 16,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: Rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  collectionName: {
    fontFamily: FolioFonts.plateMedium,
    fontSize: 18,
    marginBottom: 4,
  },
  authorName: {
    fontFamily: FolioFonts.body,
    fontSize: 14,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: FolioFonts.plateItalic,
    fontSize: 13,
  },
});
