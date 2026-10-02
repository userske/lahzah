import React, { createContext, useContext } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView, type BlurTint } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  LiquidGlassView,
  LiquidGlassContainerView,
  isLiquidGlassSupported,
} from '@callstack/liquid-glass';
import { useAppTheme } from '../../hooks/useAppTheme';

// ─── GlassBlur ─────────────────────────────────────────────────────────────────
/**
 * Drop-in replacement for BlurView that upgrades to LiquidGlassView on iOS 26+.
 *
 * Valid effect values per the @callstack/liquid-glass library: 'clear' | 'regular'
 * colorScheme is intentionally NOT set — the library defaults to 'system',
 * which auto-adapts to light/dark mode without any manual wiring.
 */
interface GlassBlurProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: BlurTint;
  effect?: 'regular' | 'clear';
  interactive?: boolean;
}

export function GlassBlur({
  children,
  style,
  intensity = 20,
  tint,
  effect = 'regular',
  interactive = false,
}: GlassBlurProps) {
  const { isDark } = useAppTheme();

  if (isLiquidGlassSupported) {
    return (
      <LiquidGlassView effect={effect} interactive={interactive} style={style}>
        {children}
      </LiquidGlassView>
    );
  }

  return (
    <BlurView intensity={intensity} tint={tint ?? (isDark ? 'dark' : 'light')} style={style}>
      {children}
    </BlurView>
  );
}

// ─── GlassContainer ────────────────────────────────────────────────────────────
/**
 * Wrap multiple GlassBlur / LiquidGlassView siblings inside this to get the
 * liquid morphing / merging effect between adjacent glass surfaces (iOS 26+).
 * Falls back to a plain View on other platforms.
 */
interface GlassContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  spacing?: number;
}

export function GlassContainer({ children, style, spacing = 8 }: GlassContainerProps) {
  if (isLiquidGlassSupported) {
    return (
      <LiquidGlassContainerView spacing={spacing} style={style}>
        {children}
      </LiquidGlassContainerView>
    );
  }
  return <View style={style}>{children}</View>;
}

/**
 * Cards rendered inside this provider paint a solid fill instead of a blur.
 * react-native-view-shot cannot snapshot a native blur layer, so anything
 * destined for a captured image (see ShareableCard) must opt out.
 */
export const GlassSolidContext = createContext(false);

/** Default corner radius for every glass surface in the app. */
export const GLASS_RADIUS = 20;

export type GlassTone = 'auto' | 'onColor';

interface Tones {
  edge: string;
  fill: string;
  sheen: [string, string];
  tint: BlurTint;
  intensity: number;
}

function useTones(tone: GlassTone): Tones {
  const { isDark } = useAppTheme();

  if (tone === 'onColor') {
    return {
      edge: 'rgba(255,255,255,0.36)',
      fill: 'rgba(255,255,255,0.18)',
      sheen: ['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)'],
      tint: 'light' as BlurTint,
      intensity: 22,
    };
  }

  return isDark
    ? {
        edge: 'rgba(255,255,255,0.08)',
        fill: 'rgba(255,255,255,0.02)',
        sheen: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)'],
        tint: 'dark' as BlurTint,
        intensity: 20,
      }
    : {
        edge: 'rgba(255,255,255,0.4)',
        fill: 'transparent',
        sheen: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)'],
        tint: 'light' as BlurTint,
        intensity: 20,
      };
}

interface GlassCardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: string;
  intensity?: number;
  radius?: number;
  tone?: GlassTone;
  effect?: 'regular' | 'clear';
}

export function GlassCard({
  children,
  style,
  accent,
  intensity,
  radius = GLASS_RADIUS,
  tone = 'auto',
  effect = 'regular',
}: GlassCardProps) {
  const tones = useTones(tone);
  const { isDark } = useAppTheme();
  const solid = useContext(GlassSolidContext);

  const containerStyle = [
    styles.container,
    {
      borderRadius: radius,
      borderColor: tones.edge,
      ...(accent ? { borderLeftWidth: 3, borderLeftColor: accent } : null),
    },
    style,
  ];

  if (solid) {
    return (
      <View style={containerStyle}>
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#141414' : '#fbfbfa' }]}
          pointerEvents="none"
        />
        {children}
      </View>
    );
  }

  if (isLiquidGlassSupported) {
    // colorScheme intentionally omitted — library defaults to 'system' (auto light/dark).
    return (
      <LiquidGlassView effect={effect} style={containerStyle}>
        {children}
      </LiquidGlassView>
    );
  }

  return (
    <View style={containerStyle}>
      <BlurView
        intensity={intensity ?? tones.intensity}
        tint={tones.tint}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: tones.fill }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={tones.sheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.sheen}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

interface GlassEdgeProps {
  radius?: number;
  tone?: GlassTone;
}

/**
 * The glass edge and sheen overlay for surfaces that own their own fill.
 * Returns null on iOS 26+ — LiquidGlassView handles edges natively.
 */
export function GlassEdge({ radius = GLASS_RADIUS, tone = 'auto' }: GlassEdgeProps) {
  const tones = useTones(tone);
  const solid = useContext(GlassSolidContext);

  if (solid) return null;
  if (isLiquidGlassSupported) return null;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { borderRadius: radius, borderColor: tones.edge },
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={tones.sheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.sheen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 72,
  },
});
