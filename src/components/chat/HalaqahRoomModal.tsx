/**
 * HalaqahRoomModal — Voice Room powered by LiveKit
 *
 * ⚠️  REQUIRES EAS BUILD — Not compatible with Expo Go.
 *     Uses @livekit/react-native directly (no separate components package needed).
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
  Animated,
} from 'react-native';
import { GlassBlur } from '../../../components/ui/GlassCard';
import { X, Mic, MicOff, PhoneOff, Users, Volume2, VolumeX } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Fonts } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

// ── LiveKit SDK — lazy-require so it doesn't crash in Expo Go ──────────
let Room: any = null;
let RoomEvent: any = null;
let ParticipantEvent: any = null;
let Track: any = null;

try {
  const lk = require('@livekit/react-native');
  Room = lk.Room;
  RoomEvent = lk.RoomEvent;
  ParticipantEvent = lk.ParticipantEvent;
  Track = lk.Track;
  // Register WebRTC globals required by LiveKit
  if (lk.registerGlobals) lk.registerGlobals();
} catch {
  // Expo Go — graceful no-op
}

// ── Types ──────────────────────────────────────────────────────────────
interface HalaqahRoomModalProps {
  visible: boolean;
  onClose: () => void;
  circleId: string;
  circleName: string;
  userId: string;
  userName: string;
}

interface RemoteParticipant {
  identity: string;
  name?: string;
  isMicrophoneEnabled: boolean;
  sid: string;
}

// ── Participant Tile ───────────────────────────────────────────────────
function ParticipantTile({
  name,
  isMuted,
  isSpeaking,
  colors,
}: {
  name: string;
  isMuted: boolean;
  isSpeaking: boolean;
  colors: any;
}) {
  const speakAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(speakAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
          Animated.timing(speakAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      speakAnim.stopAnimation();
      speakAnim.setValue(1);
    }
  }, [isSpeaking]);

  return (
    <View style={[ptStyles.tile, { backgroundColor: colors.surface, borderColor: isSpeaking ? colors.primary : colors.border }]}>
      <Animated.View style={[
        ptStyles.avatarRing,
        {
          borderColor: isSpeaking ? colors.primary : 'transparent',
          transform: [{ scale: speakAnim }],
        }
      ]}>
        <View style={[ptStyles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Text style={[ptStyles.avatarText, { color: colors.primary }]}>
            {name.substring(0, 1).toUpperCase()}
          </Text>
        </View>
      </Animated.View>
      <Text style={[ptStyles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
      {isMuted
        ? <MicOff size={12} color={colors.textTertiary} style={{ marginTop: 4 }} />
        : <Mic size={12} color={colors.primary} style={{ marginTop: 4 }} />
      }
    </View>
  );
}

const ptStyles = StyleSheet.create({
  tile: {
    width: 96,
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    margin: 6,
  },
  avatarRing: {
    borderRadius: 32,
    borderWidth: 2,
    marginBottom: 8,
    padding: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontFamily: Fonts.sansBold },
  name: { fontSize: 12, fontFamily: Fonts.sansSemiBold, textAlign: 'center' },
});

// ── Main Modal ─────────────────────────────────────────────────────────
export function HalaqahRoomModal({
  visible,
  onClose,
  circleId,
  circleName,
  userId,
  userName,
}: HalaqahRoomModalProps) {
  const { colors, isDark } = useAppTheme();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [speakingIds, setSpeakingIds] = useState<Set<string>>(new Set());
  const roomRef = useRef<any>(null);
  const sdkUnavailable = !Room;

  // ── Fetch LiveKit Token ──────────────────────────────────────────────
  const fetchToken = async () => {
    setLoading(true);
    try {
      const roomName = `circle-${circleId}`;
      const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/livekit-token`;
      const url = new URL(functionUrl);
      url.searchParams.append('room', roomName);
      url.searchParams.append('participantIdentity', userId);
      url.searchParams.append('participantName', userName);

      const session = await supabase.auth.getSession();
      const authHeader = session.data.session?.access_token
        ? `Bearer ${session.data.session.access_token}`
        : '';

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: authHeader,
          apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
        },
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);
      if (!json.token) throw new Error('No token returned from server');
      setToken(json.token);
    } catch (err: any) {
      Alert.alert('Error joining room', err.message ?? 'Unknown error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // ── Connect to LiveKit Room ──────────────────────────────────────────
  useEffect(() => {
    if (!visible || sdkUnavailable) return;
    fetchToken();
    return () => {
      disconnectRoom();
    };
  }, [visible]);

  useEffect(() => {
    if (!token || !Room) return;
    connectRoom(token);
  }, [token]);

  const connectRoom = async (lkToken: string) => {
    try {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      // Participant change handlers
      const refreshParticipants = () => {
        const ps: RemoteParticipant[] = [];
        room.remoteParticipants.forEach((p: any) => {
          ps.push({
            identity: p.identity,
            name: p.name || p.identity,
            isMicrophoneEnabled: p.isMicrophoneEnabled,
            sid: p.sid,
          });
        });
        setParticipants(ps);
      };

      room
        .on(RoomEvent.ParticipantConnected, refreshParticipants)
        .on(RoomEvent.ParticipantDisconnected, refreshParticipants)
        .on(RoomEvent.TrackMuted, refreshParticipants)
        .on(RoomEvent.TrackUnmuted, refreshParticipants)
        .on(RoomEvent.ActiveSpeakersChanged, (speakers: any[]) => {
          setSpeakingIds(new Set(speakers.map((s: any) => s.identity)));
        })
        .on(RoomEvent.Disconnected, () => {
          setConnected(false);
          setParticipants([]);
        });

      await room.connect(process.env.EXPO_PUBLIC_LIVEKIT_URL!, lkToken);
      await room.localParticipant.setMicrophoneEnabled(true);
      setConnected(true);
      refreshParticipants();
    } catch (err: any) {
      Alert.alert('Connection Error', err.message);
      onClose();
    }
  };

  const disconnectRoom = async () => {
    try {
      if (roomRef.current) {
        await roomRef.current.disconnect();
        roomRef.current = null;
      }
    } catch (_) {}
    setConnected(false);
    setParticipants([]);
    setToken(null);
  };

  const handleClose = async () => {
    await disconnectRoom();
    onClose();
  };

  const toggleMic = async () => {
    if (!roomRef.current) return;
    const newMuted = !isMuted;
    await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
    setIsMuted(newMuted);
  };

  const toggleSpeaker = () => {
    // On a real device this would use expo-av to switch audio output
    setIsSpeakerOff(prev => !prev);
  };

  // ── Render ───────────────────────────────────────────────────────────
  const renderContent = () => {
    if (sdkUnavailable) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>🎙️</Text>
          <Text style={[styles.placeholderTitle, { color: colors.text }]}>Halaqah Voice Rooms</Text>
          <Text style={[styles.placeholderSub, { color: colors.textSecondary }]}>
            Voice rooms require a native EAS build.{'\n\n'}Run{' '}
            <Text style={{ fontFamily: Fonts.sansBold, color: colors.primary }}>eas build</Text>
            {' '}to unlock this feature.
          </Text>
        </View>
      );
    }

    if (loading || !connected) {
      return (
        <View style={styles.placeholder}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.placeholderSub, { color: colors.textSecondary, marginTop: 16 }]}>
            {loading ? 'Getting room token…' : 'Connecting to room…'}
          </Text>
        </View>
      );
    }

    // Local participant tile at top
    const allTiles = [
      { identity: userId, name: userName || 'You', isMicrophoneEnabled: !isMuted, sid: 'local' },
      ...participants,
    ];

    return (
      <View style={{ flex: 1 }}>
        {/* Participant count */}
        <View style={[styles.participantCount, { borderBottomColor: colors.border }]}>
          <Users size={15} color={colors.textSecondary} />
          <Text style={[styles.participantCountText, { color: colors.textSecondary }]}>
            {allTiles.length} {allTiles.length === 1 ? 'participant' : 'participants'}
          </Text>
        </View>

        {/* Participant grid */}
        <FlatList
          data={allTiles}
          keyExtractor={p => p.sid}
          numColumns={3}
          contentContainerStyle={styles.participantGrid}
          renderItem={({ item }) => (
            <ParticipantTile
              name={item.identity === userId ? `${item.name} (You)` : (item.name || item.identity)}
              isMuted={!item.isMicrophoneEnabled}
              isSpeaking={speakingIds.has(item.identity)}
              colors={colors}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.waitingText, { color: colors.textTertiary }]}>
              Waiting for others to join…
            </Text>
          }
        />

        {/* Control Bar */}
        <View style={[styles.controlBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: isSpeakerOff ? colors.skeleton : colors.surface }]}
            onPress={toggleSpeaker}
          >
            {isSpeakerOff
              ? <VolumeX size={22} color={colors.textTertiary} />
              : <Volume2 size={22} color={colors.primary} />
            }
            <Text style={[styles.controlLabel, { color: isSpeakerOff ? colors.textTertiary : colors.primary }]}>
              {isSpeakerOff ? 'Off' : 'Speaker'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.hangupBtn]}
            onPress={handleClose}
          >
            <PhoneOff size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: isMuted ? '#FF3B3020' : colors.surface }]}
            onPress={toggleMic}
          >
            {isMuted
              ? <MicOff size={22} color="#FF3B30" />
              : <Mic size={22} color={colors.primary} />
            }
            <Text style={[styles.controlLabel, { color: isMuted ? '#FF3B30' : colors.primary }]}>
              {isMuted ? 'Muted' : 'Mic'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <GlassBlur intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
        <View style={[
          styles.container,
          { backgroundColor: isDark ? 'rgba(10,10,15,0.95)' : 'rgba(245,245,250,0.97)' },
        ]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>🕌 Halaqah Room</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{circleName}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {connected && (
                <View style={[styles.liveBadge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              )}
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {renderContent()}
        </View>
      </GlassBlur>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 20, fontFamily: Fonts.sansBold },
  subtitle: { fontSize: 13, fontFamily: Fonts.sans, marginTop: 2 },
  closeBtn: { padding: 4 },
  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBadgeText: { color: '#fff', fontFamily: Fonts.sansBold, fontSize: 10, letterSpacing: 0.5 },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  placeholderEmoji: { fontSize: 48, marginBottom: 16 },
  placeholderTitle: {
    fontSize: 22,
    fontFamily: Fonts.sansBold,
    marginBottom: 12,
    textAlign: 'center',
  },
  placeholderSub: {
    fontSize: 15,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    lineHeight: 24,
  },
  participantCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  participantCountText: { fontFamily: Fonts.sansMedium, fontSize: 14 },
  participantGrid: {
    padding: 12,
    paddingBottom: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  waitingText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 48,
    width: '100%',
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
    paddingBottom: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  controlLabel: { fontSize: 10, fontFamily: Fonts.sansMedium },
  hangupBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
