/**
 * QuranDataGate
 *
 * Wraps the app root. On first launch (or after a data version bump),
 * renders a full-screen progress UI while the 604 page JSONs download
 * from R2. Once done it renders children and never shows again.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useFolio } from '../../hooks/useFolio';
import {
  isPreloadComplete,
  PreloadProgress,
  startPreload,
} from '../../services/quranPreload';

export function QuranDataGate({ children }: { children: React.ReactNode }) {
  const { plate, isNight: isDark } = useFolio();
  const [ready, setReady] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<PreloadProgress | null>(null);
  const barWidth = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const done = await isPreloadComplete();
      if (done) {
        setReady(true);
        return;
      }

      setReady(false);
      await startPreload((p) => {
        if (cancelled) return;
        setProgress(p);
        Animated.timing(barWidth, {
          toValue: p.percent,
          duration: 300,
          useNativeDriver: false,
        }).start();
        if (p.phase === 'done') {
          setTimeout(() => {
            if (!cancelled) {
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }).start(() => setReady(true));
            }
          }, 600);
        }
      });
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (ready === null) return null;
  if (ready) return <>{children}</>;

  const phaseLabel =
    progress?.phase === 'surahs'
      ? 'Preparing surah data…'
      : progress?.phase === 'done'
      ? 'Done!'
      : 'Downloading Quran pages…';

  const percent = progress?.percent ?? 0;

  return (
    <Animated.View style={[styles.gate, { backgroundColor: plate.ground, opacity: fadeAnim }]}>
      <View style={styles.inner}>
        <Text style={[styles.logo, { color: plate.ink }]}>لَحظَة</Text>
        <Text style={[styles.logoEn, { color: plate.graphite }]}>Lahzah</Text>
        <View style={styles.spacer} />
        <View style={[styles.track, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
          <Animated.View
            style={[
              styles.fill,
              {
                backgroundColor: plate.accent,
                width: barWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={[styles.label, { color: plate.graphite }]}>{phaseLabel}</Text>
        <Text style={[styles.percent, { color: plate.ink }]}>{percent}%</Text>
        <Text style={[styles.note, { color: plate.graphite }]}>
          This only happens once. The Quran will be available offline after this.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gate: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  inner: {
    width: '80%',
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'AmiriQuran',
    fontSize: 52,
    textAlign: 'center',
    marginBottom: 4,
  },
  logoEn: {
    fontFamily: 'Syne_700Bold',
    fontSize: 18,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  spacer: { height: 48 },
  track: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  fill: { height: '100%', borderRadius: 2 },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'center',
  },
  percent: {
    fontFamily: 'Syne_700Bold',
    fontSize: 28,
    marginBottom: 24,
  },
  note: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.7,
  },
});
