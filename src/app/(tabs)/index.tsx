import { useEffect, useState, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp, Easing } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Sun, Moon, BookOpen, Heart, Star, HandHeart, Target, Users, Settings } from 'lucide-react-native';
import { AppBackground } from '../../components/ui/AppBackground';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  fetchPrayerTimes,
  fetchQiblaDirection,
  fetchHadithOfTheDay,
  fetchHijriDate,
  type PrayerTimes,
  type Hadith,
  type HijriDate,
} from '../../services/ummahApi';
import { NAMES_OF_ALLAH } from '../../data/names';
import type { NameOfAllah } from '../../data/names';
import { supabase } from '../../lib/supabase';
import { useReadingProgress } from '../../hooks/useReadingProgress';
import { useCircleActivity } from '../../hooks/useCircleActivity';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Fonts } from '../../constants/theme';
import { useFeed } from '../../hooks/useFeed';
import { HadithCard } from '../../components/islamic/HadithCard';
import { NameOfAllahCard } from '../../components/islamic/NameOfAllahCard';
import { DuaCard } from '../../components/islamic/DuaCard';
import { ShareableCard } from '../../components/home/ShareableCard';
import { ContinueReadingCard } from '../../components/home/ContinueReadingCard';
import { AyahOfTheDayCard } from '../../components/islamic/AyahOfTheDayCard';
import { QuickLinksMenu } from '../../components/home/QuickLinksMenu';
import { PrayerRegister } from '../../components/folio/PrayerRegister';
import { useFolio } from '../../hooks/useFolio';
import { FolioFonts, Rule, Step, label } from '../../constants/folio';
import { useQuranPreload } from '../../hooks/useQuranPreload';
import { Search, Loader2 } from 'lucide-react-native';

const smoothEntry = FadeInUp.duration(500).easing(Easing.out(Easing.quad));
const screenWidth = Dimensions.get('window').width;

