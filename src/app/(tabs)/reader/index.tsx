import React from 'react';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { getSwahiliAudioUrl } from '../../../data/swahiliAudio';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { consumeReaderRequest } from '../../../state/readerState';
import { updateAudioState } from '../../../state/audioEvent';
import { supabase } from '../../../lib/supabase';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ChevronLeft, ChevronUp, Mic, Square, MoreHorizontal, X, Search } from 'lucide-react-native';
import { useReaderSettings } from '../../../hooks/useReaderSettings';
import { setReaderSettings } from '../../../state/readerSettings';
import { ReaderSettingsModal } from '../../../components/reader/ReaderSettingsModal';
import { useReadingProgress } from '../../../hooks/useReadingProgress';
import { useHifz } from '../../../hooks/useHifz';
import { useAudioPlayer } from '../../../hooks/useAudioPlayer';
import * as FileSystem from 'expo-file-system/legacy';
import { getLocalFileUri } from '../../../hooks/useAudioDownload';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Fonts } from '../../../constants/theme';
import { AppBackground } from '../../../components/ui/AppBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchVersesByChapter, fetchVerseRecitationsByChapter, fetchChapters, fetchVerseByKey } from '../../../services/quranApi';
import { VerseCard } from '../../../components/quran/VerseCard';
import MushafView from '../../../components/quran/MushafView';
import { BottomAudioPlayer, DEFAULT_RECITER, Reciter } from '../../../components/quran/BottomAudioPlayer';
import { TafsirModal } from '../../../components/quran/TafsirModal';
import { TranslationPickerModal } from '../../../components/quran/TranslationPickerModal';
import { JUZ_DATA, Juz } from '../../../data/juzs';
import { usePreferences } from '../../../hooks/usePreferences';

// ─── Full chapter list ────────────────────────────────────────────────────────
interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  translated_name?: { name: string };
  pages?: number[];
}

// ── Tajweed result helpers ─────────────────────────────────────────────────
/** Returns a color for a Tajweed flag type */
function flagColor(flag: string): string {
  switch (flag) {
    case 'madd_omitted':   return '#F59E0B'; // amber — long vowel shortened
    case 'madd_added':     return '#8B5CF6'; // violet — unnecessary lengthening
    case 'wrong_phoneme':  return '#EF4444'; // red — substitution
    case 'missing_phoneme': return '#F97316'; // orange — dropped
    case 'extra_phoneme':  return '#6366F1'; // indigo — insertion
    default:               return '#10B981'; // green — correct
  }
}

/** Returns a score-adaptive color for the accuracy circle */
function colours(score: number): string {
  if (score >= 90) return '#10B981'; // green
  if (score >= 70) return '#F59E0B'; // amber
  return '#EF4444'; // red
}

