import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, BookOpen, ChevronRight, Clock, Link, PlusCircle, RefreshCw, Send, Target, UserCheck, UserPlus, Users, Video, LogOut, Trash2, Lock } from 'lucide-react-native';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../../lib/supabase';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface Circle {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  memberCount?: number;
  activeToday?: number;
  myNiyyah?: string;
  myRole?: string;
}

interface Member {
  user_id: string;
  joined_at: string;
  niyyah?: string;
  readToday?: boolean;
}

// ─── Hook: useCircles ─────────────────────────────────────────────────────────
function useCircles() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    // Fetch display name
    const { data: profile } = await supabase.from('users').select('display_name').eq('id', user.id).single();
    if (profile?.display_name) setDisplayName(profile.display_name);

    // Fetch user's circles
    const { data: memberships } = await supabase
      .from('circle_members')
      .select(`
        circle_id,
        niyyah,
        role,
        circles ( id, name, invite_code, created_at )
      `)
      .eq('user_id', user.id);

    if (!memberships) { setLoading(false); return; }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const enriched: Circle[] = await Promise.all(
      memberships.map(async (m: any) => {
        const circle = m.circles;
        if (!circle) return null;

        // Member count
        const { count: memberCount } = await supabase
          .from('circle_members')
          .select('user_id', { count: 'exact', head: true })
          .eq('circle_id', circle.id);

        // Active today
        const { data: allMembers } = await supabase
          .from('circle_members')
          .select('user_id')
          .eq('circle_id', circle.id);

        const memberIds = (allMembers ?? []).map((x: any) => x.user_id);
        let activeToday = 0;
        if (memberIds.length > 0) {
          const { count } = await supabase
            .from('reading_progress')
            .select('user_id', { count: 'exact', head: true })
            .in('user_id', memberIds)
            .gte('updated_at', todayStart.toISOString());
          activeToday = count ?? 0;
        }

        return { ...circle, memberCount: memberCount ?? 0, activeToday, myNiyyah: m.niyyah, myRole: m.role ?? 'member' };
      })
    );

    setCircles(enriched.filter(Boolean) as Circle[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const createCircle = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: circle, error } = await supabase
      .from('circles')
      .insert({ name, invite_code: inviteCode, created_by: user.id })
      .select()
      .single();

    if (error) { Alert.alert('Error', error.message); return null; }

    // Auto-join as creator with ADMIN role so RLS SELECT policy works immediately
    const { error: joinError } = await supabase
      .from('circle_members')
      .insert({ circle_id: circle.id, user_id: user.id, role: 'admin', status: 'approved' });

    if (joinError) { Alert.alert('Error', joinError.message); return null; }

    // Small delay to let Supabase replication settle before reloading
    await new Promise(r => setTimeout(r, 400));
    await load();
    return circle;
  };

  const joinCircle = async (code: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: circle } = await supabase
      .from('circles')
      .select('id, name, require_approval')
      .eq('invite_code', code.toUpperCase())
      .maybeSingle();

    if (!circle) { Alert.alert('Invalid Code', 'No circle found with that invite code.'); return; }

    const status = circle.require_approval ? 'pending' : 'approved';
    const { error } = await supabase
      .from('circle_members')
      .insert({ circle_id: circle.id, user_id: user.id, status });

    if (error?.code === '23505') {
      Alert.alert('Already joined', `You are already in or have requested to join "${circle.name}".`);
    } else if (error) {
      Alert.alert('Error', error.message);
    } else {
      if (status === 'pending') {
        Alert.alert('Request Sent', `Your request to join "${circle.name}" has been sent to the admins for approval.`);
      } else {
        Alert.alert('Joined!', `Welcome to "${circle.name}" ✦`);
        await load();
      }
    }
  };

  const setNiyyah = async (circleId: string, niyyah: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('circle_members')
      .update({ niyyah })
      .eq('circle_id', circleId)
      .eq('user_id', user.id);
    await load();
  };

  const leaveCircle = async (circleId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('circle_members')
      .delete()
      .eq('circle_id', circleId)
      .eq('user_id', user.id);
    setCircles(prev => prev.filter(c => c.id !== circleId));
  };

  const deleteCircle = async (circleId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('circles').delete().eq('id', circleId);
    if (error) { Alert.alert('Error deleting circle', error.message); return; }
    setCircles(prev => prev.filter(c => c.id !== circleId));
  };

  return { circles, loading, userId, displayName, createCircle, joinCircle, setNiyyah, leaveCircle, deleteCircle, refresh: load };
}

