import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback, Dimensions, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, SlidersHorizontal, RotateCcw, VolumeX, VibrateOff, Vibrate, Flag } from 'lucide-react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Fonts } from '../../../constants/theme';
import { DhikrItem, GENERAL_ADHKAR } from '../../../data/adhkar';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, useAnimatedProps, interpolateColor } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { GlassBlur } from '../../../components/ui/GlassCard';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.75;
const STROKE_WIDTH = 12;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const TARGET_PRESETS = [33, 100, 1000];
const TASBIH_STORAGE_KEY = '@lahzah_tasbih_state';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function TasbihCounter() {
  const { colors, isDark } = useAppTheme();
  const contrastColor = isDark ? '#000000' : '#FFFFFF';
  
  const [activeDhikr, setActiveDhikr] = useState<DhikrItem>(GENERAL_ADHKAR[0]);
  const [count, setCount] = useState<number>(0);
  const [customTarget, setCustomTarget] = useState<number>(GENERAL_ADHKAR[0].defaultTarget);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [customInputValue, setCustomInputValue] = useState<string>('');

  // Reanimated shared values
  const tapScale = useSharedValue(1);
  const progressValue = useSharedValue(0);

  // Load saved state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const saved = await AsyncStorage.getItem(TASBIH_STORAGE_KEY);
        if (saved) {
          const { savedCount, savedId, savedTarget, savedHaptics } = JSON.parse(saved);
          
          const found = GENERAL_ADHKAR.find(p => p.id === savedId);
          if (found) setActiveDhikr(found);
          if (typeof savedCount === 'number') setCount(savedCount);
          if (typeof savedTarget === 'number') setCustomTarget(savedTarget);
          if (typeof savedHaptics === 'boolean') setHapticsEnabled(savedHaptics);
        }
      } catch (e) {
      } finally {
        setIsLoaded(true);
      }
    };
    loadState();
  }, []);

  // Save state on change
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(TASBIH_STORAGE_KEY, JSON.stringify({
      savedCount: count,
      savedId: activeDhikr.id,
      savedTarget: customTarget,
      savedHaptics: hapticsEnabled
    })).catch(e => console.error('Failed to save Tasbih state', e));
  }, [count, activeDhikr, customTarget, hapticsEnabled, isLoaded]);

  // Update progress ring
  useEffect(() => {
    const progress = customTarget > 0 ? Math.min(count / customTarget, 1) : 0;
    progressValue.value = withTiming(progress, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });

    // Fire milestone haptics if the count reaches the specific target
    if (count > 0 && count === customTarget && hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [count, customTarget, hapticsEnabled]);

  const handleTapIn = () => {
    tapScale.value = withSpring(0.95, { stiffness: 400, damping: 15 });
  };

  const handleTapOut = async () => {
    tapScale.value = withSpring(1, { stiffness: 400, damping: 10 });
    if (hapticsEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCount(prev => prev + 1);
  };

  const handleReset = async () => {
    if (hapticsEnabled) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setCount(0);
  };

  const toggleHaptics = () => {
    setHapticsEnabled(!hapticsEnabled);
    if (!hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const selectPresetTarget = (target: number) => {
    setCustomTarget(target);
    setCustomInputValue(''); // clear custom input when preset is selected
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCustomInputChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setCustomInputValue(numericValue);
    if (numericValue) {
      setCustomTarget(parseInt(numericValue, 10));
    }
  };

  const selectDhikr = (item: DhikrItem) => {
    setActiveDhikr(item);
    setCustomTarget(item.defaultTarget);
    setCount(0);
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const animatedCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: tapScale.value }],
    };
  });

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: CIRCUMFERENCE * (1 - progressValue.value),
    };
  });

  const animatedProgressColor = useAnimatedStyle(() => {
    const stroke = interpolateColor(
      progressValue.value,
      [0, 0.99, 1],
      [colors.primary, colors.primary, '#10B981'] // turns emerald green when done
    );
    return { color: stroke };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary }}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primary }}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.headerButton}>
              <ChevronLeft size={28} color={contrastColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: contrastColor }]}>Tasbih Counter</Text>
            <View style={styles.headerButton} /> 
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.body}>
        {/* Top Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.circleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setModalVisible(true)}>
            <SlidersHorizontal size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.circleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleReset}>
            <RotateCcw size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.circleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={1}>
            <VolumeX size={20} color={colors.skeleton} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.circleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={toggleHaptics}>
            {hapticsEnabled ? <Vibrate size={20} color={colors.textSecondary} /> : <VibrateOff size={20} color={colors.skeleton} />}
          </TouchableOpacity>
        </View>

        {/* Target Indicator */}
        <View style={styles.targetWrapper}>
          <Text style={[styles.targetLabel, { color: colors.textTertiary }]}>TARGET</Text>
          <View style={[styles.targetBadge, { backgroundColor: colors.primary + '15' }]}>
             <Text style={[styles.targetValue, { color: colors.primary }]}>{customTarget}</Text>
          </View>
        </View>

        {/* Large Circular Counter */}
        <View style={styles.counterSection}>
          <Animated.View style={[styles.mainCircleOuter, animatedCircleStyle]}>
            {/* SVG Progress Ring */}
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={StyleSheet.absoluteFill}>
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke={colors.primary + '15'}
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              <AnimatedCircle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke={colors.primary}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                animatedProps={animatedProps}
                strokeLinecap="round"
                rotation="-90"
                originX={CIRCLE_SIZE / 2}
                originY={CIRCLE_SIZE / 2}
              />
            </Svg>

            {/* Inner Tap Area */}
            <TouchableWithoutFeedback 
              onPressIn={handleTapIn} 
              onPressOut={handleTapOut}
            >
              <View style={[styles.mainCircleInner, { backgroundColor: colors.surface, shadowColor: isDark ? '#000' : colors.primary }]}>
                <Text style={[styles.countText, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {count}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </View>
        
        {/* Optional Dhikr Display - Moved below counter for premium feel */}
        {activeDhikr.id !== 'free_count' && (
          <View style={styles.dhikrDisplay}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingVertical: 10 }}>
              {activeDhikr.arabicImg ? (
                <Image 
                  source={{ uri: activeDhikr.arabicImg }} 
                  style={{ width: width - 40, height: 120, marginBottom: 12 }} 
                  resizeMode="contain" 
                />
              ) : activeDhikr.arabic ? (
                <Text style={[styles.dhikrArabic, { color: colors.text }]}>{activeDhikr.arabic}</Text>
              ) : null}
              {activeDhikr.full_transliteration && (
                <Text style={[styles.dhikrTranslit, { color: colors.textSecondary }]}>
                  {activeDhikr.full_transliteration}
                </Text>
              )}
              <Text style={[styles.dhikrTranslation, { color: colors.textTertiary }]}>{activeDhikr.translation}</Text>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Settings Modal with Glassmorphism */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalDismissArea} />
          </TouchableWithoutFeedback>
          <GlassBlur intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={[styles.modalContent, { backgroundColor: isDark ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.9)' }]}>
            
            {/* Dragger */}
            <View style={styles.modalDragger} />

            <View style={styles.categoryHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 0 }]}>Target Amount</Text>
            </View>
            
            <View style={styles.presetsGrid}>
              {TARGET_PRESETS.map((t) => {
                const isSelected = customTarget === t && customInputValue === '';
                return (
                  <TouchableOpacity
                    key={t.toString()}
                    style={[
                      styles.targetPresetBtn, 
                      { borderColor: colors.border },
                      isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => selectPresetTarget(t)}
                  >
                    <Text style={[
                      styles.targetPresetText, 
                      { color: colors.primary },
                      isSelected && { color: contrastColor }
                    ]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              
              {/* Custom Input Button */}
              <View style={[
                styles.targetPresetBtn, 
                { borderColor: colors.border },
                customInputValue !== '' && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}>
                <TextInput
                  style={[
                    styles.targetPresetText, 
                    { color: colors.primary, width: '100%', textAlign: 'center', padding: 0 },
                    customInputValue !== '' && { color: contrastColor }
                  ]}
                  placeholder="Custom"
                  placeholderTextColor={customInputValue !== '' ? (isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)') : colors.primary + '80'}
                  keyboardType="number-pad"
                  value={customInputValue}
                  onChangeText={handleCustomInputChange}
                  maxLength={6}
                />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.categoryHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 0 }]}>Adhkar Selection</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dhikrScroll}>
              {GENERAL_ADHKAR.map((item) => {
                const isSelected = item.id === activeDhikr.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.dhikrPill, 
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => selectDhikr(item)}
                  >
                    <Text style={[
                      styles.dhikrPillText, 
                      { color: colors.textSecondary },
                      isSelected && { color: contrastColor }
                    ]}>
                      {item.transliteration}
                    </Text>
                    {/* Add small badge for target */}
                    {item.defaultTarget !== 999999 && (
                       <View style={[styles.dhikrTargetBadge, isSelected && { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' }]}>
                          <Text style={[styles.dhikrTargetBadgeText, isSelected && { color: contrastColor }]}>x{item.defaultTarget}</Text>
                       </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(false)}>
              <Text style={[styles.doneBtnText, { color: contrastColor }]}>DONE</Text>
            </TouchableOpacity>
          </GlassBlur>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.sansSemiBold,
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 0,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 30,
  },
  circleBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dhikrDisplay: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  dhikrArabic: {
    fontSize: 26,
    fontFamily: 'AmiriQuran',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 46,
  },
  dhikrTranslit: {
    fontSize: 15,
    fontFamily: Fonts.sansSemiBold,
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  dhikrTranslation: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    lineHeight: 22,
  },
  targetWrapper: {
    alignItems: 'center',
    marginBottom: 30,
  },
  targetLabel: {
    fontSize: 11,
    fontFamily: Fonts.sansSemiBold,
    letterSpacing: 2,
    marginBottom: 8,
  },
  targetBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  targetValue: {
    fontSize: 20,
    fontFamily: Fonts.sansBold,
    fontVariant: ['tabular-nums'],
  },
  counterSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  mainCircleOuter: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCircleInner: {
    width: CIRCLE_SIZE - STROKE_WIDTH * 2 - 20,
    height: CIRCLE_SIZE - STROKE_WIDTH * 2 - 20,
    borderRadius: (CIRCLE_SIZE - STROKE_WIDTH * 2 - 20) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  countText: {
    fontSize: 72,
    fontFamily: Fonts.sansBold,
    fontVariant: ['tabular-nums'],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  modalDragger: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.sansBold,
    marginBottom: 8,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  targetPresetBtn: {
    width: '45%',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  targetPresetText: {
    fontSize: 18,
    fontFamily: Fonts.sansBold,
  },
  targetPresetTextActive: {
    color: '#FFFFFF',
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dhikrScroll: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 24,
  },
  dhikrPill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 140,
  },
  dhikrPillText: {
    fontSize: 14,
    fontFamily: Fonts.sansSemiBold,
    marginBottom: 6,
  },
  dhikrPillTextActive: {
    color: '#FFFFFF',
  },
  dhikrTargetBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dhikrTargetBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
    color: '#6B7280',
  },
  doneBtn: {
    width: '100%',
    paddingVertical: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
    marginTop: 10,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    letterSpacing: 1,
  },
});
