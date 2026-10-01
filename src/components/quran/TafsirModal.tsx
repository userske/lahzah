import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { GlassBlur } from '../ui/GlassCard';
import { X } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Fonts } from '../../constants/theme';
import { fetchTafsirByAyah } from '../../services/quranApi';

const { height: SCREEN_H } = Dimensions.get('window');

// Strip HTML tags from tafsir text for clean display
function stripHtml(html: string): string {
  return html
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface TafsirModalProps {
  verseKey: string | null;
  arabicText?: string;
  verseTranslation?: string;
  onClose: () => void;
}

export const TafsirModal = ({ verseKey, arabicText, verseTranslation, onClose }: TafsirModalProps) => {
  const { height: windowHeight } = useWindowDimensions();
  // Fallback to static SCREEN_H if needed, but prefer windowHeight
  const sheetHeight = windowHeight * 0.78;
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark, sheetHeight), [colors, isDark, sheetHeight]);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tafsirId, setTafsirId] = useState(169); // Default: Ibn Kathir

  const TAFSIR_OPTIONS = [
    { id: 169, name: 'Ibn Kathir', lang: 'EN' },
    { id: 165, name: 'Al-Jalalayn', lang: 'EN' },
    { id: 91,  name: 'Ma\'ariful Quran', lang: 'EN' },
  ];

  const translateY = useRef(new Animated.Value(SCREEN_H)).current; // Using static SCREEN_H for initial off-screen placement is fine

  useEffect(() => {
    if (verseKey) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }).start();
      loadTafsir(verseKey, tafsirId);
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_H,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [verseKey]);

  useEffect(() => {
    if (verseKey) loadTafsir(verseKey, tafsirId);
  }, [tafsirId]);

  const loadTafsir = async (key: string, tid: number) => {
    setLoading(true);
    setTafsirText(null);
    const res = await fetchTafsirByAyah(key, tid);
    if (res?.tafsir?.text) {
      setTafsirText(stripHtml(res.tafsir.text));
    } else {
      setTafsirText('Tafsir not available for this verse.');
    }
    setLoading(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 10,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120) {
          onClose();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (!verseKey) return null;

  return (
    <Modal transparent visible={!!verseKey} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <GlassBlur intensity={isDark ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={styles.blurContainer}>

            {/* ── Drag Handle ── */}
            <View style={styles.dragArea} {...panResponder.panHandlers}>
              <View style={styles.handle} />
            </View>

            {/* ── Header row (fixed height) ── */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerLabel}>Tafsir</Text>
                <Text style={styles.verseKey}>{verseKey}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* ── Arabic + translation (fixed, not scrollable) ── */}
            {arabicText ? (
              <View style={styles.arabicBox}>
                <Text style={[styles.arabicText, { color: colors.text }]}>{arabicText}</Text>
                {verseTranslation ? (
                  <Text style={[styles.translationText, { color: colors.textSecondary }]}>{verseTranslation}</Text>
                ) : null}
              </View>
            ) : null}

            {/* ── Selector chips (fixed height row, horizontal scroll) ── */}
            <View style={styles.selectorContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectorRow}
              >
                {TAFSIR_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.selectorChip, tafsirId === opt.id && styles.selectorChipActive]}
                    onPress={() => setTafsirId(opt.id)}
                  >
                    <Text style={[styles.selectorText, tafsirId === opt.id && styles.selectorTextActive]}>
                      {opt.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* ── Tafsir content (flex:1 so it fills remaining space) ── */}
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
              ) : (
                <Text style={styles.tafsirText}>{tafsirText}</Text>
              )}
            </ScrollView>

          </GlassBlur>
        </Animated.View>
      </View>
    </Modal>
  );
};

const makeStyles = (colors: any, isDark: boolean, sheetHeight: number) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      height: sheetHeight,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: 'hidden',
    },
    blurContainer: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(15,15,25,0.82)' : 'rgba(245,245,252,0.88)',
    },
    dragArea: {
      alignItems: 'center',
      paddingTop: 12,
      paddingBottom: 4,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    },
    headerLabel: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.primary,
      marginBottom: 2,
    },
    verseKey: {
      fontFamily: Fonts.sansBold,
      fontSize: 20,
      color: colors.text,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    arabicBox: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    },
    arabicText: {
      fontFamily: 'AmiriQuran',
      fontSize: 20,
      lineHeight: 46,
      textAlign: 'right',
      writingDirection: 'rtl',
      marginBottom: 8,
    },
    translationText: {
      fontFamily: Fonts.sans,
      fontSize: 13,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    selectorContainer: {
      height: 52,                           // fixed height – never expands
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    },
    selectorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
    },
    selectorChip: {
      height: 32,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectorChipActive: {
      backgroundColor: colors.primary,
    },
    selectorText: {
      fontFamily: Fonts.sansMedium,
      fontSize: 13,
      color: colors.textSecondary,
    },
    selectorTextActive: {
      color: '#fff',
    },
    scrollArea: {
      flex: 1,                              // fills ALL remaining space after header/arabic/selector
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    tafsirText: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      lineHeight: 26,
      color: colors.text,
    },
  });