// ─── Main Circles Screen ──────────────────────────────────────────────────────
export default function CirclesScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const { circles, loading, userId, displayName, createCircle, joinCircle, setNiyyah, leaveCircle, deleteCircle, refresh } = useCircles();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = checking
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const smoothEntry = FadeInDown.duration(500).easing(Easing.out(Easing.exp));

  // Auth check for circles gate
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Deep link handler: lahzah://circles/join/CODE
  useEffect(() => {
    const handleURL = (url: string | null) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      // Match path: circles/join/CODE
      const pathParts = (parsed.path ?? '').split('/');
      if (pathParts[0] === 'circles' && pathParts[1] === 'join' && pathParts[2]) {
        const code = pathParts[2].toUpperCase();
        setJoinCode(code);
        setShowJoin(true);
      }
    };

    // Handle URL that launched the app cold
    Linking.getInitialURL().then(handleURL);

    // Handle URL while app is already open
    const sub = Linking.addEventListener('url', ({ url }) => handleURL(url));
    return () => sub.remove();
  }, []);


  const handleCreate = async () => {
    if (!newCircleName.trim()) return;
    setCreating(true);
    await createCircle(newCircleName.trim());
    setNewCircleName('');
    setShowCreate(false);
    setCreating(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    await joinCircle(joinCode.trim());
    setJoinCode('');
    setShowJoin(false);
    setJoining(false);
  };

  const handleLongPress = (circle: Circle) => {
    const isCircleAdmin = circle.myRole === 'admin';
    Alert.alert(
      circle.name,
      isCircleAdmin ? 'Manage your circle' : 'What would you like to do?',
      [
        { text: 'Open Circle', onPress: () => router.push({ pathname: '/messages/chat', params: { id: circle.id, name: circle.name, inviteCode: circle.invite_code } }) },
        isCircleAdmin
          ? {
              text: 'Delete Circle',
              style: 'destructive' as const,
              onPress: () =>
                Alert.alert('Delete Circle', `Permanently delete "${circle.name}"?\n\nThis will remove all messages and members. This cannot be undone.`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete Forever', style: 'destructive', onPress: () => deleteCircle(circle.id) },
                ]),
            }
          : {
              text: 'Leave Circle',
              style: 'destructive' as const,
              onPress: () =>
                Alert.alert('Leave Circle', `Are you sure you want to leave "${circle.name}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Leave', style: 'destructive', onPress: () => leaveCircle(circle.id) },
                ]),
            },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };


  // ── Auth gate for circles ──────────────────────────────────────────────────
  if (isLoggedIn === null) {
    // Still checking auth state
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <ImageBackground
        source={require('../../../../assets/images/background_image.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Animated.View entering={smoothEntry} style={{ alignItems: 'center', gap: 20 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 4,
            }}>
              <Lock size={32} color="#fff" />
            </View>
            <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 26, color: '#fff', textAlign: 'center' }}>
              Circles
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 23 }}>
              Join or create a reading circle to read and memorise the Quran together with friends and family.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 40,
                borderRadius: 28, marginTop: 8,
              }}
              onPress={() => router.push('/auth')}
              activeOpacity={0.85}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#000' }}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/auth')} activeOpacity={0.7}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Create an account</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../../../assets/images/background_image.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      {/* Dark overlay for readability */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.7)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ── Header ── */}
        <BlurView intensity={18} tint={isDark ? 'dark' : 'light'} style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Circles</Text>
            <Text style={styles.headerSub}>Read together, grow together</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
            <RefreshCw size={16} color="#fff" />
          </TouchableOpacity>
        </BlurView>

        {/* ── Me Card — personal goals & journal ── */}
        <Animated.View entering={smoothEntry}>
          <TouchableOpacity
            onPress={() => router.push('/messages/me')}
            activeOpacity={0.82}
            style={{ marginHorizontal: 18, marginTop: 14 }}
          >
            <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.meCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                pointerEvents="none"
              />
              {/* Avatar */}
              <View style={styles.meAvatar}>
                <Text style={styles.meAvatarText}>
                  {displayName ? displayName.charAt(0).toUpperCase() : 'M'}
                </Text>
              </View>
              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={styles.meName}>{displayName || 'My Goals'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  <Clock size={11} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.meSub}>Recitation · Memorization · Revision</Text>
                </View>
              </View>
              <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Action buttons ── */}
          <Animated.View entering={smoothEntry} style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => setShowCreate(true)}>
              <PlusCircle size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnGlass} onPress={() => setShowJoin(true)}>
              <Link size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Join</Text>
            </TouchableOpacity>


          </Animated.View>

          {/* ── Create form ── */}
          {showCreate && (
            <Animated.View entering={smoothEntry} style={styles.inlineForm}>
              <Text style={styles.formTitle}>Name your circle</Text>
              <TextInput
                value={newCircleName}
                onChangeText={setNewCircleName}
                placeholder="e.g. Al-Fatihah Study Group"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.input}
                autoFocus
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.formBtnCancel} onPress={() => setShowCreate(false)}>
                  <Text style={styles.formBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.formBtnConfirm} onPress={handleCreate} disabled={creating}>
                  {creating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.formBtnConfirmText}>Create ✦</Text>}
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* ── Join form ── */}
          {showJoin && (
            <Animated.View entering={smoothEntry} style={styles.inlineForm}>
              <Text style={styles.formTitle}>Enter invite code</Text>
              <TextInput
                value={joinCode}
                onChangeText={(t) => setJoinCode(t.toUpperCase())}
                placeholder="e.g. XK7P2A"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={[styles.input, { letterSpacing: 6, textAlign: 'center', fontSize: 22, fontWeight: '700' }]}
                autoCapitalize="characters"
                maxLength={8}
                autoFocus
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.formBtnCancel} onPress={() => setShowJoin(false)}>
                  <Text style={styles.formBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.formBtnConfirm} onPress={handleJoin} disabled={joining}>
                  {joining ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.formBtnConfirmText}>Join ✦</Text>}
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* ── Circles list ── */}
          {loading ? (
            <ActivityIndicator color="#fff" size="large" style={{ marginTop: 60 }} />
          ) : circles.length === 0 ? (
            <Animated.View entering={smoothEntry.delay(100)} style={styles.emptyState}>
              <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
                <Users size={44} color="rgba(255,255,255,0.6)" />
                <Text style={styles.emptyTitle}>No Circles Yet</Text>
                <Text style={styles.emptySub}>
                  Create a new circle or join an existing one to read together.
                </Text>
              </BlurView>
            </Animated.View>
          ) : (
            circles.map((circle, idx) => (
              <Animated.View key={circle.id} entering={smoothEntry.delay(idx * 70)}>
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: '/messages/chat',
                    params: { id: circle.id, name: circle.name, inviteCode: circle.invite_code },
                  })}
                  onLongPress={() => handleLongPress(circle)}
                  activeOpacity={0.8}
                  delayLongPress={400}
                >
                  <BlurView intensity={24} tint={isDark ? 'dark' : 'light'} style={styles.circleCard}>
                    {/* Subtle top sheen */}
                    <LinearGradient
                      colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']}
                      style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
                      pointerEvents="none"
                    />
                    {/* Avatar */}
                    <View style={styles.circleAvatar}>
                      <Text style={styles.circleAvatarText}>
                        {circle.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.circleName}>{circle.name}</Text>
                      <View style={styles.circleMetaRow}>
                        <View style={styles.circleMeta}>
                          <Users size={11} color="rgba(255,255,255,0.5)" />
                          <Text style={styles.circleMetaText}>{circle.memberCount} members</Text>
                        </View>
                        <View style={styles.circleMeta}>
                          <View style={[styles.dot, { backgroundColor: (circle.activeToday ?? 0) > 0 ? '#4ade80' : 'rgba(255,255,255,0.2)' }]} />
                          <Text style={styles.circleMetaText}>{circle.activeToday} read today</Text>
                        </View>
                      </View>
                      {circle.myNiyyah ? (
                        <Text style={styles.niyyahPreview} numberOfLines={1}>
                          ✦ {circle.myNiyyah}
                        </Text>
                      ) : (
                        <Text style={styles.niyyahEmpty}>Hold to manage · tap to open</Text>
                      )}
                    </View>
                    <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
                  </BlurView>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}

          {/* ── Philosophy callout ── */}
          {circles.length > 0 && (
            <Animated.View entering={smoothEntry.delay(400)}>
              <BlurView intensity={14} tint="dark" style={styles.philCard}>
                <Text style={styles.philText}>
                  "Circles show shared presence, not ranking. The goal is quiet accountability — knowing others showed up today."
                </Text>
              </BlurView>
            </Animated.View>
          )}

        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'transparent' },
    // ── Header ──────────────────────────────────────────────────────────────
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 22, paddingVertical: 18,
      overflow: 'hidden',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255,255,255,0.18)',
    },
    headerTitle: {
      fontFamily: 'Syne_700Bold',
      fontSize: 26, color: '#fff', letterSpacing: -0.5,
      textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
    },
    headerSub: {
      fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2,
    },
    refreshBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.3)',
    },
    // ── Content ─────────────────────────────────────────────────────────────
    content: { padding: 18, paddingBottom: 150 },
    // ── Action buttons ───────────────────────────────────────────────────────
    actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    actionBtnPrimary: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
      backgroundColor: '#000000', borderRadius: 16, paddingVertical: 14,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    actionBtnGlass: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
      backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, paddingVertical: 14,
      borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.35)',
    },
    actionBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    // ── Inline forms ─────────────────────────────────────────────────────────
    inlineForm: {
      backgroundColor: 'rgba(15,15,20,0.72)', borderRadius: 22, padding: 20,
      marginBottom: 16,
      borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)',
      overflow: 'hidden',
    },
    formTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 14 },
    input: {
      backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 14,
      borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.2)',
      fontSize: 15, color: '#fff', marginBottom: 14,
    },
    formBtnCancel: {
      flex: 1, paddingVertical: 13, borderRadius: 13, alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.2)',
    },
    formBtnCancelText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 15 },
    formBtnConfirm: {
      flex: 1, paddingVertical: 13, borderRadius: 13, alignItems: 'center',
      backgroundColor: '#000000',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    formBtnConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    // ── Circle cards ─────────────────────────────────────────────────────────
    circleCard: {
      flexDirection: 'row', alignItems: 'center',
      borderRadius: 22,
      padding: 16, marginBottom: 14, gap: 14,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.22)',
    },
    circleAvatar: {
      width: 52, height: 52, borderRadius: 26,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#000000',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    circleAvatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
    circleName: {
      fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 5,
      textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
    },
    circleMetaRow: { flexDirection: 'row', gap: 14, marginBottom: 5 },
    circleMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    dot: { width: 7, height: 7, borderRadius: 3.5 },
    circleMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
    niyyahPreview: { fontSize: 12, color: 'rgba(167,139,250,1)', fontWeight: '500' },
    niyyahEmpty: { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' },
    // ── Empty state ──────────────────────────────────────────────────────────
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyCard: {
      alignItems: 'center', gap: 14, padding: 36, borderRadius: 28, overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)',
    },
    emptyTitle: { fontSize: 21, fontWeight: '700', color: '#fff' },
    emptySub: { fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 22, maxWidth: 260 },
    // ── Philosophy callout ────────────────────────────────────────────────────
    philCard: {
      marginTop: 6, borderRadius: 18, padding: 20, overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)',
    },
    philText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 22, fontStyle: 'italic', textAlign: 'center' },
    // ── Me Card ──────────────────────────────────────────────────────────────
    meCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderRadius: 20, padding: 14, overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.22)',
    },
    meAvatar: {
      width: 46, height: 46, borderRadius: 23,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    meAvatarText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
    meName: { fontSize: 16, fontWeight: '700', color: '#fff' },
    meSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  });
