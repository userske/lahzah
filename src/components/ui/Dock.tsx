import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  type LayoutRectangle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { GlassBlur } from './GlassCard';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import * as Haptics from 'expo-haptics';
import type { Tabs } from 'expo-router';
import { useFolio } from '../../hooks/useFolio';
import { Move, Press, Still } from '../../motion/springs';
import { useMotionPrefs } from '../../motion/useMotionPrefs';
import type { FolioPalette } from '../../constants/folio';

// ── Tab config ────────────────────────────────────────────────────────────────
import {
  HomeIcon,
  QuranIcon,
  MosqueIcon,
  CirclesIcon,
  ProfileIcon,
} from './PremiumDockIcons';

interface TabCfg {
  Icon: React.ComponentType<{ size: number; color: string; filled: boolean }>;
  label: string;
}

const TAB_CONFIG: Record<string, TabCfg> = {
  index:           { Icon: HomeIcon,    label: 'Today'   },
  'reader/browse': { Icon: QuranIcon,   label: 'Quran'   },
  'mosque/index':  { Icon: MosqueIcon,  label: 'Mosques' },
  'messages/index':{ Icon: CirclesIcon, label: 'Circle'  },
  'profile/index': { Icon: ProfileIcon, label: 'Profile' },
};

const HIDDEN_ROUTES = new Set([
  'reader/index', 'reader/page', 'reader/search',
  'messages/chat', 'messages/me', 'messages/hifz',
]);

export type DockProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

// ── Dock item ─────────────────────────────────────────────────────────────────
interface DockItemProps {
  routeName: string;
  tabIndex: number;          // position among visible tabs (0..N-1)
  totalTabs: number;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onLayout: (tabIndex: number, layout: LayoutRectangle) => void;
  pressedIndex: SharedValue<number>;
  plate: FolioPalette;
  isNight: boolean;
  reduceMotion: boolean;
}

const DockItem = ({
  routeName,
  tabIndex,
  isFocused,
  onPress,
  onLongPress,
  onLayout,
  pressedIndex,
  plate,
  isNight,
  reduceMotion,
}: DockItemProps) => {
  const cfg = TAB_CONFIG[routeName] ?? { Icon: HomeIcon, label: '' };
  const { Icon } = cfg;

  // Scale spring on press
  const scaleStyle = useAnimatedStyle(() => {
    const isPressed = pressedIndex.value === tabIndex;
    const spring = reduceMotion ? Still : Press;
    return {
      transform: [{ scale: withSpring(isPressed ? 0.82 : 1, spring) }],
    };
  }, [tabIndex, reduceMotion]);

  // Active icon opacity / scale
  const focusAnim = useSharedValue(isFocused ? 1 : 0);
  useEffect(() => {
    focusAnim.value = withSpring(isFocused ? 1 : 0, reduceMotion ? Still : Move);
  }, [isFocused, reduceMotion]);

  // Glow dot
  const dotStyle = useAnimatedStyle(() => ({
    opacity: withSpring(focusAnim.value, reduceMotion ? Still : Move),
    transform: [{ scaleX: withSpring(isFocused ? 1 : 0.3, reduceMotion ? Still : Move) }],
  }));

  const iconColor = isFocused
    ? plate.accent
    : (isNight ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.38)');
  const dotColor = plate.accent;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => { pressedIndex.value = tabIndex; }}
      onPressOut={() => { pressedIndex.value = -1; }}
      style={styles.dockItem}
      onLayout={(e) => onLayout(tabIndex, e.nativeEvent.layout)}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={cfg.label}
    >
      <Animated.View style={[styles.itemContent, scaleStyle]}>
        <Icon size={24} color={iconColor} filled={isFocused} />
        {/* Glow dot indicator */}
        <Animated.View style={[styles.dot, { backgroundColor: dotColor }, dotStyle]} />
      </Animated.View>
    </Pressable>
  );
};

