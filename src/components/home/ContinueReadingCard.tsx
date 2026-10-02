import { GlassBlur } from '../ui/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, BookOpen, PauseCircle, PlayCircle, Settings, Square } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ActivityIndicator, Alert } from 'react-native';
import { DEFAULT_RECITER, Reciter, SWAHILI_AL_BARWANI } from '../../data/reciters';
import { getSwahiliAudioUrl } from '../../data/swahiliAudio';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { fetchChapters, fetchRecitations, fetchVerseRecitationsByChapter } from '../../services/quranApi';
import { AudioSettingsModal } from '../quran/AudioSettingsModal';

import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { Fonts } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { getLocalFileUri } from '../../hooks/useAudioDownload';
import { useAudioPersistence } from '../../hooks/useAudioPersistence';
import { usePreferences } from '../../hooks/usePreferences';
import { AudioState, subscribeToAudioState } from '../../state/audioEvent';
import { requestSurah } from '../../state/readerState';

// Arabic surah names map
const ARABIC_NAMES: Record<number, string> = {
  1: 'الفَاتِحَة', 2: 'البَقَرَة', 3: 'آل عِمْرَان', 4: 'النِّسَاء',
  5: 'المَائِدَة', 6: 'الأَنْعَام', 7: 'الأَعْرَاف', 8: 'الأَنفَال',
  9: 'التَّوبَة', 10: 'يُونُس', 11: 'هُود', 12: 'يُوسُف',
  13: 'الرَّعْد', 14: 'إِبْرَاهِيم', 15: 'الحِجْر', 16: 'النَّحْل',
  17: 'الإِسْرَاء', 18: 'الكَهْف', 19: 'مَرْيَم', 20: 'طه',
  21: 'الأَنبِيَاء', 22: 'الحَجّ', 23: 'المُؤمِنُون', 24: 'النُّور',
  25: 'الفُرْقَان', 26: 'الشُّعَرَاء', 27: 'النَّمْل', 28: 'القَصَص',
  29: 'العَنكَبُوت', 30: 'الرُّوم', 31: 'لُقمَان', 32: 'السَّجدَة',
  33: 'الأَحزَاب', 34: 'سَبَأ', 35: 'فَاطِر', 36: 'يس',
  37: 'الصَّافَّات', 38: 'ص', 39: 'الزُّمَر', 40: 'غَافِر',
  41: 'فُصِّلَت', 42: 'الشُّورَى', 43: 'الزُّخرُف', 44: 'الدُّخَان',
  45: 'الجَاثِيَة', 46: 'الأَحقَاف', 47: 'مُحَمَّد', 48: 'الفَتح',
  49: 'الحُجُرَات', 50: 'ق', 51: 'الذَّارِيَات', 52: 'الطُّور',
  53: 'النَّجم', 54: 'القَمَر', 55: 'الرَّحمَن', 56: 'الوَاقِعَة',
  57: 'الحَدِيد', 58: 'المُجَادِلَة', 59: 'الحَشر', 60: 'المُمتَحِنَة',
  61: 'الصَّف', 62: 'الجُمُعَة', 63: 'المُنَافِقُون', 64: 'التَّغَابُن',
  65: 'الطَّلَاق', 66: 'التَّحرِيم', 67: 'المُلك', 68: 'القَلَم',
  69: 'الحَاقَّة', 70: 'المَعَارِج', 71: 'نُوح', 72: 'الجِنّ',
  73: 'المُزَّمِّل', 74: 'المُدَّثِّر', 75: 'القِيَامَة', 76: 'الإِنسَان',
  77: 'المُرسَلَات', 78: 'النَّبَأ', 79: 'النَّازِعَات', 80: 'عَبَس',
  81: 'التَّكوِير', 82: 'الانفِطَار', 83: 'المُطَفِّفِين', 84: 'الانشِقَاق',
  85: 'البُرُوج', 86: 'الطَّارِق', 87: 'الأَعلى', 88: 'الغَاشِيَة',
  89: 'الفَجر', 90: 'البَلَد', 91: 'الشَّمس', 92: 'اللَّيل',
  93: 'الضُّحَى', 94: 'الشَّرح', 95: 'التِّين', 96: 'العَلَق',
  97: 'القَدر', 98: 'البَيِّنَة', 99: 'الزَّلزَلَة', 100: 'العَادِيَات',
  101: 'القَارِعَة', 102: 'التَّكَاثُر', 103: 'العَصر', 104: 'الهُمَزَة',
  105: 'الفِيل', 106: 'قُرَيش', 107: 'المَاعُون', 108: 'الكَوثَر',
  109: 'الكَافِرُون', 110: 'النَّصر', 111: 'المَسَد', 112: 'الإِخلَاص',
  113: 'الفَلَق', 114: 'النَّاس',
};