export default function TodayScreen() {
  const { colors, isDark } = useAppTheme();
  const { plate } = useFolio();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const today = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    [],
  );

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [hadith, setHadith] = useState<Hadith | null>(null);

  const allNames: NameOfAllah[] = NAMES_OF_ALLAH;
  const [hijriDate, setHijriDate] = useState<HijriDate | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [greeting, setGreeting] = useState('As-salamu alaykum');
  const [userInitials, setUserInitials] = useState('?');
  const { status: syncStatus } = useQuranPreload();

  // Carousel randomization — picks a random slide each time user visits home
  const carouselRef = useRef<ScrollView>(null);
  const [inspirationStartIndex, setInspirationStartIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      // Randomize the starting card (0 = Ayah, 1 = Hadith, 2 = Dua)
      const rand = Math.floor(Math.random() * 3);
      setInspirationStartIndex(rand);

      // Step 1: jump silently to the chosen card
      const t1 = setTimeout(() => {
        carouselRef.current?.scrollTo({ x: rand * screenWidth, animated: false });
      }, 50);

      // Step 2: nudge — peek at the next card so the user knows it's swipeable
      const t2 = setTimeout(() => {
        carouselRef.current?.scrollTo({ x: rand * screenWidth + 72, animated: true });
      }, 400);

      // Step 3: snap back to the chosen card
      const t3 = setTimeout(() => {
        carouselRef.current?.scrollTo({ x: rand * screenWidth, animated: true });
      }, 800);

      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [])
  );

  const { position, loading: progressLoading } = useReadingProgress();
  const { activity } = useCircleActivity();
  const { items: feedItems, loading: feedLoading } = useFeed();

  const loading = apiLoading || progressLoading;

  // Load user initials for avatar
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        const parts = user.email.split('@')[0].split('.');
        setUserInitials(parts.map((p: string) => p[0]?.toUpperCase()).join('').slice(0, 2));
      }
    });
  }, []);

  useEffect(() => {
    const loadApiData = async () => {
      setApiLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        let prayerData: PrayerTimes | null = null;
        if (status === 'granted') {
          let latitude = 21.4225; // Mecca fallback
          let longitude = 39.8262;
          
          try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
            latitude = loc.coords.latitude;
            longitude = loc.coords.longitude;
          } catch (locErr) {
          }
          
          setUserCoords({ lat: latitude, lng: longitude });

          // Load user prayer settings
          const [[, m], [, c]] = await AsyncStorage.multiGet(['prayer_madhab', 'prayer_method']);

          prayerData = await fetchPrayerTimes({
            lat: latitude,
            lng: longitude,
            madhab: m ?? 'Shafi',
            method: c ?? 'MuslimWorldLeague',
          });
          const qiblaData = await fetchQiblaDirection({ lat: latitude, lng: longitude });
          if (qiblaData) setQiblaAngle(qiblaData.qibla_direction);
        }
        
        // Reset hadith at 6pm local time
        const now = new Date();
        const hadithDate = new Date(now.getTime() - 18 * 60 * 60 * 1000);
        const dateString = `${hadithDate.getFullYear()}-${hadithDate.getMonth()}-${hadithDate.getDate()}`;
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) {
          hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
          hash |= 0;
        }
        const randomHadithId = Math.abs(hash) % 7000 + 1;

        const [dailyHadith, hijri] = await Promise.all([
          fetchHadithOfTheDay('bukhari', randomHadithId),
          fetchHijriDate(),
        ]);
        setPrayerTimes(prayerData);
        setHadith(dailyHadith);
        setHijriDate(hijri);
      } catch (err) {
      } finally {
        setApiLoading(false);
      }
    };
    loadApiData();
  }, []);

  const handleSettingsChange = async (m: string, c: string) => {
    if (!userCoords) return;
    setApiLoading(true);
    const prayerData = await fetchPrayerTimes({
      lat: userCoords.lat,
      lng: userCoords.lng,
      madhab: m,
      method: c,
    });
    setPrayerTimes(prayerData);
    setApiLoading(false);
  };

  const continueSurahNumber = position?.surahNumber ?? null;
  const continueAyah = position?.ayahNumber ?? null;

  const SURAH_AYAH_COUNTS = [
    7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
    112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,
    59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,
    52,52,44,28,28,20,56,40,31,50,22,11,11,12,19,57,17,26,33,46,15,6,8,5,4,
    19,5,8,4,9,3,11,4,4,3,9,5,8,3,5,3,5,3,4,7,3,6,3,3,3,3,
  ];
  const continueProgress = (() => {
    if (!position) return 0;
    const prev = SURAH_AYAH_COUNTS.slice(0, position.surahNumber - 1).reduce((a, b) => a + b, 0);
    return Math.min(100, Math.floor(((prev + position.ayahNumber) / 6236) * 100));
  })();

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}

        >

          {/* ─── Head of the leaf ─── */}
          <Animated.View entering={smoothEntry.delay(0)} style={styles.headRow}>
            <View style={styles.headText}>
              <Text style={[styles.greetingText, { color: plate.ink }]}>{greeting}</Text>
              <Text style={[label, styles.dateLine, { color: plate.graphite }]} numberOfLines={1}>
                {today}
                {hijriDate?.hijri.formatted
                  ? `  ·  ${hijriDate.hijri.formatted.replace(' AH', '')}`
                  : ''}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={[styles.bookplate, { borderColor: plate.rule, backgroundColor: 'transparent', padding: 0, justifyContent: 'center', alignItems: 'center' }]}
                onPress={() => router.push('/saved-feed')}
                accessibilityRole="button"
                accessibilityLabel="Open your saved items"
              >
                <Heart size={20} color={plate.ink} strokeWidth={2} />
              </TouchableOpacity>
              {syncStatus === 'downloading' && (
                <View style={{ marginRight: 12 }}>
                  <ActivityIndicator size="small" color={plate.ink} />
                </View>
              )}
              <QuickLinksMenu />
            </View>
          </Animated.View>

          {/* ─── Prayer Register ─── */}
          <Animated.View entering={smoothEntry.delay(40)}>
            <PrayerRegister
              prayerTimes={prayerTimes}
              qiblaAngle={qiblaAngle}
              onSettingsChange={handleSettingsChange}
            />
          </Animated.View>

          {/* ─── Global Search Bar ─── */}
          <Animated.View entering={smoothEntry.delay(60)} style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <TouchableOpacity 
              style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: plate.rule }]}
              onPress={() => router.push('/(tabs)/reader/search')}
            >
              <Search size={20} color={plate.ink} style={{ opacity: 0.5 }} />
              <Text style={{ marginLeft: 12, color: plate.graphite, fontSize: 16, fontFamily: Fonts.sans }}>
                Search the Quran...
              </Text>
            </TouchableOpacity>
          </Animated.View>


          {/* ─── Continue Reading ─── */}
          <Animated.View entering={smoothEntry.delay(80)}>
            <ContinueReadingCard
              surahNumber={continueSurahNumber}
              ayahNumber={continueAyah}
              progressPercent={continueProgress}
            />
          </Animated.View>


          {/* ─── Daily Inspirations (Carousel) ─── */}
          <Animated.View entering={smoothEntry.delay(200)}>
            <View style={styles.feedHeader}>
              <Sun size={14} color={colors.primary} />
              <Text style={[styles.feedTitle, { color: colors.text }]}>Daily Inspirations</Text>
            </View>

            <ScrollView 
              ref={carouselRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              snapToInterval={screenWidth}
              decelerationRate="fast"
            >
              {/* Ayah of the Day */}
              <View style={{ width: screenWidth }}>
                <ShareableCard>
                  <AyahOfTheDayCard />
                </ShareableCard>
              </View>



              {/* Hadith of the Day */}
              <View style={{ width: screenWidth }}>
                <ShareableCard>
                  <HadithCard hadith={hadith} />
                </ShareableCard>
              </View>

              {/* Dua of the Day */}
              {feedLoading && feedItems.length === 0 ? (
                <View style={{ width: screenWidth, justifyContent: 'center' }}>
                  <ActivityIndicator style={{ marginVertical: 12 }} color={colors.primary} />
                </View>
              ) : (
                feedItems.map((item, idx) =>
                  item.type === 'dua' && item.dua ? (
                    <View key={idx} style={{ width: screenWidth }}>
                      <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/tasbih')}>
                        <ShareableCard>
                          <DuaCard dua={item.dua} />
                        </ShareableCard>
                      </TouchableOpacity>
                    </View>
                  ) : null
                )
              )}
            </ScrollView>
          </Animated.View>

          {/* ─── Tasbih Counter Link ─── */}
          <Animated.View entering={smoothEntry.delay(300)}>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => router.push('/tasbih')}
              style={[styles.tasbihCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Image 
                source={require('../../../assets/images/tasbih.png')} 
                style={styles.tasbihIcon} 
                resizeMode="contain" 
              />
              <View style={styles.tasbihTextContainer}>
                <Text style={[styles.tasbihTitle, { color: colors.text }]}>Tasbih Counter</Text>
                <Text style={[styles.tasbihSubtitle, { color: colors.textSecondary }]}>Keep track of your dhikr</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    container: {
      paddingTop: 8,
      paddingBottom: 120,
    },
    headRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Step.margin,
      marginBottom: Step.bandGap,
      gap: Step.base,
    },
    headText: {
      flex: 1,
    },
    greetingText: {
      fontFamily: Fonts.display,
      fontSize: 27,
      lineHeight: 33,
      letterSpacing: -0.2,
    },
    dateLine: {
      marginTop: 5,
      fontSize: 10,
      letterSpacing: 1,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
    bookplate: {
      width: 42,
      height: 42,
      borderWidth: Rule,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bookplateText: {
      fontFamily: FolioFonts.plate,
      fontSize: 15,
    },
    registerBand: {
      marginBottom: Step.bandGap,
    },
    feedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    feedTitle: {
      fontFamily: Fonts.display,
      fontSize: 16,
      letterSpacing: -0.2,
    },
    quickLinksRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginTop: 24,
      marginBottom: 0,
    },
    quickLinkWrapper: {
      width: '48%',
      marginBottom: 12,
    },
    quickLink: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    quickLinkIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickLinkLabel: {
      fontFamily: Fonts.sansBold,
      fontSize: 15,
      letterSpacing: -0.2,
    },
    tasbihCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: Step.margin,
      marginTop: 24,
      padding: 16,
      borderRadius: 24,
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    tasbihIcon: {
      width: 48,
      height: 48,
      marginRight: 16,
    },
    tasbihTextContainer: {
      flex: 1,
    },
    tasbihTitle: {
      fontFamily: Fonts.display,
      fontSize: 18,
      marginBottom: 4,
    },
    tasbihSubtitle: {
      fontFamily: Fonts.sans,
      fontSize: 14,
    },
  });
