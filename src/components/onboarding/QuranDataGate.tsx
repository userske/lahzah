/**
 * QuranDataGate
 *
 * Never blocks the app. Renders children immediately.
 * On first launch, starts the Quran data preload in the background and
 * shows a small non-blocking toast at the bottom of the screen.
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
  const { plate } = useFolio();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<PreloadProgress | null>(null);
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const done = await isPreloadComplete();
      if (done || cancelled) return;

      // Start background download — app stays fully usable
      setDownloading(true);
      Animated.timing(bannerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

      startPreload((p) => {
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
              Animated.timing(bannerOpacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }).start(() => setDownloading(false));
            }
          }, 1000);
        }
      }).catch(e => console.warn('[QuranDataGate] preload error:', e));
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <View style={{ flex: 1 }}>
      {children}
    </View>
  );
}