// ── Dock ──────────────────────────────────────────────────────────────────────
export function Dock({ state, navigation }: DockProps) {
  const { plate, isNight } = useFolio();
  const { reduceMotion } = useMotionPrefs();
  const { width } = useWindowDimensions();
  const [layouts, setLayouts] = useState<Record<number, LayoutRectangle>>({});
  const pressedIndex = useSharedValue(-1);

  // Pill slide animation
  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);

  // Derive visible tab list (index into state.routes → position in visible tabs)
  const visibleRoutes = useMemo(() =>
    state.routes
      .map((r, i) => ({ route: r, routeIndex: i }))
      .filter(({ route }) => !HIDDEN_ROUTES.has(route.name) && !!TAB_CONFIG[route.name]),
    [state.routes]
  );

  // Current focused position among visible tabs
  const focusedVisibleIndex = visibleRoutes.findIndex(({ routeIndex }) => routeIndex === state.index);

  useEffect(() => {
    const layout = layouts[focusedVisibleIndex];
    if (!layout) return;
    const spring = reduceMotion ? Still : Move;
    const targetW = layout.width * 0.7;
    const targetX = layout.x + (layout.width - targetW) / 2;
    pillX.value = withSpring(targetX, spring);
    pillW.value = withSpring(targetW, spring);
  }, [focusedVisibleIndex, layouts, reduceMotion]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
    opacity: pillW.value > 0 ? withTiming(1, { duration: 120 }) : 0,
    backgroundColor: isNight
      ? 'rgba(255,255,255,0.12)'
      : 'rgba(0,0,0,0.08)',
  }));

  // Hide on reader screens
  const activeRouteName = state.routes[state.index]?.name ?? '';
  if (HIDDEN_ROUTES.has(activeRouteName)) return null;

  const handleLayout = (tabIndex: number, layout: LayoutRectangle) => {
    setLayouts((prev) => ({ ...prev, [tabIndex]: layout }));
  };

  const DOCK_WIDTH = Math.min(width - 40, 360);
  const tint = isNight ? 'dark' : 'light';

  const dockContent = (
    <>
      {/* Sliding pill highlight */}
      <Animated.View style={[styles.pill, pillStyle]} />

      {/* Tab items */}
      <View style={styles.row}>
        {visibleRoutes.map(({ route, routeIndex }, visibleIdx) => {
          const isFocused = routeIndex === state.index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <DockItem
              key={route.key}
              routeName={route.name}
              tabIndex={visibleIdx}
              totalTabs={visibleRoutes.length}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              onLayout={handleLayout}
              pressedIndex={pressedIndex}
              plate={plate}
              isNight={isNight}
              reduceMotion={reduceMotion}
            />
          );
        })}
      </View>
    </>
  );

  const glassStyle = [
    styles.glass,
    {
      borderColor: isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      backgroundColor: isNight ? 'rgba(18,18,18,0.6)' : 'rgba(255,255,255,0.72)',
    },
  ];

  return (
    <View
      style={[styles.wrapper, { width: DOCK_WIDTH, bottom: 24 }]}
      pointerEvents="box-none"
    >
      {isLiquidGlassSupported ? (
        <LiquidGlassView
          effect="regular"
          colorScheme={isNight ? 'dark' : 'light'}
          style={glassStyle}
        >
          {dockContent}
        </LiquidGlassView>
      ) : (
        <GlassBlur
          intensity={isNight ? 55 : 70}
          tint={tint}
          style={glassStyle}
        >
          {dockContent}
        </GlassBlur>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const DOCK_HEIGHT = 62;
const PILL_H = 44;
const DOT_SIZE = 4;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignSelf: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 14,
  },
  glass: {
    borderRadius: DOCK_HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    height: DOCK_HEIGHT,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  pill: {
    position: 'absolute',
    height: PILL_H,
    borderRadius: PILL_H / 2,
    top: (DOCK_HEIGHT - PILL_H) / 2,
    left: 0,
    zIndex: 0,
  },
  dockItem: {
    flex: 1,
    height: DOCK_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  itemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
