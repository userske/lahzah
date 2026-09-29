import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { GlassBlur } from '../../../components/ui/GlassCard';
import * as Haptics from 'expo-haptics';
import { AlertCircle, BookOpen, Bookmark, CheckCircle2, Eye, Heart, MoreHorizontal, PauseCircle, PlayCircle, Share2 } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Fonts } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { usePreferences } from '../../hooks/usePreferences';

// Tajweed color mapping based on Quran.com class names
const TAJWEED_COLORS: Record<string, string> = {
  'ikhfa': '#9B59B6',
  'idgham': '#27AE60',
  'idgham_wo_ghunnah': '#27AE60',
  'idgham_mutajanisayn': '#27AE60',
  'idgham_mutaqaribayn': '#27AE60',
  'qalqalah': '#E67E22',
  'madd': '#2980B9',
  'madda_normal': '#2980B9',
  'madda_permissible': '#2980B9',
  'madda_necessary': '#2980B9',
  'madda_obligatory': '#2980B9',
  'ghunnah': '#E74C3C',
  'izhar': '#16A085',
  'iqlab': '#C0392B',
  'shaddah': '#8E44AD',
  'ham_wasl': '#95A5A6',
  'laam_shamsiyah': '#95A5A6',
  'silent': '#95A5A6',
};

const WBW_AUDIO_BASE = 'https://audio.qurancdn.com/';

interface VerseCardProps {
  verse: any;
  hifzStatus?: string;
  onMarkDifficult: () => void;
  onOpenTafsir?: (verseKey: string, arabicText: string, translation: string) => void;
  onPlayAyah?: (verseKey: string) => void;
  showTranslation: boolean;
  showTransliteration?: boolean;
  showWordByWord?: boolean;
  showTajweed?: boolean;
  isPlaying?: boolean;
  isBlurred?: boolean;
  isHighlighted?: boolean;
  onUnblur?: (verseKey: string) => void;
  onMarkMemorized?: (verseKey: string) => void;
}

