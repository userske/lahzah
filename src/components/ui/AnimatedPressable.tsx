import React, { useCallback } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Press, Still } from '../../motion/springs';
import { useMotionPrefs } from '../../motion/useMotionPrefs';

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

/** Reserve haptics for moments that commit something. Over-feedback trains people to ignore it. */
export type HapticKind = 'selection' | 'light' | 'medium' | 'success' | false;

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: HapticKind;
}

function fire(kind: Exclude<HapticKind, false>) {
  if (kind === 'selection') return Haptics.selectionAsync();
  if (kind === 'success') {
    return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
  return Haptics.impactAsync(
    kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
  );
}

/**
 * Feedback on pointer-down, never on release.
 *
 * The instant lag appears the sense of directness falls off a cliff, so the
 * highlight lands on touch and the commit happens on lift. Under reduced
 * motion the scale is replaced by a dip in opacity — gentler, not absent.
 */
export function AnimatedPressable({
  children,
  style,
  scaleTo = 0.97,
  haptic = false,
  onPressIn,
  onPressOut,
  hitSlop = 10,
  ...rest
}: AnimatedPressableProps) {
  const { reduceMotion } = useMotionPrefs();
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const spring = reduceMotion ? Still : Press;
    if (reduceMotion) {
      return { opacity: withSpring(pressed.value ? 0.6 : 1, spring) };
    }
    return {
      transform: [{ scale: withSpring(pressed.value ? scaleTo : 1, spring) }],
    };
  }, [reduceMotion, scaleTo]);

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      pressed.value = 1;
      if (haptic) fire(haptic);
      onPressIn?.(e);
    },
    [haptic, onPressIn, pressed],
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      pressed.value = 0;
      onPressOut?.(e);
    },
    [onPressOut, pressed],
  );

  return (
    <AnimatedPressableComponent
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={hitSlop}
      // Let the finger stray and come back without losing the press.
      pressRetentionOffset={16}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressableComponent>
  );
}
