/**
 * AudioMessageBubble
 *
 * Renders a voice note inside a chat bubble with:
 * - Play / Pause toggle
 * - Animated waveform bars (driven by metering data stored in the message)
 * - Duration counter (mm:ss)
 * - Progress scrub bar
 *
 * Uses expo-audio for playback (works in EAS native builds).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Fonts } from '../../constants/theme';

// ── helpers ──────────────────────────────────────────────────────────
function fmtDuration(ms: number) {
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Static bar heights to represent a waveform (no live metering on old messages)
const BAR_HEIGHTS = [
  6, 10, 16, 24, 18, 12, 20, 28, 22, 14,
  8, 18, 26, 30, 20, 10, 16, 22, 12, 8,
  20, 28, 18, 10, 24, 32, 22, 14, 10, 18,
];

// ── Component ─────────────────────────────────────────────────────────
interface AudioMessageBubbleProps {
  url: string;
  durationMs: number;
  isOwn: boolean;
  colors: any;
}

export function AudioMessageBubble({
  url,
  durationMs,
  isOwn,
  colors,
}: AudioMessageBubbleProps) {
  const player = useAudioPlayer({ uri: url });
  const status = useAudioPlayerStatus(player);
  const [loading, setLoading] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const barAnims = useRef(BAR_HEIGHTS.map(() => new Animated.Value(1))).current;

  const isPlaying = status.playing;
  const positionMs = (status.currentTime ?? 0) * 1000;
  const totalMs = durationMs || (status.duration ? status.duration * 1000 : 0);
  const progress = totalMs > 0 ? Math.min(positionMs / totalMs, 1) : 0;

  // Sync progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Animate waveform bars while playing
  useEffect(() => {
    if (isPlaying) {
      const anims = barAnims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1.4 + Math.random() * 0.6,
              duration: 300 + i * 30,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.6,
              duration: 300 + i * 20,
              useNativeDriver: true,
            }),
          ])
        )
      );
      anims.forEach(a => a.start());
      return () => anims.forEach(a => a.stop());
    } else {
      barAnims.forEach(a => a.setValue(1));
    }
  }, [isPlaying]);

  const handleToggle = async () => {
    if (loading) return;
    try {
      setLoading(true);
      if (isPlaying) {
        player.pause();
      } else {
        // If finished, seek to start
        if (progress >= 0.99) {
          player.seekTo(0);
        }
        player.play();
      }
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = isOwn ? '#fff' : colors.primary;
  const trackColor = isOwn ? 'rgba(255,255,255,0.3)' : colors.border;
  const fillColor = isOwn ? '#fff' : colors.primary;

  return (
    <View style={styles.container}>
      {/* Play/Pause button */}
      <TouchableOpacity
        style={[styles.playBtn, { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : colors.primaryLight }]}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color={primaryColor} />
        ) : isPlaying ? (
          <Pause size={16} color={primaryColor} fill={primaryColor} />
        ) : (
          <Play size={16} color={primaryColor} fill={primaryColor} />
        )}
      </TouchableOpacity>

      {/* Waveform + progress */}
      <View style={styles.waveArea}>
        {/* Waveform bars */}
        <View style={styles.waveform}>
          {BAR_HEIGHTS.map((h, i) => (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  height: h,
                  backgroundColor:
                    i / BAR_HEIGHTS.length <= progress
                      ? fillColor
                      : (isOwn ? 'rgba(255,255,255,0.35)' : colors.border),
                  transform: [{ scaleY: barAnims[i] }],
                },
              ]}
            />
          ))}
        </View>

        {/* Progress track (thin line under waveform) */}
        <View style={[styles.track, { backgroundColor: trackColor }]}>
          <Animated.View
            style={[
              styles.trackFill,
              {
                backgroundColor: fillColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Duration */}
      <Text style={[styles.duration, { color: isOwn ? 'rgba(255,255,255,0.75)' : colors.textTertiary }]}>
        {progress > 0 ? fmtDuration(positionMs) : fmtDuration(totalMs)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    minWidth: 200,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveArea: {
    flex: 1,
    gap: 4,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 32,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    flex: 1,
  },
  track: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  trackFill: {
    height: 2,
    borderRadius: 1,
  },
  duration: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    minWidth: 34,
    textAlign: 'right',
  },
});