const ENGLISH_NAMES: Record<number, string> = {
  1: 'Al-Fatihah', 2: 'Al-Baqarah', 3: "Ali 'Imran", 4: "An-Nisa'",
  5: "Al-Ma'idah", 6: "Al-An'am", 7: "Al-A'raf", 8: 'Al-Anfal',
  9: 'At-Tawbah', 10: 'Yunus', 11: 'Hud', 12: 'Yusuf',
  13: "Ar-Ra'd", 14: 'Ibrahim', 15: 'Al-Hijr', 16: 'An-Nahl',
  17: 'Al-Isra', 18: 'Al-Kahf', 19: 'Maryam', 20: 'Ta-Ha',
  21: "Al-Anbiya'", 22: 'Al-Hajj', 23: "Al-Mu'minun", 24: 'An-Nur',
  25: 'Al-Furqan', 26: "Ash-Shu'ara", 27: 'An-Naml', 28: 'Al-Qasas',
  29: 'Al-Ankabut', 30: 'Ar-Rum', 31: 'Luqman', 32: 'As-Sajdah',
  33: 'Al-Ahzab', 34: "Saba'", 35: 'Fatir', 36: 'Ya-Sin',
  37: 'As-Saffat', 38: 'Sad', 39: 'Az-Zumar', 40: 'Ghafir',
  41: 'Fussilat', 42: 'Ash-Shura', 43: 'Az-Zukhruf', 44: 'Ad-Dukhan',
  45: 'Al-Jathiyah', 46: 'Al-Ahqaf', 47: 'Muhammad', 48: 'Al-Fath',
  49: 'Al-Hujurat', 50: 'Qaf', 51: 'Ad-Dhariyat', 52: 'At-Tur',
  53: 'An-Najm', 54: 'Al-Qamar', 55: 'Ar-Rahman', 56: "Al-Waqi'ah",
  57: 'Al-Hadid', 58: 'Al-Mujadilah', 59: 'Al-Hashr', 60: 'Al-Mumtahanah',
  61: 'As-Saff', 62: "Al-Jumu'ah", 63: 'Al-Munafiqun', 64: 'At-Taghabun',
  65: 'At-Talaq', 66: 'At-Tahrim', 67: 'Al-Mulk', 68: 'Al-Qalam',
  69: 'Al-Haqqah', 70: "Al-Ma'arij", 71: 'Nuh', 72: 'Al-Jinn',
  73: 'Al-Muzzammil', 74: 'Al-Muddaththir', 75: 'Al-Qiyamah', 76: 'Al-Insan',
  77: 'Al-Mursalat', 78: "An-Naba'", 79: "An-Nazi'at", 80: "'Abasa",
  81: 'At-Takwir', 82: 'Al-Infitar', 83: 'Al-Mutaffifin', 84: 'Al-Inshiqaq',
  85: 'Al-Buruj', 86: 'At-Tariq', 87: "Al-A'la", 88: 'Al-Ghashiyah',
  89: 'Al-Fajr', 90: 'Al-Balad', 91: 'Ash-Shams', 92: 'Al-Layl',
  93: 'Ad-Duha', 94: 'Ash-Sharh', 95: 'At-Tin', 96: "Al-'Alaq",
  97: 'Al-Qadr', 98: 'Al-Bayyinah', 99: 'Az-Zalzalah', 100: "Al-'Adiyat",
  101: "Al-Qari'ah", 102: 'At-Takathur', 103: "Al-'Asr", 104: 'Al-Humazah',
  105: 'Al-Fil', 106: 'Quraysh', 107: "Al-Ma'un", 108: 'Al-Kawthar',
  109: 'Al-Kafirun', 110: 'An-Nasr', 111: 'Al-Masad', 112: 'Al-Ikhlas',
  113: 'Al-Falaq', 114: 'An-Nas',
};

interface ContinueReadingCardProps {
  surahNumber: number | null;
  ayahNumber: number | null;
  progressPercent: number;
}

