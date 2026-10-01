import React, { createContext, useContext } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView, type BlurTint } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { useAppTheme } from '../../hooks/useAppTheme';

// ─── GlassBlur ─────────────────────────────────────────────────────────────────
/**
 * Drop-in replacement for `BlurView` that upgrades to `LiquidGlassView` on
 * iOS 26+ devices. Use this everywhere you previously used `BlurView` so that
 * the liquid glass effect rolls out app-wide automatically.
 *
 * Props mirror BlurView so migration is a 1:1 rename.
 */
interface GlassBlurProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: BlurTint;
  /** Pass 'dark' to use the dark liquid glass effect variant. */
  colorScheme?: 'light' | 'dark' | 'system';
  effect?: 'regular' | 'none' | 'clear';
}

export function GlassBlur({
  children,
  style,
  intensity = 20,
  tint,
  effect = 'regular',
  colorScheme,
}: GlassBlurProps) {
  const { isDark } = useAppTheme();
  const resolvedColorScheme = colorScheme ?? (tint === 'dark' || isDark ? 'dark' : 'light');

  if (isLiquidGlassSupported) {
    return (
      <LiquidGlassView effect={effect} colorScheme={resolvedColorScheme} style={style}>
        {children}
      </LiquidGlassView>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={tint ?? (isDark ? 'dark' : 'light')}
      style={style}
    >
      {children}
    </BlurView>
  );
}

/**
 * Cards rendered inside this provider paint a solid fill instead of a blur.
 * `react-native-view-shot` cannot snapshot a native blur layer, so anything
 * destined for a captured image (see ShareableCard) must opt out.
 */
export const GlassSolidContext = createContext(false);

/** Default corner radius for every glass surface in the app. */
export const GLASS_RADIUS = 20;

/**
 * `auto` follows the colour scheme and suits glass over the app background.
 * `onColor` suits glass over a saturated gradient with light text on top.
 */
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

  // We match the exact Glass specs of PrayerRegister pills
  // (intensity: 20, no heavy fill) so it remains highly transparent.
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
  /** Colour of the thick left edge. Omit for a plain hairline all round. */
  accent?: string;
  /** Blur strength, 1–100. Defaults are tuned per tone. */
  intensity?: number;
  radius?: number;
  tone?: GlassTone;
}

/**
 * A frosted translucent panel: native blur, a hairline light edge, a very low
 * opacity fill for text legibility, and a top sheen that reads as reflection.
 *
 * On Android the blur falls back to a semi-transparent view unless the screen
 * wraps its background in a `BlurTargetView`; the fill and sheen are tuned so
 * the card still reads as glass in that case.
 */
export function GlassCard({
  children,
  style,
  accent,
  intensity,
  radius = GLASS_RADIUS,
  tone = 'auto',
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
    return (
      <LiquidGlassView
        effect="regular"
        colorScheme={isDark ? "dark" : "light"}
        style={containerStyle}
      >
        {/* We retain a very light fill if requested, otherwise LiquidGlass handles the refraction */}
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: tones.fill }]}
          pointerEvents="none"
        />
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
 * The glass edge and sheen on their own, as an overlay.
 *
 * For surfaces that already own their fill — the gradient hero cards — and so
 * cannot be a `GlassCard`, but should still read as part of the same material.
 * Render it as the last child of a container with `overflow: 'hidden'`.
 */
export function GlassEdge({ radius = GLASS_RADIUS, tone = 'auto' }: GlassEdgeProps) {
  const tones = useTones(tone);
  const solid = useContext(GlassSolidContext);

  if (solid) return null;

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
    overflow: 'hidden', // borderRadius is not honoured by BlurView without this
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
