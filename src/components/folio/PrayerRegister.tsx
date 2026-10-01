import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ImageBackground, Animated, TouchableOpacity, Modal, ScrollView } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import { setAudioModeAsync } from 'expo-audio';
import { GlassBlur } from '../ui/GlassCard';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Line, Text as SvgText, Circle, Polygon } from 'react-native-svg';
import { Bell, BellOff, Settings, Sunrise, Sun, Cloud, Sunset, Moon, Play, Pause } from 'lucide-react-native';
import type { PrayerTimes } from '../../services/ummahApi';
import { Step } from '../../constants/folio';
import { Fonts } from '../../constants/theme';

const PRAYER_ICONS = {
  fajr:    Sunrise,
  dhuhr:   Sun,
  asr:     Cloud,
  maghrib: Sunset,
  isha:    Moon,
} as const;

const PRAYERS = [
  { key: 'fajr'    as const, name: 'Fajr' },
  { key: 'dhuhr'   as const, name: 'Dhuhr' },
  { key: 'asr'     as const, name: 'Asr' },
  { key: 'maghrib' as const, name: 'Maghrib' },
  { key: 'isha'    as const, name: 'Isha' },
];

function parseTime(raw: string | undefined): Date | null {
  if (!raw) return null;
  const [time, meridiem] = raw.split(' ');
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  let hours = h;
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  const d = new Date();
  d.setHours(hours, m, 0, 0);
  return d;
}

function formatClock(d: Date | null): string {
  if (!d) return '—';
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')}${d.getHours() < 12 ? 'am' : 'pm'}`;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'now';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'in a moment';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `in ${m}m`;
  return `in ${h}h ${m}m`;
}

interface PrayerRegisterProps {
  prayerTimes: PrayerTimes | null;
  qiblaAngle?: number | null;
}

