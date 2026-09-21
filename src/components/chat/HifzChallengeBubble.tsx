import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import {
  Mic, Play, Pause, Square, BookOpen, Check, Minus, X, RefreshCw, Zap,
} from 'lucide-react-native';
import {
  useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync,
  useAudioRecorder, useAudioRecorderState, RecordingPresets, requestRecordingPermissionsAsync,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../../lib/supabase';
import { Fonts } from '../../constants/theme';

type Rating = 'correct' | 'hesitated' | 'incorrect';

const AUDIO_DIR = FileSystem.documentDirectory + 'quran_audio/';

async function getCachedAudio(url: string, key: string): Promise<string> {
  await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true }).catch(() => {});
  const safe = key.replace(':', '_');
  const local = `${AUDIO_DIR}${safe}.mp3`;
  const info = await FileSystem.getInfoAsync(local);
  if (info.exists) return local;
  const dl = await FileSystem.downloadAsync(url, local);
  return dl.uri;
}

function MiniResponsePlayer({ audioUrl, name, rating, colors }: {
  audioUrl: string; name: string; rating: Rating; colors: any;
}) {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);
  const rColor = rating === 'correct' ? '#10b981' : rating === 'hesitated' ? '#f59e0b' : '#ef4444';
  const RatingIcon = rating === 'correct' ? Check : rating === 'hesitated' ? Minus : X;

  return (
    <View style={styles.responseRow}>
      <TouchableOpacity
        onPress={() => status.playing ? player.pause() : player.play()}
        style={[styles.playBtn, { backgroundColor: colors.primary + '20' }]}
      >
        {status.playing ? <Pause size={10} color={colors.primary} /> : <Play size={10} color={colors.primary} />}
      </TouchableOpacity>
      <Text style={[styles.responderName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
      <View style={[styles.ratingPill, { backgroundColor: rColor + '20' }]}>
        <RatingIcon size={10} color={rColor} />
      </View>
    </View>
  );
}

export function HifzChallengeBubble({ challengeId, userId, colors, isOwn }: {
  challengeId: string; userId: string; colors: any; isOwn: boolean;
}) {
  const [challenge, setChallenge] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [myResponse, setMyResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Ayah audio player — initialize with null, replace source when cached (avoids auto-play)
  const [localAudioUri, setLocalAudioUri] = useState<string | null>(null);
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);

  // Recorder
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const [isRecordingStarted, setIsRecordingStarted] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const textColor = isOwn ? '#fff' : colors.text;
  const subColor = isOwn ? 'rgba(255,255,255,0.7)' : colors.textTertiary;
  const bgCard = isOwn ? 'rgba(255,255,255,0.12)' : colors.surface;
  const borderCard = isOwn ? 'rgba(255,255,255,0.2)' : colors.border;

  const loadData = async () => {
    const { data: ch } = await supabase
      .from('group_hifz_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();
    if (!ch) { setLoading(false); return; }
    setChallenge(ch);

    // Cache and auto-play ayah audio
    setAudioModeAsync({ playsInSilentMode: true });
    const surahStr = String(ch.surah_number).padStart(3, '0');
    const ayahStr = String(ch.ayah_number).padStart(3, '0');
    const url = `https://verses.quran.com/Alafasy/mp3/${surahStr}${ayahStr}.mp3`;
    getCachedAudio(url, `${ch.surah_number}:${ch.ayah_number}`)
      .then(setLocalAudioUri).catch(() => {});

    // Load responses
    const { data: resData } = await supabase
      .from('group_hifz_responses')
      .select('user_id, self_rating, audio_url')
      .eq('challenge_id', challengeId);

    const userIds = [...new Set((resData ?? []).map((r: any) => r.user_id))];
    const { data: profiles } = await supabase.from('users').select('id, display_name').in('id', userIds);
    const nameMap: Record<string, string> = {};
    (profiles ?? []).forEach((p: any) => { nameMap[p.id] = p.display_name; });

    const enriched = (resData ?? []).map((r: any) => ({ ...r, display_name: nameMap[r.user_id] ?? 'Member' }));
    setResponses(enriched);
    setMyResponse(enriched.find((r: any) => r.user_id === userId) ?? null);
    setLoading(false);
  };

  // When the cached file arrives, load it into the player WITHOUT auto-playing
  useEffect(() => {
    if (localAudioUri) {
      player.replace({ uri: localAudioUri });
    }
  }, [localAudioUri]);

  useEffect(() => {
    if (!challengeId) return;
    loadData();
    const channel = supabase
      .channel(`hifz-${challengeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_hifz_responses', filter: `challenge_id=eq.${challengeId}` },
        loadData
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [challengeId]);

  const replay = () => {
    player.pause();
    player.seekTo(0);
    setTimeout(() => player.play(), 10);
  };

  const handleStartRecording = async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Denied', 'Microphone access is required.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRecordingStarted(true);
    setRecordedUri(null);
    recorder.record();
  };

  const handlePauseResume = () => {
    Haptics.selectionAsync();
    if (recState.isRecording) recorder.pause();
    else recorder.record();
  };

  const handleStop = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await recorder.stop();
    setRecordedUri(recorder.uri);
    setIsRecordingStarted(false);
  };

  const submitRating = async (rating: Rating) => {
    if (!recordedUri) return;
    setSubmitting(true);
    try {
      const fileExt = recordedUri.split('.').pop() || 'm4a';
      const fileName = `${userId}/${challengeId}_${Date.now()}.${fileExt}`;
      const resp = await fetch(recordedUri);
      const blob = await resp.blob();
      const { error: uploadError } = await supabase.storage
        .from('voice_notes')
        .upload(fileName, blob, { contentType: 'audio/m4a' });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('voice_notes').getPublicUrl(fileName);
      await supabase.from('group_hifz_responses').upsert({
        challenge_id: challengeId,
        user_id: userId,
        self_rating: rating,
        audio_url: publicData.publicUrl,
      }, { onConflict: 'challenge_id,user_id' });

      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit.');
    }
    setSubmitting(false);
  };

  const formatTime = (millis: number) => {
    const s = Math.floor(millis / 1000) % 60;
    const m = Math.floor(millis / 60000);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (loading) return <ActivityIndicator color={colors.primary} size="small" style={{ margin: 10 }} />;
  if (!challenge) return <Text style={{ color: colors.error }}>Challenge not found</Text>;

  const ratingColor = (r: Rating) => r === 'correct' ? '#10b981' : r === 'hesitated' ? '#f59e0b' : '#ef4444';
  const ratingIcon = (r: Rating) => r === 'correct' ? Check : r === 'hesitated' ? Minus : X;
  const RIcon = myResponse ? ratingIcon(myResponse.self_rating) : null;

  return (
    <View style={[styles.container, { backgroundColor: bgCard, borderColor: borderCard }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <BookOpen size={13} color={isOwn ? '#fff' : colors.primary} />
        <Text style={[styles.headerLabel, { color: isOwn ? '#fff' : colors.primary }]}>Hifz Challenge</Text>
        <Text style={[styles.expiry, { color: subColor }]}>
          {new Date(challenge.expires_at) > new Date() ? '' : 'Expired'}
        </Text>
      </View>

      {/* Surah label */}
      <Text style={[styles.surahLabel, { color: subColor }]}>
        {challenge.surah_name} · Ayah {challenge.ayah_number}
      </Text>

      {/* Ayah in Uthmani */}
      <Text style={[styles.arabicText, { color: textColor }]}>
        {challenge.ayah_text}
      </Text>

      {/* Replay button */}
      {localAudioUri && (
        <TouchableOpacity onPress={replay} style={[styles.replayBtn, { backgroundColor: isOwn ? 'rgba(255,255,255,0.15)' : colors.background }]}>
          {playerStatus.playing
            ? <Zap size={12} color={isOwn ? '#fff' : colors.primary} />
            : <RefreshCw size={12} color={isOwn ? 'rgba(255,255,255,0.7)' : colors.textTertiary} />}
          <Text style={[styles.replayText, { color: isOwn ? (playerStatus.playing ? '#fff' : 'rgba(255,255,255,0.7)') : (playerStatus.playing ? colors.primary : colors.textTertiary) }]}>
            {playerStatus.playing ? 'Playing…' : 'Replay'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Response area */}
      {!myResponse ? (
        <View style={styles.responseArea}>
          {!recordedUri ? (
            <>
              <Text style={[styles.promptText, { color: subColor }]}>Record your recitation to respond</Text>
              {!isRecordingStarted ? (
                <TouchableOpacity onPress={handleStartRecording} style={[styles.recordStartBtn, { backgroundColor: '#ef4444' }]}>
                  <Mic size={14} color="#fff" />
                  <Text style={styles.recordStartText}>Tap to Record</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.recordingLive}>
                  <Text style={[styles.timerText, { color: isOwn ? '#fff' : colors.text }]}>{formatTime(recState.durationMillis)}</Text>
                  <View style={styles.recBtns}>
                    <TouchableOpacity onPress={handlePauseResume} style={[styles.recBtn, { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : colors.surface }]}>
                      {recState.isRecording ? <Pause size={14} color={isOwn ? '#fff' : colors.text} /> : <Mic size={14} color={isOwn ? '#fff' : colors.text} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleStop} style={[styles.recBtn, { backgroundColor: '#ef4444' }]}>
                      <Square size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.promptText, { color: subColor }]}>Recitation recorded. How did you do?</Text>
              {submitting ? <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} /> : (
                <View style={styles.ratingBtns}>
                  {(['correct', 'hesitated', 'incorrect'] as Rating[]).map(r => {
                    const RatingIcon = ratingIcon(r);
                    const rc = ratingColor(r);
                    return (
                      <TouchableOpacity key={r} onPress={() => submitRating(r)}
                        style={[styles.ratingBtn, { backgroundColor: rc + '20', borderColor: rc }]}>
                        <RatingIcon size={13} color={rc} />
                        <Text style={[styles.ratingBtnText, { color: rc }]}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <TouchableOpacity onPress={() => setRecordedUri(null)} style={{ alignSelf: 'center', marginTop: 6 }}>
                <Text style={[styles.retakeText, { color: subColor }]}>Retake</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <View style={[styles.myRatingRow, { backgroundColor: ratingColor(myResponse.self_rating) + '20', borderColor: ratingColor(myResponse.self_rating) + '40' }]}>
          {RIcon && <RIcon size={13} color={ratingColor(myResponse.self_rating)} />}
          <Text style={[styles.myRatingText, { color: ratingColor(myResponse.self_rating) }]}>
            You: {myResponse.self_rating}
          </Text>
        </View>
      )}

      {/* Responses */}
      {responses.length > 0 && (
        <View style={[styles.responsesList, { borderTopColor: borderCard }]}>
          {responses.filter(r => r.user_id !== userId).slice(0, 4).map((r: any) => (
            <MiniResponsePlayer key={r.user_id} audioUrl={r.audio_url} name={r.display_name} rating={r.self_rating} colors={colors} />
          ))}
          {responses.length > 5 && (
            <Text style={[styles.moreText, { color: subColor }]}>+{responses.length - 4} more</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4, padding: 12, borderRadius: 14, borderWidth: 1, width: 280,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  headerLabel: { fontFamily: Fonts.sansBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, flex: 1 },
  expiry: { fontFamily: Fonts.sans, fontSize: 10 },

  surahLabel: { fontFamily: Fonts.sansMedium, fontSize: 11, textAlign: 'right', marginBottom: 6 },
  arabicText: {
    fontSize: 24, lineHeight: 44, textAlign: 'right',
    fontFamily: 'Scheherazade New', marginBottom: 10,
  },

  replayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  replayText: { fontFamily: Fonts.sansMedium, fontSize: 12 },

  responseArea: { marginTop: 4 },
  promptText: { fontFamily: Fonts.sansMedium, fontSize: 11, marginBottom: 8, textAlign: 'center' },
  recordStartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 10, paddingVertical: 10,
  },
  recordStartText: { fontFamily: Fonts.sansBold, color: '#fff', fontSize: 13 },
  recordingLive: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 10, borderWidth: 1, borderColor: '#ef4444',
    backgroundColor: '#ef444415', paddingHorizontal: 12, paddingVertical: 8,
  },
  timerText: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  recBtns: { flexDirection: 'row', gap: 8 },
  recBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  ratingBtns: { flexDirection: 'row', gap: 6 },
  ratingBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, borderRadius: 8, paddingVertical: 8, borderWidth: 1,
  },
  ratingBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 11 },
  retakeText: { fontFamily: Fonts.sans, fontSize: 11, textDecorationLine: 'underline' },

  myRatingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 10,
    marginTop: 4,
  },
  myRatingText: { fontFamily: Fonts.sansSemiBold, fontSize: 12 },

  responsesList: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 6 },
  responseRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  responderName: { fontFamily: Fonts.sansMedium, fontSize: 12, flex: 1 },
  ratingPill: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontFamily: Fonts.sans, fontSize: 11, textAlign: 'center' },
});