export const ContinueReadingCard = ({
  surahNumber,
  ayahNumber,
  progressPercent,
}: ContinueReadingCardProps) => {
  const { colors, isDark } = useAppTheme();

  const [audioState, setAudioState] = useState<AudioState>({ isPlaying: false, surahName: null });
  const lastPersistedAudio = useAudioPersistence();
  const { audioPlaybackMode } = usePreferences();

  // Local Player State
  const localPlayer = useAudioPlayer();
  const { selectedReciter, setSelectedReciter } = localPlayer;
  const [showSettings, setShowSettings] = useState(false);
  const [chapters, setChapters] = useState<any[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>([]);

  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endSurah, setEndSurah] = useState<number>(1);

  const [endAyah, setEndAyah] = useState<number>(7);
  const [pickerTab, setPickerTab] = useState<'surah' | 'reciter' | 'ayah'>('surah');
  const [loadingAudio, setLoadingAudio] = useState(false);
  // Maps each track index → { surah, ayah } so we can show real names while playing
  const [playbackMap, setPlaybackMap] = useState<{ surah: number; ayah: number | null }[]>([]);

  useEffect(() => {
    fetchChapters('en').then(res => {
      if (res?.chapters) setChapters(res.chapters);
    });
    fetchRecitations().then(res => {
      if (res?.recitations) {
        setReciters([SWAHILI_AL_BARWANI, ...res.recitations]);
      }
    });
  }, []);

  const playWithConfig = async (
    surah: number,
    sAyah: number,
    eSurah: number,
    eAyah: number,
    reciter: Reciter,
  ) => {
    setLoadingAudio(true);
    try {
      if (reciter.id === 'mq.swahili_barwani') {
        // archive.org/details/Tafsiriyaquran — Arabic + Swahili combined
        const urls: string[] = [];
        const map: { surah: number; ayah: number | null }[] = [];
        for (let s = surah; s <= eSurah; s++) {
          const swUrl = getSwahiliAudioUrl(s);
          if (swUrl) urls.push(swUrl);
          map.push({ surah: s, ayah: null });
        }
        setPlaybackMap(map);
        await localPlayer.playPlaylist(urls, 0, arabicName);
      } else if (reciter.isChapterOnly && reciter.quranicAudioPath) {
        const urls: string[] = [];
        const map: { surah: number; ayah: number | null }[] = [];
        for (let s = surah; s <= eSurah; s++) {
          const localUri = getLocalFileUri(s, reciter.id);
          const fileInfo = await FileSystem.getInfoAsync(localUri);
          if (fileInfo.exists) {
            urls.push(localUri);
          } else {
            if (audioPlaybackMode === 'offline') {
              Alert.alert('Offline Mode', 'This audio is not downloaded. Please download it from the Audio Manager or switch to Stream mode.');
              setLoadingAudio(false);
              return;
            }
            const paddedSurah = String(s).padStart(3, '0');
            urls.push(`https://download.quranicaudio.com/quran/${reciter.quranicAudioPath}/${paddedSurah}.mp3`);
          }
          map.push({ surah: s, ayah: null });
        }
        setPlaybackMap(map);
        await localPlayer.playPlaylist(urls, 0, arabicName);
      } else {
        let allUrls: string[] = [];
        const map: { surah: number; ayah: number | null }[] = [];
        for (let s = surah; s <= eSurah; s++) {
          // Check for local chapter bulk download first!
          const localUri = getLocalFileUri(s, reciter.id);
          const fileInfo = await FileSystem.getInfoAsync(localUri);
          if (fileInfo.exists) {
            allUrls.push(localUri);
            map.push({ surah: s, ayah: null });
            continue; // skip verse-by-verse fetching
          }

          if (audioPlaybackMode === 'offline') {
            Alert.alert('Offline Mode', 'This audio is not downloaded. Please download it from the Audio Manager or switch to Stream mode.');
            setLoadingAudio(false);
            return;
          }

          const res = await fetchVerseRecitationsByChapter(s, reciter.id);
          if (res?.audio_files?.length > 0) {
            let urls = res.audio_files.map((file: any) => {
              const u = file && typeof file.url === 'string' ? file.url : '';
              if (!u) return '';
              if (u.startsWith('http')) return u;
              if (u.startsWith('//')) return `https:${u}`;
              return `https://verses.quran.com/${u}`;
            }).filter((u: string) => u !== '');
            let sIndex = 0;
            let eIndex = urls.length;
            if (s === surah) sIndex = Math.max(0, sAyah - 1);
            if (s === eSurah) eIndex = Math.min(urls.length, eAyah);
            const sliced = urls.slice(sIndex, eIndex);
            sliced.forEach((_: string, idx: number) => {
              map.push({ surah: s, ayah: sIndex + idx + 1 });
            });
            allUrls = [...allUrls, ...sliced];
          }
        }
        if (allUrls.length > 0) {
          setPlaybackMap(map);
          await localPlayer.playPlaylist(allUrls, 0, arabicName);
        }
      }
    } catch (err) {
    } finally {
      setLoadingAudio(false);
    }
  };

  // Convenience wrapper using current state values (used by the settings modal)
  const handlePlayLocal = () =>
    playWithConfig(selectedSurah, startAyah, endSurah, endAyah, selectedReciter);

  const handlePauseLocal = () => {
    localPlayer.togglePlayback();
  };


  useEffect(() => {
    const unsubscribe = subscribeToAudioState((state) => {
      setAudioState(state);
    });
    return unsubscribe;
  }, []);

  const arabicName = surahNumber ? (ARABIC_NAMES[surahNumber] ?? 'القُرآن') : 'القُرآن';
  const englishName = surahNumber ? (ENGLISH_NAMES[surahNumber] ?? `Surah ${surahNumber}`) : 'Begin your journey';
  const clampedProgress = Math.min(100, Math.max(0, progressPercent || 0));

  const textPrimary = isDark ? '#fff' : '#0d0d0d';
  const textSecondary = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';
  const textTertiary = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)';
  const borderColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)';
  const trackColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const btnBg = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={styles.card}>
      {/* Base blur - matched to PrayerRegister pills */}
      <GlassBlur
        intensity={20}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      {/* ── Highlight rim ── */}
      <View
        style={[StyleSheet.absoluteFill, {
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)',
          borderRadius: 24, // Matches styles.card borderRadius
        }]}
      />
      {/* ── Top sheen ── */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)']
            : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']
        }
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={styles.sheen}
        pointerEvents="none"
      />

      <View style={styles.inner}>
        {/* ── TOP ROW: badge + surah number ── */}
        <View style={styles.topRow}>
          <View style={[styles.badge, { backgroundColor: btnBg, borderColor }]}>
            <BookOpen size={10} color={textSecondary} />
            <Text style={[styles.badgeText, { color: textSecondary }]}>CONTINUE READING</Text>
          </View>
          {surahNumber && (
            <Text style={[styles.surahNum, { color: textTertiary }]}>
              {String(surahNumber).padStart(3, '0')}
            </Text>
          )}
        </View>

        {/* ── CENTRE: Arabic name hero ── */}
        <Text style={[styles.arabicHero, { color: textPrimary }]} numberOfLines={1}>
          {arabicName}
        </Text>

        {/* ── MIDDLE: English name + ayah ── */}
        <View style={styles.metaRow}>
          <Text style={[styles.englishName, { color: textPrimary }]}>{englishName}</Text>
          {ayahNumber != null && (
            <View style={[styles.ayahPill, { backgroundColor: btnBg, borderColor }]}>
              <Text style={[styles.ayahPillText, { color: textSecondary }]}>
                Ayah {ayahNumber}
              </Text>
            </View>
          )}
        </View>

        {/* ── BOTTOM ROW: progress + button ── */}
        <View style={styles.bottomRow}>
          {/* Progress track */}
          <View style={styles.progressArea}>
            <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
              <LinearGradient
                colors={['#5eead4', '#14b8a6']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${clampedProgress}%` as any }]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: textTertiary }]}>
              {Math.round(clampedProgress)}% of Quran
            </Text>
          </View>

          {/* CTA button */}
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: textPrimary, shadowColor: textPrimary }]}
            activeOpacity={0.82}
            onPress={() => {
              if (surahNumber) requestSurah(surahNumber, ayahNumber ?? undefined);
              router.push('/reader');
            }}
          >
            <Text style={[styles.ctaBtnText, { color: isDark ? '#0d0d0d' : '#fff' }]}>
              Continue
            </Text>
            <ArrowRight size={14} color={isDark ? '#0d0d0d' : '#fff'} />
          </TouchableOpacity>
        </View>

        {/* ── UNIFIED AUDIO PLAYER ── */}
        <View style={[styles.miniPlayer, { borderColor }]}>
          <TouchableOpacity
            style={styles.miniPlayerInfo}
            onPress={() => setShowSettings(true)}
          >
            <Settings size={14} color={textTertiary} />
            <Text style={[styles.miniPlayerText, { color: textSecondary }]} numberOfLines={1}>
              {localPlayer.isPlaying
                ? (() => {
                  const track = playbackMap[localPlayer.currentTrackIndex];
                  if (!track) return `Playing: ${ENGLISH_NAMES[selectedSurah] ?? `Surah ${selectedSurah}`}`;
                  const surahName = ENGLISH_NAMES[track.surah] ?? `Surah ${track.surah}`;
                  const arabicSurahName = ARABIC_NAMES[track.surah] ?? '';
                  return track.ayah
                    ? `${surahName} ${arabicSurahName} · ${track.surah}:${track.ayah}`
                    : `${surahName} ${arabicSurahName}`;
                })()
                : audioState.isPlaying
                  ? `${audioState.surahName || 'Quran'}`
                  : lastPersistedAudio
                    ? `Resume · ${ENGLISH_NAMES[lastPersistedAudio.surahNumber] ?? `Surah ${lastPersistedAudio.surahNumber}`} · Ayah ${lastPersistedAudio.ayahNumber}`
                    : 'Listen to Quran'}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {loadingAudio ? (
              <ActivityIndicator size="small" color={textPrimary} />
            ) : (
              <>
                {(localPlayer.isPlaying || audioState.isPlaying) && (
                  <TouchableOpacity
                    style={[styles.miniPlayerBtn, { marginRight: 12 }]}
                    onPress={() => {
                      if (localPlayer.isPlaying) {
                        localPlayer.stopAudio();
                      } else if (audioState.isPlaying) {
                        // If audio is playing from another screen, dispatching a stop event or pausing it
                        audioState.togglePlayback?.();
                      }
                    }}
                  >
                    <Square size={20} color={textPrimary} fill={textPrimary} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.miniPlayerBtn}
                  onPress={() => {
                    if (localPlayer.isPlaying) {
                      handlePauseLocal();
                    } else if (audioState.isPlaying) {
                      audioState.togglePlayback?.();
                    } else if (lastPersistedAudio) {
                      // Resume from persisted session
                      const reciter = reciters
                        .find(r => r.id === lastPersistedAudio.reciterId) || DEFAULT_RECITER;
                      setSelectedReciter(reciter);
                      playWithConfig(
                        lastPersistedAudio.surahNumber,
                        lastPersistedAudio.ayahNumber,
                        lastPersistedAudio.surahNumber,
                        999,
                        reciter,
                      );
                    } else {
                      handlePlayLocal();
                    }
                  }}
                >
                  {(localPlayer.isPlaying || audioState.isPlaying)
                    ? <PauseCircle size={24} color={textPrimary} />
                    : <PlayCircle size={24} color={textPrimary} />
                  }
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>

      {/* ── Hairline border ── */}
      <View
        style={[StyleSheet.absoluteFill, styles.border, { borderColor }]}
        pointerEvents="none"
      />

      <AudioSettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onPlay={handlePlayLocal}
        chapters={chapters}
        reciters={reciters}
        selectedReciter={selectedReciter}
        setSelectedReciter={setSelectedReciter}
        startSurah={selectedSurah}
        setStartSurah={setSelectedSurah}
        startAyah={startAyah}
        setStartAyah={setStartAyah}
        endSurah={endSurah}
        setEndSurah={setEndSurah}
        endAyah={endAyah}
        setEndAyah={setEndAyah}
      />

    </View>
  );
};

const styles = StyleSheet.create({


  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 80,
  },
  border: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 10,
  },

  /* top row */
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  surahNum: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
  },

  /* arabic hero */
  arabicHero: {
    fontFamily: Fonts.arabic,
    fontSize: 50,
    textAlign: 'right',
    writingDirection: 'rtl',
    letterSpacing: -0.5,
  },

  /* meta */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  englishName: {
    fontFamily: Fonts.display,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  ayahPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ayahPillText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
  },

  /* bottom row */
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressArea: {
    flex: 1,
    gap: 6,
    marginRight: 16,
  },
  progressTrack: {
    height: 3,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 3,
  },
  progressLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingLeft: 18,
    paddingRight: 14,
    borderRadius: 50,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  miniPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  miniPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  miniPlayerText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  miniPlayerBtn: {
    paddingLeft: 12,
  }
});