export default function ReaderScreen() {
  // circleId is set when entering the reader from a group goal
  const [activeCircleId, setActiveCircleId] = useState<string | null>(null);
  const { position, loading: progressLoading, saveProgress } = useReadingProgress(activeCircleId);
  // Keep a ref so viewable-items callback never reads stale position
  const positionRef = React.useRef(position);
  useEffect(() => { positionRef.current = position; }, [position]);
  const { hifzData, markDifficult } = useHifz();
  const { 
    playAudio, 
    playPlaylist, 
    currentTrackIndex, 
    togglePlayback, 
    stopAudio, 
    isPlaying, 
    isLoading: audioLoading,
    selectedReciter: currentReciter,
    setSelectedReciter: setCurrentReciter,
    positionMillis,
    durationMillis,
    seekTo,
  } = useAudioPlayer();
  const { audioPlaybackMode } = usePreferences();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const { circle_id, surah: surahParam, ayah: ayahParam, mushaf: mushafParam, page: pageParam } = useLocalSearchParams<{ circle_id?: string; surah?: string; ayah?: string; mushaf?: string; page?: string }>();

  const [currentSurah, setCurrentSurah] = useState(1);
  const [liveReaders, setLiveReaders] = useState<Record<string, any>>({});
  const [verses, setVerses] = useState<any[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const currentChapter = chapters.find((c) => c.id === currentSurah) ?? null;
  const [loading, setLoading] = useState(true);
  
  // Settings — sourced from shared store so browse and reader stay in sync
  const settings = useReaderSettings();
  const showTranslation = settings.showTranslation;
  const showTransliteration = settings.showTransliteration;
  const showWordByWord = settings.showWordByWord;
  const showTajweed = settings.showTajweed;
  const isHifzMode = settings.isHifzMode;
  const selectedTranslationId = settings.selectedTranslationId;
  
  // Modals
  const [showSurahPicker, setShowSurahPicker] = useState(false);
  const [showListenerModal, setShowListenerModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTranslationPicker, setShowTranslationPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'surah' | 'juz'>('surah');
  const [targetPageOverride, setTargetPageOverride] = useState<number | null>(null);
  const mushafInitialPageRef = useRef<number | null>(null);
  const [tafsirVerseKey, setTafsirVerseKey] = useState<string | null>(null);
  const [tafsirArabic, setTafsirArabic] = useState('');
  const [tafsirTranslation, setTafsirTranslation] = useState('');
  
  const [listenerMode, setListenerMode] = useState<'fluency'|'tahfidh'>('fluency');
  // viewMode is stored in shared settings; derive a local setter that writes through
  const viewMode = settings.viewMode;
  const setViewMode = (v: 'list' | 'mushaf') => setReaderSettings({ viewMode: v });
  const setIsHifzMode = (v: boolean) => setReaderSettings({ isHifzMode: v });
  const setSelectedTranslationId = (v: number) => setReaderSettings({ selectedTranslationId: v });
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const immersiveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(immersiveAnim, {
      toValue: isImmersiveMode ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isImmersiveMode, immersiveAnim]);

  // Hifz Mode State
  const [hifzMistakes, setHifzMistakes] = useState<Set<string>>(new Set());
  const [unblurredVerses, setUnblurredVerses] = useState<Set<string>>(new Set());

  // Fetch mistakes on mount
  useEffect(() => {
    supabase.from('hifz_mistakes').select('surah, ayah').eq('status', 'struggling')
      .then(({ data, error }) => {
        if (data && !error) {
          const m = new Set(data.map((d: any) => `${d.surah}:${d.ayah}`));
          setHifzMistakes(m);
        }
      });
  }, []);

  const handleUnblurVerse = useCallback((verseKey: string) => {
    setUnblurredVerses(prev => {
      const next = new Set(prev);
      next.add(verseKey);
      return next;
    });

    // 1) Log the mistake if it's the first time
    if (!hifzMistakes.has(verseKey)) {
      const parts = verseKey.split(':');
      if (parts.length === 2) {
        supabase.rpc('log_hifz_mistake', {
          p_surah: parseInt(parts[0], 10),
          p_ayah: parseInt(parts[1], 10),
          p_status: 'struggling'
        }).then(({ error }) => {
          if (!error) {
            setHifzMistakes(prev => {
              const next = new Set(prev);
              next.add(verseKey);
              return next;
            });
            
            // 2) Post to My Goals chat feed with real ayah text
            const verse = verses.find(v => v.verse_key === verseKey);
            const ayahText = verse?.text_uthmani || `Ayah ${verseKey}`;
            
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (user) {
                supabase.from('personal_journal').insert({
                  user_id: user.id,
                  type: 'hifz_struggle',
                  content: `Struggled with ${currentChapter?.name_simple} ${verseKey}:\n\n${ayahText}`,
                }).then();
              }
            });
          }
        });
      }
    }
  }, [hifzMistakes, verses, currentChapter]);

  const handleMarkMemorized = useCallback((verseKey: string) => {
    const parts = verseKey.split(':');
    if (parts.length === 2) {
      supabase.rpc('log_hifz_mistake', {
        p_surah: parseInt(parts[0], 10),
        p_ayah: parseInt(parts[1], 10),
        p_status: 'memorized'
      }).then(({ error }) => {
        if (!error) {
          setHifzMistakes(prev => {
            const next = new Set(prev);
            next.delete(verseKey);
            return next;
          });
        }
      });
    }
  }, []);
  
  const { 
    isRecording, 
    isAnalyzing, 
    analysisResult, 
    startRecording, 
    stopRecordingAndAnalyze, 
    cancelRecording,
    setAnalysisResult
  } = useAudioRecorder();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const pendingScrollAyah = useRef<number | null>(null);

  // Load all chapters once
  useEffect(() => {
    fetchChapters('en').then((data) => {
      if (data?.chapters) setChapters(data.chapters);
    });
  }, []);

  // On every focus: consume any pending surah request from browse/home.
  // Falls back to reading progress ONCE on first mount.
  const hasLoadedFromProgress = useRef(false);
  useFocusEffect(
    useCallback(() => {
      const request = consumeReaderRequest();
      if (request) {
        // Reset the initial page ref to force recalculation for the new request
        mushafInitialPageRef.current = null;
        setTargetPageOverride(null);
        
        // If this request has a circleId, we're in group reading mode
        setActiveCircleId(request.circleId ?? null);
        setCurrentSurah(request.surah);
        if (request.ayah) {
          pendingScrollAyah.current = request.ayah;
          const targetAyah = request.ayah;
          const targetSurah = request.surah;
          
          if (viewMode === 'list') {
            const targetPage = Math.max(1, Math.ceil(targetAyah / 20));
            if (targetSurah === currentSurah) {
              setPage(targetPage);
              setVerses([]);
              setHasMore(true);
              loadVerses(targetSurah, targetPage, true, selectedTranslationId);
            }
          } else {
            // Mushaf mode - need to find which Quran page the ayah is on
            fetchVerseByKey(`${targetSurah}:${targetAyah}`).then(res => {
              if (res?.verse?.page_number) {
                setTargetPageOverride(res.verse.page_number);
                setMushafFirstVerseKey(null);
                pendingScrollAyah.current = null; // consumed
              }
            });
          }
          
          // Set temporary highlight
          const startKey = `${request.surah}:${request.ayah}`;
          setJuzHighlightKey(startKey);
          setTimeout(() => setJuzHighlightKey(null), 3000);
        } else if (viewMode === 'mushaf') {
          // Navigated to a Surah without a specific Ayah (e.g., from browse)
          fetchVerseByKey(`${request.surah}:1`).then(res => {
            if (res?.verse?.page_number) {
              setTargetPageOverride(res.verse.page_number);
              setMushafFirstVerseKey(null);
            }
          });
        }
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        hasLoadedFromProgress.current = true;
      } else if (!hasLoadedFromProgress.current && !progressLoading) {
        setCurrentSurah(position?.surahNumber ?? 1);
        hasLoadedFromProgress.current = true;
      }
    }, [progressLoading, position?.surahNumber])
  );

  // Once progress loads, set surah if no request was consumed yet
  useEffect(() => {
    if (progressLoading || hasLoadedFromProgress.current) return;
    const request = consumeReaderRequest();
    if (request) {
      mushafInitialPageRef.current = null;
      setTargetPageOverride(null);
      setActiveCircleId(request.circleId ?? null);
      setCurrentSurah(request.surah);
      if (request.ayah) {
        pendingScrollAyah.current = request.ayah;
        if (viewMode === 'mushaf') {
          fetchVerseByKey(`${request.surah}:${request.ayah}`).then(res => {
            if (res?.verse?.page_number) {
              setTargetPageOverride(res.verse.page_number);
              setMushafFirstVerseKey(null);
              pendingScrollAyah.current = null;
            }
          });
        }
      } else if (viewMode === 'mushaf') {
        fetchVerseByKey(`${request.surah}:1`).then(res => {
          if (res?.verse?.page_number) {
            setTargetPageOverride(res.verse.page_number);
            setMushafFirstVerseKey(null);
          }
        });
      }
    } else {
      // In circle mode, position was loaded from circle_members; use it
      setCurrentSurah(position?.surahNumber ?? 1);
      if (position?.ayahNumber && position.ayahNumber > 1) {
        pendingScrollAyah.current = position.ayahNumber;
      }
    }
    hasLoadedFromProgress.current = true;
  }, [progressLoading]);

  // Live Sync Subscription
  useEffect(() => {
    if (!circle_id) return;
    
    // Fetch initial live sessions
    supabase.from('live_reading_sessions').select('user_id, current_surah, current_ayah, users(display_name)')
      .eq('circle_id', circle_id).eq('is_active', true)
      .then(({ data }) => {
        if (data) {
          const map: any = {};
          data.forEach(d => { 
            const userObj = Array.isArray(d.users) ? d.users[0] : d.users;
            map[d.user_id] = { surah: d.current_surah, ayah: d.current_ayah, name: (userObj as any)?.display_name }; 
          });
          setLiveReaders(map);
        }
      });

    // Realtime updates
    const sub = supabase.channel(`live_sync_${circle_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_reading_sessions', filter: `circle_id=eq.${circle_id}` }, (payload: any) => {
        const newRecord = payload.new;
        if (!newRecord) return;
        
        setLiveReaders(prev => {
          if (!newRecord.is_active) {
            const next = { ...prev };
            delete next[newRecord.user_id];
            return next;
          }
          return { ...prev, [newRecord.user_id]: { surah: newRecord.current_surah, ayah: newRecord.current_ayah, name: prev[newRecord.user_id]?.name || 'Member' } };
        });
      }).subscribe();
      
    return () => {
      supabase.removeChannel(sub);
      // Mark self as inactive on unmount
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) supabase.from('live_reading_sessions').update({ is_active: false }).match({ circle_id, user_id: user.id }).then();
      });
    };
  }, [circle_id]);

  useEffect(() => {
    if (!currentSurah) return;
    
    // Skip reloading the verse list while browsing pages in Mushaf mode
    if (viewMode === 'mushaf') {
      setLoading(false);
      return;
    }
    
    // Determine the page if an Ayah jump is pending (default 20 verses per page)
    const targetAyah = pendingScrollAyah.current;
    const targetPage = targetAyah ? Math.max(1, Math.ceil(targetAyah / 20)) : 1;
    
    setPage(targetPage);
    setVerses([]);
    setHasMore(true);
    loadVerses(currentSurah, targetPage, true, selectedTranslationId);
  }, [currentSurah, chapters, selectedTranslationId]);

  // When the user exits Mushaf mode, reload the verse list for whatever surah
  // was last active — currentSurah may not have changed so the above effect
  // won't re-fire on its own.
  const prevViewMode = useRef(viewMode);
  useEffect(() => {
    if (prevViewMode.current === 'mushaf' && viewMode === 'list') {
      // Coming back from Mushaf → load verses starting from the last read position
      const cur = positionRef.current;
      const targetAyah = cur?.ayahNumber ?? 1;
      const targetPage = Math.max(1, Math.ceil(targetAyah / 20));
      
      setPage(targetPage);
      setVerses([]);
      setHasMore(true);
      loadVerses(currentSurah, targetPage, true, selectedTranslationId);
    } else if (prevViewMode.current === 'list' && viewMode === 'mushaf') {
      // Sync Mushaf view to the exact page we were looking at in list mode
      const cur = positionRef.current;
      if (cur?.surahNumber === currentSurah && cur?.ayahNumber) {
        fetchVerseByKey(`${cur.surahNumber}:${cur.ayahNumber}`).then(res => {
          if (res?.verse?.page_number) {
            setTargetPageOverride(res.verse.page_number);
          }
        });
      }
    }
    prevViewMode.current = viewMode;
  }, [viewMode]);

  const loadVerses = async (surahNum: number, pageNum: number, reset = false, translationId = 85) => {
    try {
      setLoading(pageNum === 1);
      const res = await fetchVersesByChapter(surahNum, {
        page: pageNum,
        perPage: 20,
        words: true,
        translations: [translationId],
      });
      if (res?.verses) {
        if (reset) {
          setVerses(res.verses);
          // Scroll to pending ayah after verses render
          const targetAyah = pendingScrollAyah.current;
          if (targetAyah && targetAyah > 1) {
            pendingScrollAyah.current = null; // consume
            setTimeout(() => {
              const idx = res.verses.findIndex((v: any) => {
                const parts = v.verse_key?.split(':');
                return parts && parseInt(parts[1], 10) === targetAyah;
              });
              if (idx >= 0) {
                flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.2 });
              }
            }, 600);
          }
        } else {
          setVerses((prev) => [...prev, ...res.verses]);
        }
        setHasMore(pageNum < (res.pagination?.total_pages ?? 1));
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };


  const [chapterAudioLoading, setChapterAudioLoading] = useState(false);
  const [chapterAudioUrl, setChapterAudioUrl] = useState<string[] | null>(null);
  // Track WHICH surah the loaded audio URLs belong to — prevents playing the
  // wrong chapter's audio when the Mushaf scrolls to a new surah before the
  // new audio has finished loading.
  const loadedAudioSurahRef = useRef<number>(0);
  const [mushafFirstVerseKey, setMushafFirstVerseKey] = useState<string | null>(null);
  const [juzHighlightKey, setJuzHighlightKey] = useState<string | null>(null);

  const [offlineSegments, setOfflineSegments] = useState<any>(null);
  const loadedSegmentsReciterRef = useRef<string | null>(null);

  let calculatedActiveVerseKey = null;
  if (isPlaying && currentTrackIndex >= 0) {
    if (offlineSegments && chapterAudioUrl && chapterAudioUrl.length === 1) {
      // Find the active ayah based on positionMillis
      const activeVerse = verses.find(v => {
        const seg = offlineSegments[v.verse_key];
        if (seg) {
          return positionMillis >= seg.timestamp_from && positionMillis <= seg.timestamp_to;
        }
        return false;
      });
      if (activeVerse) {
        calculatedActiveVerseKey = activeVerse.verse_key;
      }
    } else if (verses[currentTrackIndex]) {
      calculatedActiveVerseKey = verses[currentTrackIndex].verse_key;
    }
  }

  // The verse key of the currently playing track — used to highlight in both list and Mushaf views
  const activeVerseKey: string | null = juzHighlightKey || calculatedActiveVerseKey;

  const loadAudio = async (surahNum: number, reciterId: number | string): Promise<string[] | null> => {
    try {
      setChapterAudioLoading(true);
      stopAudio();
      
      let urls: string[] | null = null;
      
      // Check for locally downloaded chapter file first
      const localUri = getLocalFileUri(surahNum, reciterId);
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        urls = [localUri];
      } else if (audioPlaybackMode === 'offline') {
        Alert.alert('Offline Mode', 'This audio is not downloaded. Please download it from the Audio Manager or switch to Stream mode.');
        return null;
      } else if (reciterId === 'mq.swahili_barwani') {
        const swahiliUrl = getSwahiliAudioUrl(surahNum);
        if (swahiliUrl) urls = [swahiliUrl];
      } else if (currentReciter.isChapterOnly && currentReciter.quranicAudioPath) {
        const paddedSurah = String(surahNum).padStart(3, '0');
        urls = [`https://download.quranicaudio.com/quran/${currentReciter.quranicAudioPath}/${paddedSurah}.mp3`];
      } else {
        const res = await fetchVerseRecitationsByChapter(surahNum, reciterId);
        if (res?.audio_files?.length > 0) {
          urls = res.audio_files.map((file: any) => {
            if (file.url.startsWith('http')) return file.url;
            if (file.url.startsWith('//')) return `https:${file.url}`;
            return `https://verses.quran.com/${file.url}`;
          });
        }
      }

      if (urls) {
        loadedAudioSurahRef.current = surahNum;
        
        // Fetch segments for full-surah audio if available
        if (urls.length === 1 && currentReciter && reciterId !== 'mq.swahili_barwani') {
          if (loadedSegmentsReciterRef.current !== currentReciter.id) {
            fetch(`https://pub-33f8115fd19a4e27a68740a321f72e2d.r2.dev/offline_reciters/${currentReciter.id}/segments.json`)
              .then(r => r.json())
              .then(data => {
                setOfflineSegments(data);
                loadedSegmentsReciterRef.current = String(currentReciter.id);
              })
              .catch(e => {
                setOfflineSegments(null);
              });
          }
        } else {
          setOfflineSegments(null);
          loadedSegmentsReciterRef.current = null;
        }
        
        return urls;
      }
    } catch (err) {
    } finally {
      setChapterAudioLoading(false);
    }
    return null;
  };

  useEffect(() => {
    if (!currentSurah) return;
    loadAudio(currentSurah, currentReciter.id).then((url) => setChapterAudioUrl(url));
  }, [currentSurah, currentReciter.id]);



  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      togglePlayback();
    } else if (chapterAudioUrl && chapterAudioUrl.length > 0) {
      let startIndex = 0;

      if (viewMode === 'mushaf') {
        // Prefer the live page-scroll key; fall back to saved progress ayah
        const verseKey = mushafFirstVerseKey || (position?.ayahNumber ? `${currentSurah}:${position.ayahNumber}` : null);
        if (verseKey) {
          const parts = verseKey.split(':');
          if (parts.length === 2) {
            startIndex = Math.max(0, parseInt(parts[1], 10) - 1);
          }
        }
      } else {
        // List mode: start from the first verse currently loaded in the list
        if (verses.length > 0 && verses[0]?.verse_key) {
          const parts = verses[0].verse_key.split(':');
          if (parts.length === 2) {
            startIndex = Math.max(0, parseInt(parts[1], 10) - 1);
          }
        }
      }

      playPlaylist(chapterAudioUrl, Math.min(startIndex, chapterAudioUrl.length - 1));
    }
  }, [isPlaying, chapterAudioUrl, togglePlayback, playPlaylist, viewMode, mushafFirstVerseKey, position?.ayahNumber, currentSurah, verses]);

  useEffect(() => {
    // Derive the ayah number from the active verse key e.g. "2:255" → 255
    const ayahNumber = activeVerseKey ? parseInt(activeVerseKey.split(':')[1], 10) : null;
    updateAudioState({
      isPlaying,
      surahName: currentChapter?.name_simple ?? null,
      surah: currentSurah,
      ayah: ayahNumber,
      reciter: currentReciter,
      togglePlayback: handleTogglePlay,
    });
  }, [isPlaying, currentChapter?.name_simple, currentSurah, activeVerseKey, currentReciter, handleTogglePlay]);


  const handleSurahSelect = (surahId: number) => {
    setShowSurahPicker(false);
    setMushafFirstVerseKey(null);
    const selectedChapter = chapters.find(c => c.id === surahId);
    if (selectedChapter && selectedChapter.pages?.length) {
      setTargetPageOverride(selectedChapter.pages[0]);
    } else {
      setTargetPageOverride(null);
    }
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    if (surahId !== currentSurah) {
      setCurrentSurah(surahId);
      // useEffect on currentSurah will handle verse reload
    } else {
      // Same surah but state won't change — force reload manually
      setPage(1);
      setVerses([]);
      setHasMore(true);
      loadVerses(surahId, 1, true, selectedTranslationId);
    }
  };

  const handleJuzSelect = (juz: Juz) => {
    setShowSurahPicker(false);
    setMushafFirstVerseKey(null);
    setTargetPageOverride(juz.startingPage);
    
    // Set highlight key for the starting ayah — auto-clears after 3s
    const startKey = `${juz.startingSurah}:${juz.startingAyah}`;
    setJuzHighlightKey(startKey);
    setTimeout(() => setJuzHighlightKey(null), 3000);
    
    // For list mode scrolling
    pendingScrollAyah.current = juz.startingAyah;
    
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    if (juz.startingSurah !== currentSurah) {
      setCurrentSurah(juz.startingSurah);
    } else {
      setPage(1);
      setVerses([]);
      setHasMore(true);
      loadVerses(juz.startingSurah, 1, true, selectedTranslationId);
    }
  };


  useEffect(() => {
    if (isPlaying && currentTrackIndex >= 0) {
      // Auto-fetch next page if playing audio nears the end of currently loaded verses
      if (currentTrackIndex >= verses.length - 2 && hasMore && !loading) {
        loadMore();
      }
      
      if (flatListRef.current && currentTrackIndex < verses.length) {
        try {
          flatListRef.current.scrollToIndex({ index: currentTrackIndex, animated: true, viewPosition: 0.3 });
        } catch (e) {
          // ignore scroll errors during load
        }
      }
    }
  }, [currentTrackIndex, isPlaying, verses.length, hasMore, loading]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadVerses(currentSurah, nextPage);
    }
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (!viewableItems?.length) return;
    const lastItem = viewableItems[viewableItems.length - 1].item;
    const parts = lastItem?.verse_key?.split(':');
    if (parts?.length === 2) {
      const surah = parseInt(parts[0], 10);
      const ayah = parseInt(parts[1], 10);
      const cur = positionRef.current;
      // Save whenever surah changes OR ayah advances within the same surah
      const isNewSurah = surah !== cur?.surahNumber;
      const isForwardInSurah = surah === cur?.surahNumber && ayah > (cur?.ayahNumber ?? 0);
      if (isNewSurah || isForwardInSurah) {
        saveProgress(surah, ayah);
      }
      
      // Update Live Sync
      if (circle_id) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from('live_reading_sessions').upsert({
              circle_id: circle_id as string,
              user_id: user.id,
              current_surah: surah,
              current_ayah: ayah,
              is_active: true,
              last_ping_at: new Date().toISOString(),
            }).then();
          }
        });
      }
    }
  }, [saveProgress, circle_id]);



  if (progressLoading || (loading && page === 1 && verses.length === 0)) {
    return (
      <AppBackground>
        <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.surahTitle, { marginTop: 12, fontSize: 14, color: colors.textSecondary }]}>
            Loading Surah…
          </Text>
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground solid={viewMode === 'mushaf'} solidColor={isDark ? '#000000' : '#FAFAF7'}>
      <View style={styles.safeAreaWrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ─── Floating Top Nav ─── */}
      <Animated.View style={[
        styles.header, 
        { 
          top: insets.top,
          opacity: immersiveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [{ translateY: immersiveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -100] }) }],
          pointerEvents: isImmersiveMode ? 'none' : 'auto'
        }
      ]}>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <TouchableOpacity style={styles.glassIconBtn} onPress={() => router.push('/(tabs)/reader/browse')}>
            <BlurView intensity={20} tint="light" style={styles.glassBg} />
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        {viewMode === 'mushaf' ? (
          <View style={{ flex: 2 }} />
        ) : (
          <TouchableOpacity style={[styles.headerCenter, { flex: 2 }]} onPress={() => setShowSurahPicker(true)}>
            <Text style={[styles.headerTitle, { color: colors.text, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }]} numberOfLines={1}>
              {currentChapter?.name_simple ?? 'Quran'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: Fonts.sans, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }} numberOfLines={1}>
              {currentChapter?.translated_name?.name ?? ''}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
          <TouchableOpacity style={styles.glassIconBtn} onPress={() => router.push('/(tabs)/reader/search')}>
            <BlurView intensity={20} tint="light" style={styles.glassBg} />
            <Search size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.glassIconBtn} onPress={() => setShowListenerModal(true)}>
            <BlurView intensity={20} tint="light" style={styles.glassBg} />
            <Mic size={20} color={isRecording ? colors.primary : colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.glassIconBtn} onPress={() => setShowSettingsModal(true)}>
            <BlurView intensity={20} tint="light" style={styles.glassBg} />
            <MoreHorizontal size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {viewMode === 'mushaf' ? (
        (() => {
          if (mushafInitialPageRef.current === null && currentChapter) {
            mushafInitialPageRef.current = pageParam ? parseInt(pageParam, 10) : (currentChapter.pages?.[0] ?? 1);
          }
          const computedInitialPage = targetPageOverride ?? mushafInitialPageRef.current ?? 1;
          return (
            <MushafView
              initialPage={computedInitialPage}
              onClose={() => setShowSurahPicker(true)}
              chapters={chapters}
              onToggleImmersive={() => setIsImmersiveMode(prev => !prev)}
              onChapterChange={(chapterId) => setCurrentSurah(chapterId)}
              onPageChange={(pageNum, firstVerseKey) => {
            setTargetPageOverride(pageNum); // Track the current page as user swipes
            setMushafFirstVerseKey(firstVerseKey);
            // Auto-save progress as user browses pages
            if (firstVerseKey) {
              const parts = firstVerseKey.split(':');
              if (parts.length === 2) {
                const surah = parseInt(parts[0], 10);
                const ayah = parseInt(parts[1], 10);
                saveProgress(surah, ayah);
              }
            }
          }}
          activeVerseKey={activeVerseKey}
          onSaveProgress={(verseKey) => {
            // User explicitly tapped "Save" on an ayah — pin it as last read
            const parts = verseKey.split(':');
            if (parts.length === 2) {
              saveProgress(parseInt(parts[0], 10), parseInt(parts[1], 10));
            }
          }}
          showTajweed={showTajweed}
          onPlayAyah={async (verseKey) => {
            const parts = verseKey.split(':');
            if (parts.length !== 2) return;
            const surahNum = parseInt(parts[0], 10);
            const ayahNum = parseInt(parts[1], 10);
            const ayahIndex = Math.max(0, ayahNum - 1);

            // Load audio if needed or if switching surahs
            let urls = chapterAudioUrl;
            if (!urls || loadedAudioSurahRef.current !== surahNum) {
              urls = await loadAudio(surahNum, currentReciter.id);
              if (urls) setChapterAudioUrl(urls);
            }

            if (!urls || urls.length === 0) {
              return;
            }

            if (urls.length === 1) {
              // Chapter-only reciter: load the file then seek to the right timestamp
              playPlaylist(urls, 0);
              // Wait briefly for player to load, then seek if we have segment data
              setTimeout(() => {
                if (offlineSegments && offlineSegments[verseKey]) {
                  const seg = offlineSegments[verseKey];
                  seekTo(seg.timestamp_from / 1000);
                } else if (ayahIndex > 0) {
                  // Rough estimate: assume uniform ayah distribution across duration
                  const roughSeek = (durationMillis / 1000) * (ayahIndex / Math.max(urls!.length, 1));
                  if (roughSeek > 0) seekTo(roughSeek);
                }
              }, 600);
            } else {
              // Per-ayah reciter: jump directly to the right track
              playPlaylist(urls, Math.min(ayahIndex, urls.length - 1));
            }
          }}
          onOpenTafsir={(key, arabic, translation) => {
            setTafsirVerseKey(key);
            setTafsirArabic(arabic);
            setTafsirTranslation(translation);
          }}
          onMarkDifficult={(key, sName, aText) => markDifficult(key, sName, aText)}
          isHifzMode={isHifzMode}
          hifzMistakes={hifzMistakes}
          unblurredVerses={unblurredVerses}
          onUnblurVerse={handleUnblurVerse}
          onMarkMemorized={handleMarkMemorized}
        />
          );
        })()
      ) : (
        <>
          {/* ─── Golden Hero Card ─── */}
          {currentChapter && (
            <View style={styles.heroCard}>
              <Image 
                source={require('../../../../assets/images/mosque_pastel_bg.jpg')} 
                style={StyleSheet.absoluteFill} 
              />
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
                <View style={styles.heroInner}>
                  <Text style={styles.heroSurahName}>{currentChapter.name_simple}</Text>
                  <Text style={styles.heroSurahMeta}>
                    {currentChapter.translated_name?.name ?? 'The Opener'} • {currentChapter.verses_count} Ayahs
                  </Text>
                  
                  {/* Bismillah (Only show for Surahs other than 9, but usually standard in headers) */}
                  {currentSurah !== 9 && (
                    <Text style={styles.heroBismillah}>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</Text>
                  )}
                </View>
              </BlurView>
            </View>
          )}

          {/* ─── Verse List ─── */}
          <FlatList
            ref={flatListRef}
            data={verses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => {
              const parts = item.verse_key?.split(':');
              const isLiveActive = Object.values(liveReaders).some(r => r.surah === parseInt(parts[0]) && r.ayah === parseInt(parts[1]));
              const liveNames = Object.values(liveReaders).filter(r => r.surah === parseInt(parts[0]) && r.ayah === parseInt(parts[1])).map(r => r.name);
              
              return (
                <View>
                  {isLiveActive && circle_id && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginLeft: 16, marginBottom: -10, zIndex: 10 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', marginRight: 6 }} />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{liveNames.join(', ')}</Text>
                    </View>
                  )}
                  {index === 0 && currentSurah !== 1 && currentSurah !== 9 && (
                    <Text style={[styles.listBismillah, { color: colors.text }]}>
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                    </Text>
                  )}
                  <VerseCard
                    verse={item}
                    hifzStatus={hifzData[item.verse_key]?.status}
                    onMarkDifficult={() => {
                      const sName = chapters.find(s => s.id === item.surah_number)?.name_simple;
                      markDifficult(item.verse_key, sName, item.text_uthmani);
                    }}
                    onOpenTafsir={(key, arabic, translation) => {
                      setTafsirVerseKey(key);
                      setTafsirArabic(arabic);
                      setTafsirTranslation(translation);
                    }}
                    showTranslation={showTranslation}
                    showTransliteration={showTransliteration}
                    showWordByWord={showWordByWord}
                    showTajweed={showTajweed}
                    isPlaying={(isPlaying && currentTrackIndex === index) || item.verse_key === juzHighlightKey}
                    onPlayAyah={() => {
                      if (isPlaying && currentTrackIndex === index) {
                        // Already playing this ayah — pause
                        togglePlayback();
                      } else if (chapterAudioUrl && loadedAudioSurahRef.current === currentSurah) {
                        // Use the ayah number from verse_key as the audio index (1-based → 0-based)
                        // This is robust against paginated verse arrays where `index` could be wrong
                        const vk = item.verse_key?.split(':');
                        const ayahIdx = vk?.length === 2 ? Math.max(0, parseInt(vk[1], 10) - 1) : index;
                        playPlaylist(chapterAudioUrl, Math.min(ayahIdx, chapterAudioUrl.length - 1));
                      }
                    }}
                    isBlurred={isHifzMode && !unblurredVerses.has(item.verse_key)}
                    isHighlighted={hifzMistakes.has(item.verse_key)}
                    onUnblur={() => handleUnblurVerse(item.verse_key)}
                    onMarkMemorized={() => handleMarkMemorized(item.verse_key)}
                  />
                </View>
              );
            }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            onScrollEndDrag={(e) => {
              if (loading || hasMore) return;
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              const overscroll = contentOffset.y + layoutMeasurement.height - contentSize.height;
              // If user pulled up past the bottom by 60px, advance to next Surah
              if (overscroll > 60 && currentSurah < 114) {
                setCurrentSurah(currentSurah + 1);
                flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
              }
            }}
            onViewableItemsChanged={onViewableItemsChanged}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                if (flatListRef.current && info.index < verses.length) {
                  flatListRef.current.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 });
                }
              });
            }}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 160 }}
            ListFooterComponent={
              loading && page > 1 ? (
                <ActivityIndicator style={{ margin: 20 }} color={colors.primary} />
              ) : !loading && !hasMore && currentSurah < 114 && verses.length > 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40, opacity: 0.6 }}>
                  <ChevronUp size={24} color={colors.textTertiary} style={{ marginBottom: 4 }} />
                  <Text style={{ fontFamily: Fonts.sansMedium, color: colors.textTertiary, fontSize: 13 }}>
                    Pull up for Surah {currentSurah + 1}
                  </Text>
                </View>
              ) : null
            }
          />
        </>
      )}

      {/* ─── Display Settings Modal (shared with Browse screen) ─── */}
      <ReaderSettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        colors={colors}
        onMushafEnabled={() => setShowSettingsModal(false)}
        onHifzEnabled={() => {
          setUnblurredVerses(new Set());
          setShowSettingsModal(false);
        }}
        onTranslationChange={(id) => {
          setPage(1); setVerses([]); setHasMore(true);
          loadVerses(currentSurah, 1, true, id);
        }}
      />

      {/* ─── Digital Listener Modal ─── */}
      <Modal visible={showListenerModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.listenerContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Digital Listener</Text>
              <TouchableOpacity onPress={() => { setShowListenerModal(false); cancelRecording(); }}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Mode selection */}
            {!isRecording && !isAnalyzing && !analysisResult && (
              <View style={styles.listenerModes}>
                <TouchableOpacity 
                  style={[styles.modeBtn, listenerMode === 'fluency' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setListenerMode('fluency')}
                >
                  <Text style={[styles.modeTitle, listenerMode === 'fluency' && { color: colors.primary }]}>Fluency</Text>
                  <Text style={styles.modeSub}>Pronunciation & Tajweed check</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modeBtn, listenerMode === 'tahfidh' && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => setListenerMode('tahfidh')}
                >
                  <Text style={[styles.modeTitle, listenerMode === 'tahfidh' && { color: colors.primary }]}>Tahfidh Test</Text>
                  <Text style={styles.modeSub}>Recite from memory, catch skips</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Status / Results */}
            {isAnalyzing && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 12, color: colors.textSecondary, fontWeight: '600' }}>AI is analyzing your recitation...</Text>
              </View>
            )}

            {analysisResult && (
              <View style={styles.analysisResult}>
                {/* Detected ayah */}
                {analysisResult.verseKey ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
                    Detected: Ayah {analysisResult.verseKey}
                  </Text>
                ) : null}

                {/* Score circle */}
                <View style={[styles.scoreCircle, { borderColor: colours(analysisResult.score), backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.scoreText, { color: colours(analysisResult.score) }]}>{analysisResult.score ?? 100}%</Text>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>Phoneme Accuracy</Text>
                </View>

                {/* Deviations */}
                {analysisResult.deviations?.length > 0 ? (
                  <View style={{ marginTop: 16 }}>
                    <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 8 }}>Tajweed Feedback</Text>
                    {analysisResult.deviations.map((d: any, i: number) => (
                      <View key={i} style={[
                        styles.deviationRow,
                        { borderLeftColor: flagColor(d.flag), backgroundColor: colors.surface }
                      ]}>
                        <Text style={{ color: flagColor(d.flag), fontWeight: '700', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 }}>
                          {d.flag?.replace(/_/g, ' ')}
                        </Text>
                        <Text style={{ color: colors.text, fontSize: 13 }}>{d.label}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ marginTop: 16, color: colors.primary, fontWeight: '700', textAlign: 'center' }}>
                    Excellent recitation! Masha'Allah. ✓
                  </Text>
                )}
                <TouchableOpacity 
                  style={[{ alignSelf: 'center', marginTop: 24, backgroundColor: colors.primary, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20 }]}
                  onPress={() => setAnalysisResult(null)}
                >
                  <Text style={[{ color: '#fff', fontFamily: 'System', fontWeight: '700', fontSize: 15, paddingHorizontal: 12 }]}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Record Button */}
            {!isAnalyzing && !analysisResult && (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    style={[styles.recordBtn, { backgroundColor: isRecording ? '#E53935' : colors.primary }]}
                    onPress={() => {
                      if (isRecording) {
                        stopRecordingAndAnalyze(activeVerseKey || `${currentSurah}`);
                      } else {
                        startRecording();
                      }
                    }}
                  >
                    {isRecording ? <Square size={32} color="#fff" /> : <Mic size={32} color="#fff" />}
                  </TouchableOpacity>
                </Animated.View>
                <Text style={{ marginTop: 12, color: isRecording ? '#E53935' : colors.textSecondary, fontWeight: '600' }}>
                  {isRecording ? 'Tap to stop & analyze' : 'Tap to start recording'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── Surah/Juz Picker Modal ─── */}
      <Modal visible={showSurahPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                onPress={() => setPickerTab('surah')}
                style={[styles.pickerTab, pickerTab === 'surah' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.modalTitle, pickerTab === 'surah' ? { color: colors.text } : { color: colors.textSecondary }]}>Surahs</Text>
              </TouchableOpacity>
              <View style={{ width: 24 }} />
              <TouchableOpacity 
                onPress={() => setPickerTab('juz')}
                style={[styles.pickerTab, pickerTab === 'juz' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.modalTitle, pickerTab === 'juz' ? { color: colors.text } : { color: colors.textSecondary }]}>Juzs</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setShowSurahPicker(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {pickerTab === 'surah' ? (
              chapters.map((ch) => (
                <TouchableOpacity
                  key={ch.id}
                  style={[styles.surahRow, ch.id === currentSurah && { backgroundColor: colors.primaryLight }]}
                  onPress={() => handleSurahSelect(ch.id)}
                >
                  <View style={[styles.surahNumBadge, ch.id === currentSurah && { backgroundColor: colors.primary }]}>
                    <Text style={[styles.surahNumText, ch.id === currentSurah && { color: '#fff' }]}>
                      {ch.id}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.surahRowName, ch.id === currentSurah && { color: colors.primary }]}>
                      {ch.name_simple}
                    </Text>
                    <Text style={styles.surahRowVerse}>{ch.verses_count} verses</Text>
                  </View>
                  <Text style={styles.surahArabic}>{ch.name_arabic}</Text>
                </TouchableOpacity>
              ))
            ) : (
              JUZ_DATA.map((juz) => {
                const surah = chapters.find(c => c.id === juz.startingSurah);
                return (
                  <TouchableOpacity
                    key={juz.juzNumber}
                    style={styles.surahRow}
                    onPress={() => handleJuzSelect(juz)}
                  >
                    <View style={styles.surahNumBadge}>
                      <Text style={styles.surahNumText}>{juz.juzNumber}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.surahRowName}>Juz {juz.juzNumber}</Text>
                      <Text style={styles.surahRowVerse}>
                        Starts at {surah?.name_simple}, Ayah {juz.startingAyah}
                      </Text>
                    </View>
                    <Text style={styles.surahArabic}>جزء {juz.juzNumber}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>


      <BottomAudioPlayer
        isPlaying={isPlaying}
        isLoading={chapterAudioLoading || (isPlaying && audioLoading)}
        isImmersiveMode={isImmersiveMode}
        currentReciter={currentReciter}
        onTogglePlay={handleTogglePlay}
        onReciterChange={(r) => {
          if (isPlaying) stopAudio();
          setCurrentReciter(r);
        }}
        surahName={currentChapter?.name_simple ?? null}
        activeVerseKey={activeVerseKey}
      />

      {/* ─── Tafsir Bottom Sheet ─── */}
      <TafsirModal
        verseKey={tafsirVerseKey}
        arabicText={tafsirArabic}
        verseTranslation={tafsirTranslation}
        onClose={() => setTafsirVerseKey(null)}
      />

      <TranslationPickerModal
        visible={showTranslationPicker}
        onClose={() => setShowTranslationPicker(false)}
        selectedTranslationId={selectedTranslationId}
        onSelectTranslation={(id) => {
          setSelectedTranslationId(id);
          setShowTranslationPicker(false);
        }}
      />

      </SafeAreaView>
    </View>
    </AppBackground>
  );
}

const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors'], isDark: boolean) =>
  StyleSheet.create({
    safeAreaWrapper: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
    },
    navIconBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    glassIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    glassBg: {
      ...(StyleSheet.absoluteFill as any),
      backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontFamily: Fonts.display,
      fontSize: 20,
      letterSpacing: 0.5,
    },
    heroCard: {
      marginHorizontal: 20,
      marginVertical: 16,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
      overflow: 'hidden',
    },
    heroInner: {
      padding: 24,
      alignItems: 'center',
    },
    heroSurahName: {
      fontFamily: Fonts.display,
      fontSize: 28,
      color: '#ffffff',
      marginBottom: 4,
    },
    heroSurahMeta: {
      fontFamily: Fonts.sansMedium,
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: 24,
    },
    heroBismillah: {
      fontFamily: 'AmiriQuran',
      fontSize: 26,
      color: '#ffffff',
    },
    listBismillah: {
      fontFamily: 'AmiriQuran',
      fontSize: 26,
      textAlign: 'center',
      paddingVertical: 20,
      paddingHorizontal: 24,
      opacity: 0.85,
    },
    surahTitle: {
      fontFamily: Fonts.sansSemiBold,
      color: colors.text,
    },
    

    // Modals
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontFamily: Fonts.display,
      fontSize: 20,
      color: colors.text,
    },
    
    // Settings Modal
    settingsContent: {
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 24,
      paddingBottom: 48,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    settingLabel: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 16,
      marginBottom: 2,
    },
    settingSub: {
      fontFamily: Fonts.sans,
      fontSize: 12,
    },
    divider: {
      height: 1,
      width: '100%',
      marginVertical: 12,
    },
    
    // Listener Modal
    listenerContent: {
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 24,
      paddingBottom: 40,
    },
    listenerModes: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    modeBtn: {
      flex: 1,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    modeTitle: {
      fontFamily: Fonts.displayMedium,
      fontSize: 15,
      color: colors.text,
      marginBottom: 4,
    },
    modeSub: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: colors.textTertiary,
    },
    recordBtn: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#E53935',
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    recordBtnActive: {
      transform: [{ scale: 1.05 }],
    },
    analysisResult: {
      paddingVertical: 20,
    },
    scoreCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      borderWidth: 4,
    },
    scoreText: {
      fontFamily: Fonts.display,
      fontSize: 32,
    },
    deviationRow: {
      borderLeftWidth: 3,
      borderRadius: 8,
      padding: 10,
      marginBottom: 8,
    },

    // Surah Picker
    modal: {
      flex: 1,
      backgroundColor: colors.background,
    },
    pickerTab: {
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    surahRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      gap: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    surahNumBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.skeleton,
      alignItems: 'center',
      justifyContent: 'center',
    },
    surahNumText: {
      fontFamily: Fonts.sansMedium,
      fontSize: 13,
      color: colors.textSecondary,
    },
    surahRowName: {
      fontFamily: Fonts.displayMedium,
      fontSize: 16,
      color: colors.text,
    },
    surahRowVerse: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
    },
    surahArabic: {
      fontSize: 18,
      color: colors.textSecondary,
      fontFamily: 'AmiriQuran',
    },
  });
