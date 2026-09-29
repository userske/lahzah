import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { GlassBlur } from '../../../components/ui/GlassCard';
import { Check, Clock, MoreHorizontal, X, Play, Pause } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Fonts } from '../../constants/theme';
import { fetchRecitations } from '../../services/quranApi';
import { Reciter, DEFAULT_RECITER, SWAHILI_AL_BARWANI } from '../../data/reciters';

export { Reciter, DEFAULT_RECITER };

interface BottomAudioPlayerProps {
  isPlaying: boolean;
  isLoading: boolean;
  currentReciter: Reciter;
  onTogglePlay: () => void;
  onReciterChange: (reciter: Reciter) => void;
  surahName?: string | null;
  activeVerseKey?: string | null;
  isImmersiveMode?: boolean;
}

export function BottomAudioPlayer({
  isPlaying,
  isLoading,
  currentReciter,
  onTogglePlay,
  onReciterChange,
  surahName,
  activeVerseKey,
  isImmersiveMode = false,
}: BottomAudioPlayerProps) {
  const { colors, isDark } = useAppTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentIds, setRecentIds] = useState<(number | string)[]>([currentReciter.id]);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loadingReciters, setLoadingReciters] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const immersiveAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(immersiveAnim, {
      toValue: isImmersiveMode ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isImmersiveMode, immersiveAnim]);

  React.useEffect(() => {
    if (isPlaying) {
      setIsExpanded(false);
    }
  }, [isPlaying]);

  React.useEffect(() => {
    const load = async () => {
      setLoadingReciters(true);
      const res = await fetchRecitations();
      let apiReciters: Reciter[] = [];
      if (res?.recitations) {
        apiReciters = res.recitations;
      }
      
      setReciters([SWAHILI_AL_BARWANI, ...apiReciters]);
      setLoadingReciters(false);
    };
    load();
  }, []);

  const openSheet = () => {
    setShowPicker(true);
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 22,
      stiffness: 280,
      mass: 0.9,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 240,
      useNativeDriver: true,
    }).start(() => setShowPicker(false));
  };

  const handleSelect = useCallback((reciter: Reciter) => {
    setRecentIds(prev => [reciter.id, ...prev.filter(id => id !== reciter.id)].slice(0, 3));
    onReciterChange(reciter);
    closeSheet();
  }, [onReciterChange]);

  const reciterLabel = (r: Reciter) =>
    r.reciter_name;

  const reciterStyle = (r: Reciter) =>
    r.style ?? null;

  const recentReciters = reciters.filter(r => recentIds.includes(r.id));
  const otherReciters  = reciters.filter(r => !recentIds.includes(r.id));

  const flatData: any[] = [];
  if (recentReciters.length) {
    flatData.push({ type: 'header', title: 'Recent', id: 'h-recent' });
    recentReciters.forEach(r => flatData.push({ type: 'item', reciter: r, id: `r-${r.id}` }));
  }
  flatData.push({ type: 'header', title: 'All Reciters', id: 'h-all' });
  otherReciters.forEach(r => flatData.push({ type: 'item', reciter: r, id: `r-${r.id}` }));

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [700, 0],
  });

  return (
    <Animated.View style={[
      {
        opacity: immersiveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        transform: [{ translateY: immersiveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 100] }) }],
        pointerEvents: isImmersiveMode ? 'none' : 'auto',
      }
    ]}>
      {/* ── Bottom Player Bar / FAB ── */}
      {!isExpanded && !isPlaying ? (
        <View style={styles.fabWrapper}>
          <TouchableOpacity
            style={[styles.playFab, { backgroundColor: colors.primary }]}
            onPress={() => setIsExpanded(true)}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Play size={24} color="#fff" style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>
        </View>
      ) : !isExpanded && isPlaying ? (
        <View style={styles.fabWrapper}>
          <TouchableOpacity
            style={[styles.playFab, { backgroundColor: colors.primary }]}
            onPress={onTogglePlay}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Pause size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <GlassBlur
          intensity={isDark ? 50 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.bar, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }]}
        >
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: colors.primary }]}
            onPress={onTogglePlay}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : isPlaying ? (
              <Pause size={20} color="#fff" />
            ) : (
              <Play size={20} color="#fff" style={{ marginLeft: 3 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.reciterArea} onPress={openSheet} activeOpacity={0.7}>
            {isPlaying && surahName ? (
              <>
                <Text style={[styles.nowPlayingLabel, { color: colors.text }]} numberOfLines={1}>
                  {surahName}{activeVerseKey ? `  •  Ayah ${activeVerseKey.split(':')[1]}` : ''}
                </Text>
                <Text style={[styles.tapHint, { color: colors.primary }]} numberOfLines={1}>
                  {currentReciter.reciter_name}
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.reciterName, { color: colors.text }]} numberOfLines={1}>
                  {reciterLabel(currentReciter)}
                </Text>
                <Text style={[styles.tapHint, { color: colors.textTertiary }]}>Tap to change reciter</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsExpanded(false)}
            style={[styles.moreBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            activeOpacity={0.7}
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </GlassBlur>
      )}

      {/* ── Reciter Picker Sheet ── */}
      {showPicker && (
        <Modal visible transparent animationType="none" onRequestClose={closeSheet}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet}>
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)' }
              ]}
            />
          </Pressable>

          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
          >
            {/* Handle */}
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: isDark ? '#444' : '#d0d0d0' }]} />
            </View>

            {/* Header */}
            <View style={styles.sheetHeader}>
              <TouchableOpacity
                onPress={closeSheet}
                style={[styles.closeBtn, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]}
              >
                <X size={16} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                Select the reciter to listen to
              </Text>
            </View>

            {loadingReciters ? (
              <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} size="large" />
            ) : (
              <FlatList
                data={flatData}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 48, paddingHorizontal: 16 }}
                renderItem={({ item }: any) => {
                  if (item.type === 'header') {
                    return (
                      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                        {item.title}
                      </Text>
                    );
                  }
                  const r: Reciter = item.reciter;
                  const isSelected = r.id === currentReciter.id;
                  const isRecent = recentIds.includes(r.id);
                  return (
                    <TouchableOpacity
                      style={[styles.reciterRow, { backgroundColor: isDark ? '#262626' : '#fff' }]}
                      onPress={() => handleSelect(r)}
                      activeOpacity={0.7}
                    >
                      {isRecent && (
                        <Clock size={13} color={colors.textTertiary} style={{ marginRight: 10 }} />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.reciterRowText,
                            { color: isSelected ? colors.primary : colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {reciterLabel(r)}
                        </Text>
                        {reciterStyle(r) && (
                          <Text style={[styles.reciterStyleTag, { color: colors.textTertiary }]}>
                            {reciterStyle(r)}
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <Check size={16} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
                ItemSeparatorComponent={() => (
                  <View style={[styles.separator, { backgroundColor: isDark ? '#333' : '#e8e8e8' }]} />
                )}
              />
            )}
          </Animated.View>
        </Modal>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 100,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabWrapper: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  playFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reciterArea: { flex: 1, justifyContent: 'center' },
  reciterName: {
    fontFamily: Fonts.monoMedium,
    fontSize: 14,
  },
  nowPlayingLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 14,
  },
  tapHint: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    marginTop: 2,
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 24,
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontFamily: Fonts.monoMedium,
    fontSize: 14,
    flex: 1,
  },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  reciterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 0,
  },
  reciterRowText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 13,
    flex: 1,
  },
  reciterStyleTag: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
});
