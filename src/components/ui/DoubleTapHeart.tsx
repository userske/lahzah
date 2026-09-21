import React, { useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';

interface DoubleTapHeartProps {
  children: React.ReactNode;
  onDoubleTap?: () => void;
  onSingleTap?: () => void;
  iconColor?: string;
}

export const DoubleTapHeart = ({
  children,
  onDoubleTap,
  onSingleTap,
  iconColor = '#ec4899',
}: DoubleTapHeartProps) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const lastTap = useRef<number>(0);

  const triggerAnimation = useCallback(() => {
    scale.value = 0;
    opacity.value = 1;
    scale.value = withSequence(
      withSpring(1, { damping: 12, stiffness: 200 }),
      withDelay(400, withTiming(0, { duration: 300 }))
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(400, withTiming(0, { duration: 300 }))
    );
  }, [scale, opacity]);

  const handlePress = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      triggerAnimation();
      onDoubleTap?.();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      // Wait to see if a second tap arrives before firing single tap
      setTimeout(() => {
        if (lastTap.current === now) {
          onSingleTap?.();
          lastTap.current = 0;
        }
      }, DOUBLE_TAP_DELAY + 10);
    }
  }, [triggerAnimation, onDoubleTap, onSingleTap]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Native responder-based tap — no GestureHandlerRootView needed */}
      <View
        style={styles.content}
        onStartShouldSetResponder={() => true}
        onResponderRelease={handlePress}
      >
        {children}
      </View>

      {/* Floating Heart Overlay */}
      <View style={styles.overlay} pointerEvents="none">
        <Animated.View style={[styles.heartContainer, animatedStyle]}>
          <Heart size={80} color={iconColor} fill={iconColor} />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heartContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
});