export function PrayerRegister({ prayerTimes, qiblaAngle, onSettingsChange }: PrayerRegisterProps & { onSettingsChange?: (madhab: string, method: string) => void }) {
  const [now, setNow] = useState(() => new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [madhab, setMadhab] = useState('Shafi');
  const [calcMethod, setCalcMethod] = useState('MuslimWorldLeague');
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [globalBell, setGlobalBell] = useState(false);
  const [adhanPlaying, setAdhanPlaying] = useState(false);
  const adhanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roseAnim = useRef(new Animated.Value(0)).current;
  const headingRef = useRef(0);

  useEffect(() => {
    AsyncStorage.multiGet(['prayer_madhab', 'prayer_method', 'adhan_reminders', 'global_bell']).then(([[, m], [, c], [, r], [, g]]) => {
      if (m) setMadhab(m);
      if (c) setCalcMethod(c);
      if (r) {
        try {
          const parsed = JSON.parse(r);
          setReminders(parsed);
          // globalBell = true if ANY prayer has reminder on
          setGlobalBell(Object.values(parsed).some(Boolean));
        } catch(e) {}
      }
      if (g) setGlobalBell(g === 'true');
    });

    // Request notification permissions
    Notifications.requestPermissionsAsync();

    // Set up audio session
    setAudioModeAsync({
      playsInSilentMode: true,
    }).catch(() => {});
  }, []);

  const scheduleAdhanNotification = useCallback(async (entry: any) => {
    if (!entry.at) return;
    const trigger = entry.at.getTime() > Date.now() ? entry.at : new Date(entry.at.getTime() + 86400000);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🕌 ${entry.name} Prayer`,
        body: `It's time for ${entry.name}. Allahu Akbar!`,
        sound: 'adhan.wav',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
  }, []);

  const toggleReminder = async (entry: any) => {
    const isEnabled = !reminders[entry.key];
    const newReminders: Record<string, boolean> = { ...reminders, [entry.key]: isEnabled };
    setReminders(newReminders);
    AsyncStorage.setItem('adhan_reminders', JSON.stringify(newReminders));
    // Reflect on global bell
    setGlobalBell(Object.values(newReminders).some(Boolean));

    if (isEnabled) {
      await scheduleAdhanNotification(entry);
    } else {
      // Cancel all and reschedule only active ones
      await Notifications.cancelAllScheduledNotificationsAsync();
      for (const p of PRAYERS) {
        if (newReminders[p.key]) {
          const src = (prayerTimes?.prayer_times as any)?.[p.key];
          const at = parseTime(src);
          if (at) await scheduleAdhanNotification({ ...p, at });
        }
      }
    }
  };

  // Toggle ALL prayers on/off (master bell)
  const toggleGlobalBell = useCallback(async (on: boolean) => {
    setGlobalBell(on);
    AsyncStorage.setItem('global_bell', String(on));
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (on) {
      // Restore individual prefs if any exist, otherwise enable all
      const anyIndividual = Object.values(reminders).some(Boolean);
      const next: Record<string, boolean> = {};
      for (const p of PRAYERS) {
        const wasOn = anyIndividual ? !!reminders[p.key] : true;
        next[p.key] = wasOn;
        if (wasOn) {
          const src = (prayerTimes?.prayer_times as any)?.[p.key];
          const at = parseTime(src);
          if (at) await scheduleAdhanNotification({ ...p, at });
        }
      }
      setReminders(next);
      AsyncStorage.setItem('adhan_reminders', JSON.stringify(next));
    } else {
      // Turn everything off but preserve which ones were on
      const next: Record<string, boolean> = {};
      for (const p of PRAYERS) next[p.key] = false;
      setReminders(next);
      AsyncStorage.setItem('adhan_reminders', JSON.stringify(next));
    }
  }, [reminders, prayerTimes, scheduleAdhanNotification]);

  // Adhan preview – play through TrackPlayer
  const toggleAdhanPreview = useCallback(async () => {
    if (adhanPlaying) {
      await TrackPlayer.stop();
      if (adhanTimeoutRef.current) clearTimeout(adhanTimeoutRef.current);
      setAdhanPlaying(false);
    } else {
      // Load the bundled adhan.wav as a track
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: 'adhan-preview',
        // Use the local asset URI via require-resolve
        url: require('../../../assets/audio/adhan.wav'),
        title: 'Adhan Preview',
        artist: 'Lahzah',
      });
      await TrackPlayer.play();
      setAdhanPlaying(true);

      // Auto-reset UI after 30 s max (TrackPlayer handles auto-stop at end)
      adhanTimeoutRef.current = setTimeout(() => {
        setAdhanPlaying(false);
      }, 30000);
    }
  }, [adhanPlaying]);

  const applySettings = useCallback((m: string, c: string) => {
    setMadhab(m);
    setCalcMethod(c);
    AsyncStorage.multiSet([['prayer_madhab', m], ['prayer_method', c]]);
    onSettingsChange?.(m, c);
    setShowSettings(false);
  }, [onSettingsChange]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      subscription = await Location.watchHeadingAsync((headingData) => {
        // Use trueHeading if available, otherwise magHeading
        const newMag = headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
        
        let lastMag = headingRef.current;
        // Shortest path to avoid 360 -> 0 jumps
        let diff = newMag - (lastMag % 360);
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        
        const targetHeading = lastMag + diff;
        
        // Low pass filter to remove jitters (smooths it out)
        const smoothedHeading = lastMag + (targetHeading - lastMag) * 0.15;
        headingRef.current = smoothedHeading;
        
        Animated.timing(roseAnim, {
          toValue: -smoothedHeading,
          useNativeDriver: true,
          duration: 150, // smooth timing instead of bouncy spring
        }).start();
      });
    })();
    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  const entries = useMemo(() => {
    const source = prayerTimes?.prayer_times as Record<string, string> | undefined;
    const parsed = PRAYERS.map((p) => ({ ...p, at: parseTime(source?.[p.key]) }));

    const nowMs = now.getTime();
    let currentIndex = -1;
    for (let i = parsed.length - 1; i >= 0; i--) {
      const at = parsed[i].at;
      if (at && at.getTime() <= nowMs) {
        currentIndex = i;
        break;
      }
    }
    if (currentIndex === -1 && parsed.some((p) => p.at)) currentIndex = parsed.length - 1;

    let next = parsed.find((p) => p.at && p.at.getTime() > nowMs) ?? null;
    let nextAt = next?.at ?? null;
    if (!next && parsed[0].at) {
      next = parsed[0];
      const tomorrow = new Date(parsed[0].at!.getTime());
      tomorrow.setDate(tomorrow.getDate() + 1);
      nextAt = tomorrow;
    }

    return { parsed, currentIndex, next, nextAt };
  }, [prayerTimes, now]);

  const detail = (() => {
    if (!prayerTimes) return "Enable location to see today's prayers";
    if (!entries.next || !entries.nextAt) return 'Prayer times unavailable';
    return null;
  })();

  return (
    <>
    <View style={styles.wrapper}>
      <ImageBackground
        source={require('../../../assets/images/mosque_bg.jpg')}
        style={styles.imageBg}
        imageStyle={styles.imageStyle}
      >
        {/* Dark gradient overlay for legibility */}
        <View style={styles.darkOverlay} />

        <View style={styles.inner}>
          {/* ── Header with settings gear ── */}
          <View style={styles.registerHeader}>
            <Text style={styles.registerTitle}>Prayer Times</Text>
            <TouchableOpacity
              onPress={() => setShowSettings(true)}
              style={styles.gearBtn}
            >
              <Settings size={15} color="rgba(255,255,255,0.7)" />
              <Text style={styles.gearLabel}>
                {
                  {
                    MuslimWorldLeague: 'MWL',
                    Egyptian: 'Egypt',
                    Karachi: 'Karachi',
                    UmmAlQura: 'Umm Al-Qura',
                    NorthAmerica: 'ISNA',
                    Kuwait: 'Kuwait',
                    Qatar: 'Qatar',
                    Singapore: 'Singapore',
                    Turkey: 'Turkey'
                  }[calcMethod] ?? calcMethod
                }
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Prayer pill row ── */}
          <View style={styles.pillRow}>
            {entries.parsed.map((entry, i) => {
              const isCurrent = i === entries.currentIndex;
              const hasReminder = reminders[entry.key];
              return (
                <View key={entry.key} style={styles.pillWrapper}>
                  {isCurrent ? (
                    /* Active pill — solid white card */
                    <TouchableOpacity onPress={() => toggleReminder(entry)} style={[styles.pill, styles.pillActive]} activeOpacity={0.7}>
                      <View style={styles.bellContainer}>
                        {hasReminder
                    ? <Bell size={10} color="#1a1a2e" />
                    : <BellOff size={10} color="rgba(26,26,46,0.35)" />
                  }
                      </View>
                      {(() => { const Icon = PRAYER_ICONS[entry.key]; return <Icon size={16} color="#1a1a2e" style={styles.pillIcon} />; })()}
                      <Text style={[styles.pillName, styles.pillNameActive]}>{entry.name}</Text>
                      <Text style={[styles.pillTime, styles.pillTimeActive]}>{formatClock(entry.at)}</Text>
                    </TouchableOpacity>
                  ) : (
                    /* Inactive pill — frosted glass */
                    <TouchableOpacity onPress={() => toggleReminder(entry)} activeOpacity={0.7} style={{ flex: 1 }}>
                      <GlassBlur
                        intensity={20}
                        tint="light"
                        style={styles.pill}
                      >
                        <View style={styles.bellContainer}>
                          {hasReminder
                            ? <Bell size={10} color="rgba(255,255,255,0.85)" />
                            : <BellOff size={10} color="rgba(255,255,255,0.3)" />
                          }
                        </View>
                        <View style={styles.pillBlurInner}>
                          {(() => { const Icon = PRAYER_ICONS[entry.key]; return <Icon size={14} color="rgba(255,255,255,0.75)" style={styles.pillIcon} />; })()}
                          <Text style={styles.pillName}>{entry.name}</Text>
                          <Text style={styles.pillTime}>{formatClock(entry.at)}</Text>
                        </View>
                      </GlassBlur>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {/* ── Next prayer strip ── */}
          <View style={styles.strip}>
            {detail ? (
              <Text style={styles.stripDetail}>{detail}</Text>
            ) : (
              <>
                <View style={styles.stripLeft}>
                  {/* Functional Qibla Compass */}
                  <View style={styles.compassWrapper}>
                    {/* Layer 1: Rotating compass ROSE — rotates with device so N always faces geographic North */}
                    <Animated.View style={[styles.compassLayer, {
                      transform: [{ rotate: roseAnim.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] }) }]
                    }]}>
                      <Svg width={56} height={56} viewBox="-28 -28 56 56">
                        {/* Outer ring */}
                        <Circle cx={0} cy={0} r={25} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
                        {/* 8 tick marks */}
                        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
                          const rad = (deg - 90) * Math.PI / 180;
                          const isMajor = deg % 90 === 0;
                          const r1 = isMajor ? 22 : 23;
                          const r2 = 25;
                          return <Line key={deg}
                            x1={Math.cos(rad) * r1} y1={Math.sin(rad) * r1}
                            x2={Math.cos(rad) * r2} y2={Math.sin(rad) * r2}
                            stroke={isMajor ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)'}
                            strokeWidth={isMajor ? 1.5 : 1}
                          />;
                        })}
                        {/* Cardinal letters */}
                        <SvgText x={0} y={-14} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.95)" fontWeight="700">N</SvgText>
                        <SvgText x={14} y={4} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.65)">E</SvgText>
                        <SvgText x={0} y={21} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.45)">S</SvgText>
                        <SvgText x={-14} y={4} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.65)">W</SvgText>
                      </Svg>
                    </Animated.View>

                    {/* Layer 2: Qibla needle — fixed in geographic space, always points to Mecca */}
                    {/* It is NOT inside the rose container, so it is independently positioned */}
                    <Animated.View style={[styles.compassLayer, {
                      transform: [{ rotate: roseAnim.interpolate({
                        inputRange: [-360, 360],
                        outputRange: [
                          `${-360 + (qiblaAngle ?? 0)}deg`,
                          `${360 + (qiblaAngle ?? 0)}deg`,
                        ]
                      }) }]
                    }]}>
                      <Svg width={56} height={56} viewBox="-28 -28 56 56">
                        {/* Gold needle tip toward Kaaba */}
                        <Polygon points="0,-20 2.5,-4 -2.5,-4" fill="#f5c030" opacity={0.97} />
                        {/* Kaaba icon at needle tip */}
                        <SvgText x={0} y={-21} textAnchor="middle" fontSize={9}>🕋</SvgText>
                        {/* White tail */}
                        <Polygon points="0,16 2.5,2 -2.5,2" fill="rgba(255,255,255,0.4)" />
                        {/* Center dot */}
                        <Circle cx={0} cy={0} r={3} fill="#fff" opacity={0.9} />
                      </Svg>
                    </Animated.View>
                  </View>
                  <View>
                    <Text style={styles.stripCurrentName}>{entries.parsed[entries.currentIndex]?.name ?? ''}</Text>
                    <Text style={styles.stripCurrentTime}>{formatClock(entries.parsed[entries.currentIndex]?.at)}</Text>
                  </View>
                </View>
                <View style={styles.stripRight}>
                  <Text style={styles.stripNextLabel}>
                    Next prayer{' '}
                    <Text style={styles.stripNextName}>"{entries.next!.name}"</Text>
                  </Text>
                  <Text style={styles.stripNextTime}>
                    {formatRemaining(entries.nextAt!.getTime() - now.getTime())}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ImageBackground>
    </View>

      {/* ── Settings Modal ── */}
      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSettings(false)}>
          <GlassBlur intensity={60} tint="dark" style={styles.settingsSheet}>
            <View style={styles.settingsHandle} />
            <Text style={styles.settingsTitle}>Prayer Settings</Text>

            {/* ── Master Bell Toggle ── */}
            <View style={styles.masterBellRow}>
              <View style={styles.masterBellLeft}>
                <TouchableOpacity
                  onPress={() => toggleGlobalBell(!globalBell)}
                  style={[styles.masterBellBtn, { backgroundColor: globalBell ? 'rgba(245,192,48,0.2)' : 'rgba(255,255,255,0.08)', borderColor: globalBell ? '#f5c030' : 'rgba(255,255,255,0.15)' }]}
                  activeOpacity={0.7}
                >
                  {globalBell ? <Bell size={20} color="#f5c030" /> : <BellOff size={20} color="rgba(255,255,255,0.5)" />}
                </TouchableOpacity>
                <View style={{ gap: 2 }}>
                  <Text style={styles.masterBellTitle}>Prayer Reminders</Text>
                  <Text style={styles.masterBellSub}>
                    {globalBell ? `${Object.values(reminders).filter(Boolean).length} of 5 active` : 'All reminders off'}
                  </Text>
                </View>
              </View>

              {/* Adhan Preview */}
              <TouchableOpacity
                onPress={toggleAdhanPreview}
                style={[styles.adhanPreviewBtn, { backgroundColor: adhanPlaying ? 'rgba(245,192,48,0.2)' : 'rgba(255,255,255,0.08)', borderColor: adhanPlaying ? '#f5c030' : 'rgba(255,255,255,0.15)' }]}
                activeOpacity={0.8}
              >
                {adhanPlaying ? <Pause size={16} color="#f5c030" /> : <Play size={16} color="rgba(255,255,255,0.7)" />}
                <Text style={[styles.adhanPreviewLabel, { color: adhanPlaying ? '#f5c030' : 'rgba(255,255,255,0.7)' }]}>
                  {adhanPlaying ? 'Stop' : 'Listen'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Calculation Method ── */}
            <Text style={styles.settingsSectionLabel}>Calculation Method</Text>
            <View style={styles.settingsGrid}>
              {[
                { id: 'MuslimWorldLeague', label: 'Muslim World League' },
                { id: 'Egyptian',          label: 'Egyptian' },
                { id: 'Karachi',           label: 'Karachi' },
                { id: 'UmmAlQura',         label: 'Umm Al-Qura' },
                { id: 'NorthAmerica',      label: 'ISNA (N. America)' },
                { id: 'Kuwait',            label: 'Kuwait' },
                { id: 'Qatar',             label: 'Qatar' },
                { id: 'Singapore',         label: 'Singapore' },
                { id: 'Turkey',            label: 'Turkey' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => applySettings(madhab, opt.id)}
                  style={[
                    styles.settingsGridChip,
                    { backgroundColor: calcMethod === opt.id ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', borderColor: calcMethod === opt.id ? '#ffffff' : 'rgba(255,255,255,0.1)' },
                  ]}
                >
                  <Text style={[styles.settingsGridText, { color: calcMethod === opt.id ? '#ffffff' : 'rgba(255,255,255,0.75)' }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassBlur>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: Step.bandGap,
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageBg: {
    width: '100%',
  },
  imageStyle: {
    borderRadius: 20,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 10, 30, 0.52)',
  },
  inner: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 14,
  },

  /* ── Pills ── */
  pillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pillWrapper: {
    flex: 1,
  },
  pill: {
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 80,
  },
  pillBlurInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  pillActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    gap: 3,
  },
  pillIcon: {
    marginBottom: 2,
  },
  pillName: {
    fontFamily: Fonts.display,
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.3,
  },
  pillNameActive: {
    color: '#1a1a2e',
    fontFamily: Fonts.display,
    fontSize: 10,
  },
  pillTime: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
  },
  pillTimeActive: {
    color: '#1a1a2e',
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    fontWeight: '600',
  },
  bellContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
  },

  /* ── Strip ── */
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.18)',
    paddingTop: 12,
  },
  stripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stripCurrentName: {
    fontFamily: Fonts.display,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  stripCurrentTime: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  stripRight: {
    alignItems: 'flex-end',
    gap: 1,
  },
  stripNextLabel: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  stripNextName: {
    fontFamily: Fonts.display,
    color: 'rgba(255,255,255,0.8)',
  },
  stripNextTime: {
    fontFamily: Fonts.display,
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
  compassWrapper: {
    width: 56,
    height: 56,
    position: 'relative',
    marginRight: 10,
  },
  compassLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 56,
    height: 56,
  },
  stripDetail: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },

  /* ── Register Header ── */
  registerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  registerTitle: {
    fontFamily: Fonts.display,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  gearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  gearLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },

  /* ── Settings Modal ── */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  settingsSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
    gap: 16,
    overflow: 'hidden',
  },
  settingsHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  settingsTitle: {
    fontFamily: Fonts.display,
    fontSize: 27,
    color: '#fff',
    letterSpacing: -0.2,
  },
  settingsSectionLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: -8,
  },
  settingsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  settingsChip: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  settingsChipText: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
  },
  settingsChipSub: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  settingsGridChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingsGridText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
  },

  /* ── Master Bell Row ── */
  masterBellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  masterBellLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  masterBellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterBellTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    color: '#fff',
  },
  masterBellSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
  },
  adhanPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  adhanPreviewLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
  },
});