export const VerseCard = ({
  verse,
  hifzStatus,
  onMarkDifficult,
  onOpenTafsir,
  onPlayAyah,
  showTranslation,
  showTransliteration = false,
  showWordByWord = false,
  showTajweed = false,
  isPlaying = false,
  isBlurred = false,
  isHighlighted = false,
  onUnblur,
  onMarkMemorized,
}: VerseCardProps) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  // Word-by-word audio player (independent from the main playlist player)
  const wbwPlayer = useAudioPlayer();
  const [playingWordIdx, setPlayingWordIdx] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { arabicFontSize, translationFontSize } = usePreferences();

  const cleanTranslation = useCallback((text: string) => {
    return text.replace(/<[^>]+>/g, '').replace(/\[.*?\]/g, '').trim();
  }, []);

  const words: any[] = verse.words ?? [];

  // Animate the playing highlight
  const highlightAnim = useRef(new Animated.Value(0)).current;

  const pulseHighlight = useCallback(() => {
    Animated.sequence([
      Animated.timing(highlightAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(highlightAnim, { toValue: 0.6, duration: 600, useNativeDriver: false }),
    ]).start();
  }, [highlightAnim]);

  const playWordAudio = useCallback(async (word: any, idx: number) => {
    if (!word.audio_url) return;
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      const url = word.audio_url.startsWith('http')
        ? word.audio_url
        : `${WBW_AUDIO_BASE}${word.audio_url}`;
      wbwPlayer.replace({ uri: url });
      wbwPlayer.play();
      setPlayingWordIdx(idx);
      pulseHighlight();
      // Reset after ~3s (enough for most words)
      setTimeout(() => setPlayingWordIdx(null), 3000);
    } catch (e) {
    }
  }, [wbwPlayer, pulseHighlight]);

  // Parse HTML-like tajweed string into React Text components
  const renderTajweed = useCallback((htmlStr: string) => {
    if (!htmlStr) return null;
    const regex = /<(?:tajweed|rule) class=([^>]+)>([^<]+)<\/(?:tajweed|rule)>/g;

    const elements = [];
    let lastIndex = 0;
    let match;
    let i = 0;

    while ((match = regex.exec(htmlStr)) !== null) {
      if (match.index > lastIndex) {
        elements.push(<Text key={`t_${i++}`}>{htmlStr.substring(lastIndex, match.index)}</Text>);
      }

      const className = match[1]?.replace(/['"]/g, '');
      const text = match[2];
      const color = TAJWEED_COLORS[className] || colors.text;

      elements.push(<Text key={`c_${i++}`} style={{ color }}>{text}</Text>);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < htmlStr.length) {
      const endText = htmlStr.substring(lastIndex).replace(/<span class=end>[^<]+<\/span>/g, '').trim();
      if (endText) {
        elements.push(<Text key={`t_${i++}`}>{endText}</Text>);
      }
    }

    return elements;
  }, [colors.text]);

  // Compute full verse transliteration
  const verseTransliteration = useMemo(() => {
    if (!words.length) return null;
    return words
      .filter((w) => w.char_type_name === 'word')
      .map((w) => w.transliteration?.text)
      .filter(Boolean)
      .join(' ');
  }, [words]);

  const verseArabic = verse.text_uthmani ?? '';
  const verseTranslation = verse.translations?.[0]
    ? cleanTranslation(verse.translations[0].text)
    : '';

  return (
    <View style={[styles.container, isPlaying && styles.containerPlaying, isHighlighted && styles.containerHighlighted]}>
      {/* Header row: Verse number, subtle meta, more button */}
      <View style={styles.header}>
        {/* Verse key — simple text, no badge */}
        <Text style={[styles.verseNumberText, isPlaying && styles.verseNumberTextPlaying]}>
          {verse.verse_key}
        </Text>

        {/* Middle badges — minimal text, no background */}
        <View style={styles.headerMeta}>
          {verse.sajdah_number && (
            <View style={styles.sajdaBadge}>
              <AlertCircle size={10} color={colors.textTertiary} />
              <Text style={styles.metaText}>Sajdah</Text>
            </View>
          )}
          {verse.rub_el_hizb_number && (
            <View style={styles.hizbBadge}>
              <Bookmark size={10} color={colors.textTertiary} />
              <Text style={styles.metaText} numberOfLines={1}>
                Hizb {verse.hizb_number}
              </Text>
            </View>
          )}
        </View>

        {/* More button */}
        <TouchableOpacity style={styles.moreBtn}>
          <MoreHorizontal size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Main Arabic / Word-by-word content (Blurred in Hifz Mode) */}
      <View style={[isBlurred && styles.blurWrapper]}>
        {showWordByWord && words.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            <View style={styles.wordRow}>
              {words.filter((w: any) => w.char_type_name !== 'end').map((word: any, idx: number) => {
                const isWordPlaying = playingWordIdx === idx;
                const hasAudio = !!word.audio_url;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.wordCell, isWordPlaying && styles.wordCellPlaying]}
                    onPress={() => hasAudio ? playWordAudio(word, idx) : null}
                    activeOpacity={hasAudio ? 0.65 : 1}
                  >
                    <Text style={[styles.wordArabic, isWordPlaying && styles.wordArabicPlaying, { fontSize: arabicFontSize + 6 }]}>
                      {showTajweed && word.text_uthmani_tajweed
                        ? renderTajweed(word.text_uthmani_tajweed)
                        : (word.text_uthmani ?? word.text ?? '')}
                    </Text>
                    {word.transliteration?.text ? (
                      <Text style={[styles.wordTranslit, isWordPlaying && styles.wordTranslitPlaying]}>
                        {word.transliteration.text}
                      </Text>
                    ) : null}
                    {word.translation?.text ? (
                      <Text style={styles.wordMeaning}>{word.translation.text}</Text>
                    ) : null}
                    {hasAudio && (
                      <View style={[styles.wordAudioDot, isWordPlaying && styles.wordAudioDotPlaying]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <Text style={[styles.arabic, isPlaying && styles.arabicPlaying, { fontSize: arabicFontSize, lineHeight: arabicFontSize * 2.1 }]}>
            {showTajweed && verse.text_uthmani_tajweed
              ? renderTajweed(verse.text_uthmani_tajweed)
              : verseArabic}
          </Text>
        )}

        {/* Hifz Mode Blur Overlay */}
        {isBlurred && (
          <GlassBlur intensity={isDark ? 30 : 25} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        )}
        {isBlurred && onUnblur && (
          <TouchableOpacity
            style={styles.revealOverlay}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onUnblur(verse.verse_key); }}
            activeOpacity={0.7}
          >
            <View style={[styles.revealBadge, { backgroundColor: colors.primary }]}>
              <Eye size={14} color="#fff" />
              <Text style={styles.revealText}>Tap to reveal</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Transliteration */}
      {showTransliteration && verseTransliteration ? (
        <Text style={[styles.transliteration, { fontSize: translationFontSize, lineHeight: translationFontSize * 1.5 }]}>{verseTransliteration}</Text>
      ) : null}

      {/* Translation */}
      {showTranslation &&
        verse.translations &&
        verse.translations.length > 0 && (
          <View style={styles.translationBox}>
            <Text style={[styles.translation, { fontSize: translationFontSize, lineHeight: translationFontSize * 1.5 }]}>{verseTranslation}</Text>
          </View>
        )}

      {/* Minimal Action Icons */}
      <View style={styles.actionsRow}>
        {onPlayAyah && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => { Haptics.selectionAsync(); onPlayAyah(verse.verse_key); }}>
            {isPlaying ? <PauseCircle size={20} color={colors.primary} /> : <PlayCircle size={20} color={colors.textSecondary} />}
          </TouchableOpacity>
        )}

        {/* Mark as Memorized (only if it was struggled/highlighted) */}
        {isHighlighted && onMarkMemorized ? (
          <TouchableOpacity style={[styles.actionBtn, styles.memorizedBtn]} onPress={() => { Haptics.selectionAsync(); onMarkMemorized(verse.verse_key); }}>
            <CheckCircle2 size={18} color="#10B981" />
            <Text style={styles.memorizedText}>Memorized</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={() => { Haptics.selectionAsync(); onMarkDifficult(); }}>
            <Bookmark size={18} color={hifzStatus ? colors.primary : colors.textTertiary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionBtn} onPress={() => { Haptics.selectionAsync(); setIsFavorite(!isFavorite); }}>
          <Heart size={18} color={isFavorite ? '#EF4444' : colors.textTertiary} />
        </TouchableOpacity>
        {onOpenTafsir && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { Haptics.selectionAsync(); onOpenTafsir(verse.verse_key, verseArabic, verseTranslation); }}
          >
            <BookOpen size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionBtn} onPress={() => { Haptics.selectionAsync(); }}>
          <Share2 size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const makeStyles = (colors: ReturnType<typeof useAppTheme>['colors'], isDark: boolean) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 32,
      paddingBottom: 32,
    },
    containerPlaying: {
      backgroundColor: colors.primary + '0A',
    },
    containerHighlighted: {
      backgroundColor: colors.primary + '10', // Subtle tint for struggled verses
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 6,
    },
    verseNumberText: {
      fontSize: 12,
      fontFamily: Fonts.sansSemiBold,
      color: colors.textTertiary,
    },
    verseNumberTextPlaying: {
      color: colors.primary,
    },
    headerMeta: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      overflow: 'hidden',
    },
    metaText: {
      fontFamily: Fonts.sansMedium,
      fontSize: 10,
      color: colors.textTertiary,
    },
    sajdaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 1,
    },
    hizbBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 1,
    },
    moreBtn: {
      padding: 4,
    },
    wordRow: {
      flexDirection: 'row-reverse',
      flexWrap: 'nowrap',
      gap: 4,
      paddingHorizontal: 4,
    },
    wordCell: {
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
      minWidth: 60,
      position: 'relative',
    },
    wordCellPlaying: {
      backgroundColor: colors.primary + '22',
      borderWidth: 1,
      borderColor: colors.primary + '55',
    },
    wordArabic: {
      fontSize: 26,
      fontFamily: 'AmiriQuran',
      color: colors.text,
      textAlign: 'center',
    },
    wordArabicPlaying: {
      color: colors.primary,
    },
    wordTranslit: {
      fontSize: 10,
      fontFamily: Fonts.sans,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    wordTranslitPlaying: {
      color: colors.primary,
    },
    wordMeaning: {
      fontSize: 10,
      fontFamily: Fonts.sansMedium,
      color: colors.textTertiary,
      marginTop: 2,
      textAlign: 'center',
    },
    wordAudioDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.textTertiary,
      position: 'absolute',
      bottom: 4,
    },
    wordAudioDotPlaying: {
      backgroundColor: colors.primary,
    },
    arabic: {
      fontSize: 20,
      lineHeight: 42,
      color: colors.text,
      textAlign: 'right',
      marginBottom: 2,
      fontFamily: 'AmiriQuran',
      writingDirection: 'rtl',
    },
    arabicPlaying: {
      color: colors.primary,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 16,
    },
    actionBtn: {
      padding: 8,
      margin: -8, // increase hit area
    },
    memorizedBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    memorizedText: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 12,
      color: '#10B981',
    },
    blurWrapper: {
      position: 'relative',
      minHeight: 80,
      borderRadius: 12,
      overflow: 'hidden',
    },
    revealOverlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    revealBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    revealText: {
      fontFamily: Fonts.sansBold,
      fontSize: 14,
      color: '#fff',
    },
    transliteration: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
      fontFamily: Fonts.sans,
      marginBottom: 8,
      fontStyle: 'italic',
    },
    translationBox: {
      marginTop: 6,
      paddingTop: 8,
    },
    translation: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
      fontFamily: Fonts.sans,
    },
  });
