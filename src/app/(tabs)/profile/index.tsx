import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ArrowRight, ChevronRight, Users, LogOut, Bell, User, Settings, Headphones, Lock } from 'lucide-react-native';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { supabase } from '../../../lib/supabase';
import { useReadingProgress } from '../../../hooks/useReadingProgress';
import { useStreak } from '../../../hooks/useStreak';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Fonts } from '../../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { ENGLISH_SURAH_NAMES } from '../../../data/surahs';
import { StreakCard } from '../../../components/home/StreakCard';
import { GlassCard, GlassEdge } from '../../../components/ui/GlassCard';

const smoothEntry = FadeInDown.duration(500).easing(Easing.out(Easing.cubic));

interface ProfileMenuItemProps {
  Icon: React.ComponentType<any>;
  label: string;
  sub?: string;
  onPress?: () => void;
  colors: any;
  isDestructive?: boolean;
}

function MenuItem({ Icon, label, sub, onPress, colors, isDestructive }: ProfileMenuItemProps) {
  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 16,
        paddingHorizontal: 20, paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(150,150,150,0.1)',
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: isDestructive ? '#FFF0EE' : colors.primary + '10',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={isDestructive ? '#E53935' : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontFamily: Fonts.sansSemiBold, color: isDestructive ? '#E53935' : colors.text }}>{label}</Text>
        {sub && <Text style={{ fontSize: 12, fontFamily: Fonts.sans, color: colors.textTertiary, marginTop: 2 }}>{sub}</Text>}
      </View>
      {!isDestructive && <ChevronRight size={18} color={colors.textTertiary} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const { position } = useReadingProgress();
  const { streakCount } = useStreak();
  const [email, setEmail] = useState<string | null>(null);
  const [initials, setInitials] = useState('?');
  const [name, setName] = useState('Lahzah User');
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hifzCount, setHifzCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        setEmail(user.email ?? null);
        
        // Fetch detailed profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        const displayStr = profile?.full_name || user.email || '?';
        const namePart = displayStr.split('@')[0];
        setName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
        const parts = namePart.split(/[ .]/);
        setInitials(parts.map((p: string) => p[0]?.toUpperCase()).join('').slice(0, 2));
      }
      setLoading(false);
    })();

    // Re-check login state when auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      if (!session) {
        setLoading(false);
        setName('Lahzah User');
        setInitials('?');
        setEmail(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Re-fetch hifz count and reading position every time this tab comes into focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { count } = await supabase
          .from('hifz_progress')
          .select('verse_key', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setHifzCount(count ?? 0);
      })();
    }, [])
  );

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          // No forced redirect — auth gate in this screen handles it
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // ── Auth gate: show sign-in prompt when not logged in ──────────────────────
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }]}>
        <Animated.View entering={smoothEntry} style={{ alignItems: 'center', gap: 20 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: colors.primary + '18',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 4,
          }}>
            <Lock size={32} color={colors.primary} />
          </View>
          <Text style={{ fontFamily: Fonts.display, fontSize: 24, color: colors.text, textAlign: 'center' }}>
            Your Profile
          </Text>
          <Text style={{ fontFamily: Fonts.sans, fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
            Sign in to track your reading streak, memorisation progress, and personal settings.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 40,
              borderRadius: 28, marginTop: 8,
            }}
            onPress={() => router.push('/auth')}
            activeOpacity={0.85}
          >
            <Text style={{ fontFamily: Fonts.sansSemiBold, fontSize: 16, color: '#fff' }}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/auth')} activeOpacity={0.7}>
            <Text style={{ fontFamily: Fonts.sans, fontSize: 14, color: colors.primary }}>Create an account</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const readingLabel = position
    ? `${ENGLISH_SURAH_NAMES[position.surahNumber] ?? `Surah ${position.surahNumber}`} · Ayah ${position.ayahNumber}`
    : 'Not started';

  return (
    <ImageBackground
      source={require('../../../../assets/images/background_image.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={
            isDark
              ? ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']
              : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.85)']
          }
          style={StyleSheet.absoluteFill}
        />
      </View>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          
          {/* Avatar Section */}
          <Animated.View entering={smoothEntry} style={styles.avatarSection}>
            <View style={styles.avatarGlow}>
              <LinearGradient
                colors={[colors.primary, colors.primary + '80']}
                style={styles.avatar}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            </View>
            <Text style={styles.nameText}>{name}</Text>
            <Text style={styles.emailText}>{email}</Text>
          </Animated.View>

          {/* Stats Row */}
          <Animated.View entering={smoothEntry.delay(60)} style={styles.statsRow}>
            <GlassCard style={styles.statCard} radius={20}>
              <Text style={styles.statNumber}>{streakCount}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </GlassCard>
            <GlassCard style={styles.statCard} radius={20}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{hifzCount}</Text>
              <Text style={styles.statLabel}>Hifz Progress</Text>
            </GlassCard>
            <GlassCard style={styles.statCard} radius={20}>
              <Text style={styles.statNumber}>{position?.ayahNumber ?? 0}</Text>
              <Text style={styles.statLabel}>Last Ayah</Text>
            </GlassCard>
          </Animated.View>

          {/* Reading progress detail */}
          <Animated.View entering={smoothEntry.delay(100)} style={{ marginHorizontal: 20, marginBottom: 24 }}>
            <GlassCard style={styles.card} radius={24}>
              <Text style={styles.progressLabel}>Reading Progress</Text>
              <Text style={styles.progressValue}>{readingLabel}</Text>
              <TouchableOpacity style={styles.continueBtn} onPress={() => router.push('/reader')}>
                <Text style={styles.continueBtnText}>Continue Reading</Text>
                <ArrowRight size={16} color={colors.primary} />
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>

          {/* Streak Calendar */}
          <Animated.View entering={smoothEntry.delay(120)} style={{ marginBottom: 24 }}>
            <StreakCard />
          </Animated.View>

          {/* Account Menu */}
          <Animated.View entering={smoothEntry.delay(140)} style={{ marginHorizontal: 20, marginBottom: 24 }}>
            <GlassCard style={styles.cardMenu} radius={24}>
              <MenuItem Icon={User} label="My Profile" onPress={() => router.push('/profile/edit')} colors={colors} />
              <MenuItem Icon={Bell} label="Notifications" onPress={() => router.push('/profile/notifications')} colors={colors} />
              <MenuItem Icon={Headphones} label="Audio Manager" onPress={() => router.push('/profile/audio-manager')} colors={colors} />
              <MenuItem Icon={Users} label="My Circles" onPress={() => router.push('/messages')} colors={colors} />
            </GlassCard>
          </Animated.View>

          {/* Logout */}
          <Animated.View entering={smoothEntry.delay(180)} style={{ marginHorizontal: 20 }}>
            <GlassCard style={styles.cardMenu} radius={24}>
              <MenuItem Icon={LogOut} label="Logout" onPress={handleSignOut} colors={colors} />
            </GlassCard>
          </Animated.View>

          {/* Version */}
          <Text style={styles.version}>Lahzah v1.0 · لحظة</Text>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    header: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    headerTitle: {
      fontFamily: Fonts.display,
      fontSize: 16,
      color: colors.text,
    },
    avatarSection: {
      alignItems: 'center', 
      paddingVertical: 24,
    },
    avatarGlow: {
      padding: 6,
      borderRadius: 50,
      backgroundColor: isDark ? colors.surface : '#FFFFFF',
      shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
      elevation: 10,
      marginBottom: 20,
    },
    avatar: {
      width: 88, height: 88, borderRadius: 44,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontFamily: Fonts.display, fontSize: 36, color: '#fff' },
    nameText: { fontFamily: Fonts.sansBold, fontSize: 24, color: colors.text, marginBottom: 4, letterSpacing: -0.5 },
    emailText: { fontFamily: Fonts.sans, fontSize: 14, color: colors.textTertiary, opacity: 0.8 },
    statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 32 },
    statCard: {
      flex: 1, 
      paddingVertical: 18, alignItems: 'center',
      borderWidth: 0,
    },
    statNumber: { fontFamily: Fonts.sansBold, fontSize: 28, color: colors.text, marginBottom: 2, letterSpacing: -1 },
    statLabel: { fontFamily: Fonts.sansMedium, fontSize: 12, color: colors.textTertiary, textAlign: 'center' },
    card: {
      padding: 24, 
      borderWidth: 0,
    },
    cardMenu: {
      borderWidth: 0,
      overflow: 'hidden',
    },
    progressLabel: { fontFamily: Fonts.sansMedium, fontSize: 12, color: colors.textTertiary, marginBottom: 8 },
    progressValue: { fontFamily: Fonts.sansBold, fontSize: 18, color: colors.text, marginBottom: 16 },
    continueBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    continueBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: colors.primary },
    version: { fontFamily: Fonts.mono, textAlign: 'center', fontSize: 11, color: colors.textTertiary, marginTop: 32, opacity: 0.6 },
  });
