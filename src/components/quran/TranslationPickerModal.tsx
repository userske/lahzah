import { useEffect, useMemo, useRef, useState } from 'react';
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
  View,
} from 'react-native';
import { GlassBlur } from '../../../components/ui/GlassCard';
import { Check, X } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Fonts } from '../../constants/theme';
import { fetchTranslations } from '../../services/quranApi';

const { height: SCREEN_H } = Dimensions.get('window');

interface TranslationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTranslationId: number;
  onSelectTranslation: (id: number) => void;
}

// Featured translations pinned at the top for quick access
const FEATURED_TRANSLATIONS = [
  { id: 85,  name: 'Saheeh International', language_name: 'english', flag: '🇬🇧' },
  { id: 131, name: 'Dr. Mustafa Khattab', language_name: 'english', flag: '🇬🇧' },
  { id: 231, name: 'Dr. Abdullah Muhammad Abu Bakr', language_name: 'swahili', flag: '🇹🇿' },
  { id: 49,  name: 'Ali Muhsin Al-Barwani', language_name: 'swahili', flag: '🇹🇿' },
];

export const TranslationPickerModal = ({ visible, onClose, selectedTranslationId, onSelectTranslation }: TranslationPickerModalProps) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [translations, setTranslations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const translateY = useRef(new Animated.Value(SCREEN_H)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }).start();
      if (translations.length === 0) {
        loadTranslations();
      }
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_H,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadTranslations = async () => {
    setLoading(true);
    const res = await fetchTranslations('en');
    if (res?.translations) {
      // Sort: Swahili first, then English, then rest
      const sorted = [...res.translations].sort((a: any, b: any) => {
        const priority = (lang: string) => {
          if (lang === 'swahili') return 0;
          if (lang === 'english') return 1;
          return 2;
        };
        return priority(a.language_name) - priority(b.language_name);
      });
      setTranslations(sorted);
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

  if (!visible && (translateY as any).__getValue?.() === SCREEN_H) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <GlassBlur intensity={isDark ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={styles.blurContainer}>
            {/* Drag Handle */}
            <View style={styles.dragArea} {...panResponder.panHandlers}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Translations</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Translation Content */}
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              {/* ── Featured Languages ── */}
              <Text style={styles.sectionHeader}>Featured</Text>
              {FEATURED_TRANSLATIONS.map((t) => (
                <TouchableOpacity
                  key={`featured-${t.id}`}
                  style={[styles.translationRow, selectedTranslationId === t.id && styles.translationRowActive]}
                  onPress={() => {
                    onSelectTranslation(t.id);
                    onClose();
                  }}
                >
                  <Text style={styles.flag}>{t.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.translationName, selectedTranslationId === t.id && styles.translationNameActive]}>
                      {t.name}
                    </Text>
                    <Text style={styles.translationLanguage}>
                      {t.language_name.toUpperCase()}
                    </Text>
                  </View>
                  {selectedTranslationId === t.id && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {/* ── All Translations ── */}
              <Text style={styles.sectionHeader}>All Translations</Text>
              {loading ? (
                <ActivityIndicator style={{ marginTop: 20, marginBottom: 20 }} color={colors.primary} />
              ) : (
                translations.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.translationRow, selectedTranslationId === t.id && styles.translationRowActive]}
                    onPress={() => {
                      onSelectTranslation(t.id);
                      onClose();
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.translationName, selectedTranslationId === t.id && styles.translationNameActive]}>
                        {t.name}
                      </Text>
                      <Text style={styles.translationLanguage}>
                        {t.language_name.toUpperCase()}
                      </Text>
                    </View>
                    {selectedTranslationId === t.id && (
                      <Check size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </GlassBlur>
        </Animated.View>
      </View>
    </Modal>
  );
};

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      height: SCREEN_H * 0.7,
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
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    },
    title: {
      fontFamily: Fonts.sansBold,
      fontSize: 18,
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
    scrollArea: {
      flex: 1,
    },
    translationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    },
    translationRowActive: {
      backgroundColor: colors.primary + '11',
    },
    translationName: {
      fontFamily: Fonts.sansMedium,
      fontSize: 15,
      color: colors.text,
      marginBottom: 4,
    },
    translationNameActive: {
      color: colors.primary,
    },
    translationLanguage: {
      fontFamily: Fonts.sans,
      fontSize: 12,
      color: colors.textSecondary,
    },
    sectionHeader: {
      fontFamily: Fonts.sansBold,
      fontSize: 11,
      color: colors.textTertiary,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    flag: {
      fontSize: 20,
      marginRight: 12,
    },
  });
