import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Modal, Share, Alert, Switch, ImageBackground, Animated as RNAnimated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, BarChart2, Calendar, CornerUpLeft, Link, Plus, Send, Settings, Share2, UserPlus, UserX, Video, X, Mic, MicOff, Phone, Target, Sparkles, MessageSquare, ShieldCheck, ChevronRight, Trash2, Brain, Heart, HandHeart, BookOpen, Moon, CheckCircle2, Flame, Users, Reply, Copy, Forward, Star, Info } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { GlassBlur } from '../../../components/ui/GlassCard';
import { supabase } from '../../../lib/supabase';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Fonts } from '../../../constants/theme';
import { PollBubble } from '../../../components/chat/PollBubble';
import { EventBubble } from '../../../components/chat/EventBubble';
import { CreatePollModal } from '../../../components/chat/CreatePollModal';
import { CreateEventModal } from '../../../components/chat/CreateEventModal';
import { CircleGoalPickerModal, CircleGoal } from '../../../components/chat/CircleGoalPickerModal';
import { MemberRoleModal } from '../../../components/chat/MemberRoleModal';
import { HalaqahRoomModal } from '../../../components/chat/HalaqahRoomModal';
import { HifzChallengeBubble } from '../../../components/chat/HifzChallengeBubble';
import { AudioMessageBubble } from '../../../components/chat/AudioMessageBubble';
import { GlassCard } from '../../../components/ui/GlassCard';
import { summarizeChatMessages } from '../../../lib/gemini';
import { useVoiceNote } from '../../../hooks/useVoiceNote';


const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];
const SURAH_NAMES: Record<number, string> = {
  1:'Al-Fatihah',2:'Al-Baqarah',3:"Ali 'Imran",4:'An-Nisa',5:'Al-Maidah',6:'Al-Anam',
  7:'Al-Araf',8:'Al-Anfal',9:'At-Tawbah',10:'Yunus',11:'Hud',12:'Yusuf',13:"Ar-Ra'd",
  14:'Ibrahim',15:'Al-Hijr',16:'An-Nahl',17:'Al-Isra',18:'Al-Kahf',19:'Maryam',20:'Ta-Ha',
  21:'Al-Anbiya',22:'Al-Hajj',23:'Al-Muminun',24:'An-Nur',25:'Al-Furqan',26:"Ash-Shu'ara",
  27:'An-Naml',28:'Al-Qasas',29:'Al-Ankabut',30:'Ar-Rum',31:'Luqman',32:'As-Sajdah',
  33:'Al-Ahzab',34:'Saba',35:'Fatir',36:'Ya-Seen',37:'As-Saffat',38:'Sad',39:'Az-Zumar',
  40:'Ghafir',41:'Fussilat',42:"Ash-Shura",43:'Az-Zukhruf',44:'Ad-Dukhan',45:'Al-Jathiyah',
  46:'Al-Ahqaf',47:'Muhammad',48:'Al-Fath',49:'Al-Hujurat',50:'Qaf',51:'Adh-Dhariyat',
  52:'At-Tur',53:'An-Najm',54:'Al-Qamar',55:'Ar-Rahman',56:'Al-Waqiah',57:'Al-Hadid',
  58:'Al-Mujadila',59:'Al-Hashr',60:'Al-Mumtahanah',61:'As-Saf',62:"Al-Jumu'ah",
  63:'Al-Munafiqun',64:'At-Taghabun',65:'At-Talaq',66:'At-Tahrim',67:'Al-Mulk',
  68:'Al-Qalam',69:'Al-Haqqah',70:"Al-Ma'arij",71:'Nuh',72:'Al-Jinn',73:'Al-Muzzammil',
  74:'Al-Muddaththir',75:'Al-Qiyamah',76:'Al-Insan',77:'Al-Mursalat',78:"An-Naba",
  79:"An-Nazi'at",80:"'Abasa",81:'At-Takwir',82:'Al-Infitar',83:'Al-Mutaffifin',
  84:'Al-Inshiqaq',85:'Al-Buruj',86:'At-Tariq',87:'Al-Ala',88:'Al-Ghashiyah',
  89:'Al-Fajr',90:'Al-Balad',91:'Ash-Shams',92:'Al-Layl',93:'Ad-Duha',94:'Ash-Sharh',
  95:'At-Tin',96:'Al-Alaq',97:'Al-Qadr',98:'Al-Bayyinah',99:'Az-Zalzalah',100:"Al-'Adiyat",
  101:"Al-Qari'ah",102:'At-Takathur',103:'Al-Asr',104:'Al-Humazah',105:'Al-Fil',
  106:'Quraysh',107:"Al-Ma'un",108:'Al-Kawthar',109:'Al-Kafirun',110:'An-Nasr',
  111:'Al-Masad',112:'Al-Ikhlas',113:'Al-Falaq',114:'An-Nas',
};

async function triggerDailyHifzBot(circleInfo: any, circleId: string, currentUserId: string | null) {
  const todayStr = new Date().toISOString().split('T')[0];
  if (circleInfo.last_automated_challenge_date === todayStr) return; // Already done

  const startS = circleInfo.hifz_goal_start_surah;
  const startA = circleInfo.hifz_goal_start_ayah;
  const endS = circleInfo.hifz_goal_end_surah;
  const endA = circleInfo.hifz_goal_end_ayah;
  if (!startS || !endS) return;

  // Attempt lock/update on circles to prevent race condition across devices
  const { data: updatedCircle, error: updateErr } = await supabase
    .from('circles')
    .update({ last_automated_challenge_date: todayStr })
    .eq('id', circleId)
    .neq('last_automated_challenge_date', todayStr)
    .select()
    .single();

  if (updateErr || !updatedCircle) return; // Another device beat us to it

  // Pick random Ayah in range
  const randomSurah = Math.floor(Math.random() * (endS - startS + 1)) + startS;
  let randomAyah = 1;
  if (randomSurah === startS && randomSurah === endS) {
    randomAyah = Math.floor(Math.random() * (endA - startA + 1)) + startA;
  } else if (randomSurah === startS) {
    const maxA = SURAH_AYAH_COUNTS[startS - 1];
    randomAyah = Math.floor(Math.random() * (maxA - startA + 1)) + startA;
  } else if (randomSurah === endS) {
    randomAyah = Math.floor(Math.random() * endA) + 1;
  } else {
    const maxA = SURAH_AYAH_COUNTS[randomSurah - 1];
    randomAyah = Math.floor(Math.random() * maxA) + 1;
  }

  let verseText = '';
  try {
    const resp = await fetch(`https://api.quran.com/api/v4/verses/by_key/${randomSurah}:${randomAyah}?fields=text_uthmani`);
    const json = await resp.json();
    verseText = json?.verse?.text_uthmani ?? '';
  } catch { return; }
  if (!verseText) return;

  const surahStr = String(randomSurah).padStart(3, '0');
  const ayahStr  = String(randomAyah).padStart(3, '0');
  const audioUrl = `https://verses.quran.com/Alafasy/mp3/${surahStr}${ayahStr}.mp3`;

  const { data: insertedChallenge } = await supabase.from('group_hifz_challenges').insert({
    circle_id:    circleId,
    created_by:   currentUserId,
    surah_number: randomSurah,
    ayah_number:  randomAyah,
    surah_name:   SURAH_NAMES[randomSurah] ?? `Surah ${randomSurah}`,
    ayah_text:    verseText,
    audio_url:    audioUrl,
  }).select();

  if (insertedChallenge && insertedChallenge[0]) {
    await supabase.from('circle_messages').insert({
      circle_id: circleId,
      user_id:   currentUserId,
      type:      'daily_hifz_challenge',
      message:   insertedChallenge[0].id
    });
  }
}

interface Message {
  id: string;
  circle_id: string;
  user_id: string;
  content: string;
  type: string;
  reply_to_id: string | null;
  created_at: string;
  sender_name?: string;
  custom_title?: string;
  reply_preview?: string;
  reactions?: Record<string, string[]>;
  audio_url?: string;
  audio_duration_ms?: number;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function MessageContextMenu({ visible, msg, isOwn, colors, isDark, onPick, onClose, onReply, onCopy, onStar, onDelete, isStarred }: {
  visible: boolean;
  msg: Message | null;
  isOwn: boolean;
  colors: any;
  isDark: boolean;
  onPick: (emoji: string) => void;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onStar: () => void;
  onDelete: () => void;
  isStarred: boolean;
}) {
  const inputRef = useRef<TextInput>(null);
  const cardBg = isDark ? 'transparent' : 'transparent';
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textCol = isDark ? '#FFFFFF' : '#000000';
  const subCol = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';

  if (!visible || !msg) return null;

  const actions = [
    { label: 'Reply', icon: <CornerUpLeft size={20} color={textCol} />, onPress: () => { onClose(); onReply(); } },
    { label: 'Copy', icon: <Copy size={20} color={textCol} />, onPress: () => { onClose(); onCopy(); } },
    { label: isStarred ? 'Unstar' : 'Star', icon: <Star size={20} color={isStarred ? '#F5A623' : textCol} fill={isStarred ? '#F5A623' : 'none'} />, onPress: () => { onStar(); onClose(); } },
    ...(isOwn ? [{ label: 'Delete', icon: <Trash2 size={20} color='#FF3B30' />, onPress: () => { onClose(); onDelete(); }, danger: true }] : []),
  ];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={cmStyles.backdrop} activeOpacity={1} onPress={onClose}>
        <Animated.View entering={FadeInDown.duration(180)} style={{ marginHorizontal: 12, marginBottom: 32 }}>
          <GlassCard radius={24} style={cmStyles.sheet}>
            {/* Emoji row */}
            <View style={[cmStyles.emojiRow, { borderBottomColor: borderCol }]}>
              {EMOJIS.map(e => (
                <TouchableOpacity key={e} style={cmStyles.emojiBtn} onPress={() => { onPick(e); onClose(); }}>
                  <Text style={cmStyles.emoji}>{e}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={cmStyles.emojiBtn} onPress={() => inputRef.current?.focus()}>
                <Plus size={22} color={subCol} />
              </TouchableOpacity>
            </View>
            {/* Action rows */}
            {actions.map((action, i) => (
              <TouchableOpacity
                key={action.label}
                style={[cmStyles.actionRow, i < actions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderCol }]}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <Text style={[cmStyles.actionLabel, (action as any).danger && { color: '#FF3B30' }]}>{action.label}</Text>
                {action.icon}
              </TouchableOpacity>
            ))}
          </GlassCard>
        </Animated.View>
        <TextInput
          ref={inputRef}
          style={{ width: 1, height: 1, opacity: 0, position: 'absolute', top: -100, left: -100 }}
          autoCorrect={false}
          autoCapitalize="none"
          keyboardType="default"
          onChangeText={(text) => {
            const trimmed = text.trim();
            if (trimmed.length > 0) {
              onPick(trimmed.charAt(0) + (trimmed.length > 1 ? trimmed.charAt(1) : ''));
              onClose();
            }
          }}
        />
      </TouchableOpacity>
    </Modal>
  );
}

const cmStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { overflow: 'hidden' },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  emojiBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 28 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  actionLabel: { fontSize: 16, fontFamily: Fonts.sansSemiBold },
});

function MessageBubble({ msg, isOwn, colors, userId, onLongPress, onReply }: {
  msg: Message; isOwn: boolean; colors: any; userId: string;
  onLongPress: (msg: Message) => void; onReply: (msg: Message) => void;
}) {
  const reactionEntries = Object.entries(msg.reactions ?? {});
  const swipeableRef = useRef<Swipeable>(null);

  const renderReplyAction = () => (
    <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
      <CornerUpLeft size={24} color={colors.textTertiary} />
    </View>
  );

  return (
    <Animated.View entering={FadeIn.duration(250)}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={isOwn ? undefined : renderReplyAction}
        renderLeftActions={isOwn ? renderReplyAction : undefined}
        onSwipeableOpen={() => {
          onReply(msg);
          swipeableRef.current?.close();
        }}
        overshootRight={false}
        overshootLeft={false}
      >
        <View style={[styles.msgRow, isOwn && styles.msgRowOwn]}>
          <TouchableOpacity activeOpacity={0.85} onLongPress={() => onLongPress(msg)}
            style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther,
              isOwn ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
        {!isOwn && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Text style={[styles.senderName, { color: colors.primary, marginBottom: 0 }]}>{msg.type === 'daily_hifz_challenge' ? 'Lahzah Bot' : (msg.sender_name ?? 'Member')}</Text>
            {msg.custom_title && (
              <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontFamily: Fonts.sansSemiBold, color: colors.primary }}>{msg.custom_title}</Text>
              </View>
            )}
          </View>
        )}
        {msg.reply_preview && (
          <View style={[styles.replyPreview, { borderLeftColor: isOwn ? 'rgba(255,255,255,0.5)' : colors.primary, backgroundColor: isOwn ? 'rgba(255,255,255,0.15)' : colors.primaryLight }]}>
            <Text style={[styles.replyText, { color: isOwn ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]} numberOfLines={1}>{msg.reply_preview}</Text>
          </View>
        )}
        
        {msg.type === 'poll' ? (
          <PollBubble pollId={msg.content} userId={userId} colors={colors} isOwn={isOwn} />
        ) : msg.type === 'event' ? (
          <EventBubble eventId={msg.content} userId={userId} colors={colors} isOwn={isOwn} />
        ) : msg.type === 'hifz_challenge' || msg.type === 'daily_hifz_challenge' ? (
          <HifzChallengeBubble challengeId={msg.content} userId={userId} colors={colors} isOwn={msg.user_id === userId} />
        ) : msg.type === 'hifz_outcome' ? (
          <View style={{ backgroundColor: isOwn ? 'rgba(255,255,255,0.1)' : colors.primaryLight, padding: 12, borderRadius: 12, marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Brain size={16} color={isOwn ? '#fff' : colors.primary} />
              <Text style={{ fontFamily: Fonts.sansSemiBold, color: isOwn ? '#fff' : colors.primary, fontSize: 13 }}>Hifz Retention Test</Text>
            </View>
            <Text style={[styles.msgContent, { color: isOwn ? '#fff' : colors.text }]}>{msg.content}</Text>
          </View>
        ) : msg.type === 'voice_note' && msg.audio_url ? (
          <AudioMessageBubble
            url={msg.audio_url}
            durationMs={msg.audio_duration_ms ?? 0}
            isOwn={isOwn}
            colors={colors}
          />
        ) : (
          <Text style={[styles.msgContent, { color: isOwn ? '#fff' : colors.text }]}>
            {msg.content.split(/(@\w+)/g).map((part, i) => 
              part.startsWith('@') ? <Text key={i} style={{ color: isOwn ? 'rgba(255,255,255,0.9)' : colors.primary, fontFamily: Fonts.sansSemiBold }}>{part}</Text> : part
            )}
          </Text>
        )}

        <View style={styles.msgFooter}>
          <Text style={[styles.msgTime, { color: isOwn ? 'rgba(255,255,255,0.6)' : colors.textTertiary }]}>{formatTime(msg.created_at)}</Text>
          <TouchableOpacity onPress={() => onReply(msg)} style={styles.replyBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <CornerUpLeft size={12} color={isOwn ? 'rgba(255,255,255,0.6)' : colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      {reactionEntries.length > 0 && (
        <View style={[styles.reactionsRow, isOwn && styles.reactionsRowOwn]}>
          {reactionEntries.map(([emoji, uids]) => {
            return (
              <View key={emoji} style={[styles.reactionPill, uids.includes(userId) && { backgroundColor: colors.primaryLight ?? 'rgba(0,0,0,0.06)' }]}>
                <Text style={{ fontSize: 13 }}>{emoji}</Text>
                {uids.length > 1 && <Text style={[styles.reactionCount, { color: colors.textSecondary }]}>{uids.length}</Text>}
              </View>
            );
          })}
        </View>
      )}
      </View>
      </Swipeable>
    </Animated.View>
  );
}

function DateSeparator({ label, colors }: { label: string; colors: any }) {
  return (
    <View style={styles.dateSepRow}>
      <View style={[styles.dateSepLine, { backgroundColor: colors.border }]} />
      <Text style={[styles.dateSepText, { color: colors.textTertiary }]}>{label}</Text>
      <View style={[styles.dateSepLine, { backgroundColor: colors.border }]} />
    </View>
  );
}

export default function CircleChat() {
  const { id, name, inviteCode } = useLocalSearchParams<{ id: string; name: string; inviteCode: string }>();
  const { colors, isDark } = useAppTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [pickerTarget, setPickerTarget] = useState<Message | null>(null);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [summary, setSummary] = useState<string[] | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [memberData, setMemberData] = useState<Record<string, { name: string; role: string; custom_title?: string }>>({});
  const [postingPolicy, setPostingPolicy] = useState('all');
  const [circleDesc, setCircleDesc] = useState('');
  const [groupGoalType, setGroupGoalType] = useState<string | null>(null);
  const [groupGoalTarget, setGroupGoalTarget] = useState<string | null>(null);
  const [readingGoal, setReadingGoal] = useState<CircleGoal | null>(null);
  const [hifzGoal, setHifzGoal] = useState<CircleGoal | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showPersonalGoalModal, setShowPersonalGoalModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showHalaqahModal, setShowHalaqahModal] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [pendingMembers, setPendingMembers] = useState<{ id: string; name: string }[]>([]);
  const [activeToday, setActiveToday] = useState(0);
  const [circleStreak, setCircleStreak] = useState(0);
  const [codeCopied, setCodeCopied] = useState(false);
  const flatRef = useRef<FlatList>(null);

  // ── Voice Note state ─────────────────────────────────────────────
  const voiceNote = useVoiceNote();
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number>(0);
  const [recordingDisplayMs, setRecordingDisplayMs] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingPulse = useRef(new RNAnimated.Value(1)).current;

  const copyInviteCode = async () => {
    await Clipboard.setStringAsync(inviteCode as string);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const myRole = memberData[userId]?.role ?? 'member';
  const isAdmin = myRole === 'admin';
  const canPost = postingPolicy === 'all' || isAdmin;

  // Load starred message IDs for the current user
  useEffect(() => {
    if (!userId) return;
    supabase.from('starred_messages').select('message_id').eq('user_id', userId)
      .then(({ data }) => {
        if (data) setStarredIds(new Set(data.map((r: any) => r.message_id)));
      });
  }, [userId]);

  const handleStar = async (msg: Message) => {
    if (!userId || !msg) return;
    const alreadyStarred = starredIds.has(msg.id as string);
    // Optimistic update
    setStarredIds(prev => {
      const next = new Set(prev);
      alreadyStarred ? next.delete(msg.id as string) : next.add(msg.id as string);
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (alreadyStarred) {
      await supabase.from('starred_messages').delete()
        .eq('user_id', userId).eq('message_id', msg.id);
    } else {
      await supabase.from('starred_messages').insert({
        user_id: userId,
        message_id: msg.id,
        content: msg.content,
        sender_name: msg.sender_name,
        circle_id: id,
        circle_name: name,
        created_at: msg.created_at,
      });
    }
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      
      const { data: circleInfo } = await supabase.from('circles').select('posting_policy, description, group_goal_type, group_goal_target, require_approval, goal_start_surah, goal_start_ayah, goal_end_surah, goal_end_ayah, goal_total_ayahs, hifz_goal_start_surah, hifz_goal_start_ayah, hifz_goal_end_surah, hifz_goal_end_ayah, hifz_goal_total_ayahs, last_automated_challenge_date').eq('id', id).single();
      if (circleInfo) {
        setPostingPolicy(circleInfo.posting_policy || 'all');
        setCircleDesc(circleInfo.description || '');
        setGroupGoalType(circleInfo.group_goal_type);
        setGroupGoalTarget(circleInfo.group_goal_target);
        setRequireApproval(circleInfo.require_approval || false);
        if (circleInfo.goal_start_surah) {
          setReadingGoal({
            startSurah: circleInfo.goal_start_surah,
            startAyah: circleInfo.goal_start_ayah,
            endSurah: circleInfo.goal_end_surah,
            endAyah: circleInfo.goal_end_ayah,
            totalAyahs: circleInfo.goal_total_ayahs || 0,
          });
        }
        
        if (circleInfo.hifz_goal_start_surah) {
          setHifzGoal({
            startSurah: circleInfo.hifz_goal_start_surah,
            startAyah: circleInfo.hifz_goal_start_ayah,
            endSurah: circleInfo.hifz_goal_end_surah,
            endAyah: circleInfo.hifz_goal_end_ayah,
            totalAyahs: circleInfo.hifz_goal_total_ayahs || 0,
          });

          const todayStr = new Date().toISOString().split('T')[0];
          if (circleInfo.last_automated_challenge_date !== todayStr) {
            triggerDailyHifzBot(circleInfo, id as string, user?.id || null);
          }
        }
      }

      const { data: members } = await supabase
        .from('circle_members').select('user_id, role, status, custom_title, users(display_name)').eq('circle_id', id);
      if (members) {
        const mData: Record<string, { name: string; role: string; custom_title?: string }> = {};
        const pending: { id: string; name: string }[] = [];
        members.forEach((m: any) => { 
          if (m.status === 'pending') {
            pending.push({ id: m.user_id, name: m.users?.display_name ?? 'Member' });
          } else {
            mData[m.user_id] = { name: m.users?.display_name ?? 'Member', role: m.role || 'member', custom_title: m.custom_title };
          }
        });
        setMemberData(mData);
        setPendingMembers(pending);
      }

      // Fetch circle stats (aggregate presence and streak)
      const { data: stats } = await supabase.rpc('get_circle_stats', { p_circle_id: id }).maybeSingle();
      if (stats) {
        setActiveToday((stats as any).active_today || 0);
        setCircleStreak((stats as any).current_streak || 0);
      }

    })();
  }, [id]);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase.from('circle_messages').select('*')
      .eq('circle_id', id).order('created_at', { ascending: false }).limit(80);
    if (!data) { setLoading(false); return; }
    const msgIds = data.map((m: any) => m.id);
    const { data: reactions } = await supabase.from('circle_reactions').select('*').in('message_id', msgIds);
    const reactionMap: Record<string, Record<string, string[]>> = {};
    (reactions ?? []).forEach((r: any) => {
      if (!reactionMap[r.message_id]) reactionMap[r.message_id] = {};
      if (!reactionMap[r.message_id][r.emoji]) reactionMap[r.message_id][r.emoji] = [];
      reactionMap[r.message_id][r.emoji].push(r.user_id);
    });
    const replyIds = data.filter((m: any) => m.reply_to_id).map((m: any) => m.reply_to_id);
    const replyMap: Record<string, string> = {};
    if (replyIds.length > 0) {
      const { data: replyMsgs } = await supabase.from('circle_messages').select('id, message').in('id', replyIds);
      (replyMsgs ?? []).forEach((r: any) => { replyMap[r.id] = r.message; });
    }
    setMessages(data.map((m: any) => ({
      ...m,
      content: m.message ?? m.content ?? '',  // map DB 'message' → interface 'content'
      sender_name: memberData[m.user_id]?.name ?? 'Member',
      custom_title: memberData[m.user_id]?.custom_title,
      reactions: reactionMap[m.id] ?? {},
      reply_preview: m.reply_to_id ? replyMap[m.reply_to_id] : undefined,
    })));
    setLoading(false);
  }, [id, memberData]);

  useEffect(() => { loadMessages(); }, [memberData]);

  useEffect(() => {
    const channel = supabase.channel(`circle-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'circle_messages', filter: `circle_id=eq.${id}` }, (payload) => {
        const newMsg = payload.new as any;
        // Skip if already optimistically added (temp or real duplicate)
        setMessages(prev => {
          const isDup = prev.some(m => m.id === newMsg.id);
          if (isDup) return prev;
          // Also replace any temp message with same content from same user
          const tempIdx = prev.findIndex(m =>
            typeof m.id === 'string' && m.id.startsWith('temp-') &&
            m.user_id === newMsg.user_id &&
            (m.content === (newMsg.message ?? newMsg.content))
          );
          const mapped = {
            ...newMsg,
            content: newMsg.message ?? newMsg.content ?? '',
            sender_name: memberData[newMsg.user_id]?.name ?? 'Member',
            custom_title: memberData[newMsg.user_id]?.custom_title,
            reactions: {},
          };
          if (tempIdx !== -1) {
            const updated = [...prev];
            updated[tempIdx] = mapped;
            return updated;
          }
          return [mapped, ...prev];
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'circle_reactions' }, () => { loadMessages(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'circles', filter: `id=eq.${id}` }, (payload) => {
        if (payload.new.posting_policy) setPostingPolicy(payload.new.posting_policy);
        if (payload.new.description) setCircleDesc(payload.new.description);
        if (payload.new.group_goal_type !== undefined) setGroupGoalType(payload.new.group_goal_type);
        if (payload.new.group_goal_target !== undefined) setGroupGoalTarget(payload.new.group_goal_target);
        if (payload.new.require_approval !== undefined) setRequireApproval(payload.new.require_approval);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, memberData]);

  // ── Voice note send ───────────────────────────────────────────────
  const startVoiceRecording = async () => {
    const ok = await voiceNote.startRecording();
    if (!ok) return;
    setIsRecordingVoice(true);
    setRecordingDisplayMs(0);
    const start = Date.now();
    setRecordingStartedAt(start);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Pulsing animation
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(recordingPulse, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        RNAnimated.timing(recordingPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();

    // Live duration counter
    recordingTimerRef.current = setInterval(() => {
      setRecordingDisplayMs(Date.now() - start);
    }, 100);
  };

  const stopVoiceRecording = async (cancel = false) => {
    recordingPulse.stopAnimation();
    recordingPulse.setValue(1);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecordingVoice(false);

    if (cancel) {
      await voiceNote.cancelRecording();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const result = await voiceNote.stopAndUpload();
    if (!result) return;

    setSending(true);
    const payload: any = {
      circle_id: id,
      user_id: userId,
      message: '🎙️ Voice note',
      type: 'voice_note',
      audio_url: result.url,
      audio_duration_ms: result.durationMs,
    };
    if (replyTo) payload.reply_to_id = replyTo.id;
    setReplyTo(null);

    const tempId = `temp-${Date.now()}`;
    const optimistic: any = {
      id: tempId,
      circle_id: id,
      user_id: userId,
      content: '🎙️ Voice note',
      message: '🎙️ Voice note',
      type: 'voice_note',
      audio_url: result.url,
      audio_duration_ms: result.durationMs,
      created_at: new Date().toISOString(),
      sender_name: memberData[userId]?.name ?? 'Member',
      custom_title: memberData[userId]?.custom_title,
      reactions: {},
    };
    setMessages(prev => [optimistic, ...prev]);
    setTimeout(() => flatRef.current?.scrollToIndex({ index: 0, animated: true }), 50);

    const { error, data } = await supabase.from('circle_messages').insert(payload).select().single();
    if (error) {
      Alert.alert('Error', error.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else if (data) {
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...data, content: '🎙️ Voice note', audio_url: result.url, audio_duration_ms: result.durationMs, sender_name: memberData[userId]?.name ?? 'Member', custom_title: memberData[userId]?.custom_title, reactions: {} }
          : m
      ));
    }
    setSending(false);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');
    const mentions = text.match(/@\w+/g)?.map(m => m.substring(1)) || [];
    const payload: any = { circle_id: id, user_id: userId, message: text, type: 'text' };
    if (replyTo) payload.reply_to_id = replyTo.id;
    setReplyTo(null);
    // Optimistic local insert so message appears immediately
    const tempId = `temp-${Date.now()}`;
    const optimistic: any = {
      id: tempId, circle_id: id, user_id: userId,
      message: text, content: text, type: 'text',
      created_at: new Date().toISOString(),
      reply_to_id: replyTo?.id ?? null,
      sender_name: memberData[userId]?.name ?? 'Member',
      custom_title: memberData[userId]?.custom_title,
      reactions: {},
    };
    setMessages(prev => [optimistic, ...prev]);
    setTimeout(() => flatRef.current?.scrollToIndex({ index: 0, animated: true }), 50);
    const { error, data } = await supabase.from('circle_messages').insert(payload).select().single();
    if (error) {
      Alert.alert('Error', error.message);
      setMessages(prev => prev.filter(m => m.id !== tempId)); // rollback
    } else if (data) {
      // Replace temp with real row
      setMessages(prev => prev.map(m => m.id === tempId
        ? { ...data, content: data.message ?? data.content ?? text, sender_name: memberData[userId]?.name ?? 'Member', custom_title: memberData[userId]?.custom_title, reactions: {} }
        : m
      ));

      // Handle mentions push notifications
      if (mentions.length > 0) {
        if (mentions.includes('all')) {
          const allUserIds = Object.keys(memberData).filter(uid => uid !== userId);
          const notifications = allUserIds.map(uid => ({
            circle_id: id,
            recipient_user_id: uid,
            sender_user_id: userId,
            message_id: data.id,
            type: 'mention_all'
          }));
          if (notifications.length > 0) supabase.from('circle_notifications').insert(notifications).then();
        } else {
          const targetUids = Object.entries(memberData)
            .filter(([uid, md]) => mentions.some(m => md.name.toLowerCase().includes(m.toLowerCase())))
            .map(([uid]) => uid)
            .filter(uid => uid !== userId);
          if (targetUids.length > 0) {
            const notifications = targetUids.map(uid => ({
              circle_id: id,
              recipient_user_id: uid,
              sender_user_id: userId,
              message_id: data.id,
              type: 'mention'
            }));
            supabase.from('circle_notifications').insert(notifications).then();
          }
        }
      }
    }
    setSending(false);
  };

  const handleReact = async (emoji: string) => {
    if (!pickerTarget) return;
    const existing = pickerTarget.reactions?.[emoji]?.includes(userId);
    if (existing) {
      await supabase.from('circle_reactions').delete()
        .eq('message_id', pickerTarget.id).eq('user_id', userId).eq('emoji', emoji);
    } else {
      await supabase.from('circle_reactions').insert({ message_id: pickerTarget.id, user_id: userId, emoji });
    }
    await loadMessages();
  };

  const shareInvite = () => Share.share({
    message: `Join my Quran study circle "${name}" on Lahzah!\n\nInvite code: ${inviteCode}\n\nDeep link: lahzah://circles/join/${inviteCode}`,
    title: `Join "${name}" on Lahzah`,
  });

  const togglePolicy = async () => {
    const newPol = postingPolicy === 'admins_only' ? 'all' : 'admins_only';
    setPostingPolicy(newPol);
    const { error } = await supabase.from('circles').update({ posting_policy: newPol }).eq('id', id);
    if (error) {
      Alert.alert('Error', error.message);
      setPostingPolicy(postingPolicy); // Revert on failure
    }
  };

  const removeMember = async (uid: string) => {
    Alert.alert('Remove Member', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
          await supabase.from('circle_members').delete().eq('circle_id', id).eq('user_id', uid);
          setMemberData(prev => { const n = {...prev}; delete n[uid]; return n; });
      }}
    ]);
  };

  const handleApproveMember = async (targetUid: string) => {
    const { error } = await supabase.from('circle_members').update({ status: 'approved' }).eq('circle_id', id).eq('user_id', targetUid);
    if (error) Alert.alert('Error', error.message);
    else {
      setPendingMembers(prev => prev.filter(p => p.id !== targetUid));
      Alert.alert('Approved', 'Member approved');
    }
  };

  const handleRejectMember = async (targetUid: string) => {
    const { error } = await supabase.from('circle_members').delete().eq('circle_id', id).eq('user_id', targetUid);
    if (error) Alert.alert('Error', error.message);
    else setPendingMembers(prev => prev.filter(p => p.id !== targetUid));
  };

  const toggleRequireApproval = async () => {
    const val = !requireApproval;
    setRequireApproval(val);
    await supabase.from('circles').update({ require_approval: val }).eq('id', id);
  };

  const setGroupGoalPrompt = () => {
    setShowSettings(false);
    setTimeout(() => setShowGoalModal(true), 300);
  };

  const promoteAdmin = async (uid: string) => {
    await supabase.from('circle_members').update({ role: 'admin' }).eq('circle_id', id).eq('user_id', uid);
    setMemberData(prev => ({ ...prev, [uid]: { ...prev[uid], role: 'admin' } }));
  };

  const handleSummarize = async () => {
    try {
      setSummarizing(true);
      const msgsToSummarize = messages
        .filter(m => m.type === 'text')
        .slice(0, 30)
        .reverse()
        .map(m => ({ sender_name: m.sender_name || 'Member', content: m.content }));
      
      const bullets = await summarizeChatMessages(msgsToSummarize);
      setSummary(bullets);
    } catch (err: any) {
      Alert.alert('Summary Error', err.message);
    } finally {
      setSummarizing(false);
    }
  };



  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isBot = item.type === 'daily_hifz_challenge';
    const isOwn = !isBot && item.user_id === userId;
    const showDate = index === messages.length - 1 ||
      new Date(messages[index + 1].created_at).toDateString() !== new Date(item.created_at).toDateString();
    return (
      <>
        {showDate && <DateSeparator label={formatDateSeparator(item.created_at)} colors={colors} />}
        <MessageBubble msg={item} isOwn={isOwn} colors={colors} userId={userId}
          onLongPress={(m) => setPickerTarget(m)} onReply={(m) => setReplyTo(m)} />
      </>
    );
  };

  return (
    <ImageBackground source={require('../../../../assets/images/background_image.jpg')} style={{ flex: 1 }} resizeMode="cover">
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={isDark ? ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.9)']} style={StyleSheet.absoluteFill} />
      </View>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <GlassBlur intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.header, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)', borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/messages')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerCenter} onPress={() => setShowSettings(true)} activeOpacity={0.7}>
          <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            {circleStreak > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Flame size={12} color={colors.primary} />
                <Text style={{ color: colors.textTertiary, fontFamily: Fonts.sans, fontSize: 12 }}>{circleStreak} Day Streak · </Text>
              </View>
            )}
            <Users size={12} color={colors.textTertiary} />
            <Text style={{ color: colors.textTertiary, fontFamily: Fonts.sans, fontSize: 12 }}>{activeToday} active today</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowHalaqahModal(true)} hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}>
          <Phone size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowSettings(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Settings size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </GlassBlur>

      {/* Group Goal Sticky Header - tappable for all members */}
      {(readingGoal || hifzGoal) && (
        <TouchableOpacity
          style={{ backgroundColor: colors.primaryLight, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}
          onPress={() => setShowGoalModal(true)}
          activeOpacity={0.7}
        >
          <Target size={14} color={colors.primary} />
          <View style={{ flex: 1, flexDirection: 'column' }}>
            {readingGoal && (
              <Text style={{ fontFamily: Fonts.sansSemiBold, fontSize: 13, color: colors.primary }}>
                Reading: {readingGoal.startSurah}:{readingGoal.startAyah} → {readingGoal.endSurah}:{readingGoal.endAyah}
              </Text>
            )}
            {hifzGoal && (
              <Text style={{ fontFamily: Fonts.sansSemiBold, fontSize: 13, color: colors.primary }}>
                Hifz: {hifzGoal.startSurah}:{hifzGoal.startAyah} → {hifzGoal.endSurah}:{hifzGoal.endAyah}
              </Text>
            )}
          </View>
          <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 12, color: colors.primary }}>View →</Text>
        </TouchableOpacity>
      )}


      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {loading ? <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
        : messages.length === 0 ? (
          <View style={styles.empty}>

            <Text style={[styles.emptyTitle, { color: colors.text }]}>Start the conversation</Text>
            <Text style={[styles.emptySub, { color: colors.textTertiary }]}>Be the first to send a message to this circle.</Text>
          </View>
        ) : (
          <FlatList ref={flatRef} data={messages} renderItem={renderItem}
            keyExtractor={(item) => item.id} inverted
            contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}
            ListFooterComponent={() => (
              messages.length > 5 ? (
                <View style={[styles.catchUpBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {summary ? (
                    <View style={styles.summaryBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Sparkles size={16} color={colors.primary} />
                        <Text style={[styles.summaryTitle, { color: colors.primary, marginBottom: 0 }]}>AI Summary</Text>
                      </View>
                      {summary.map((b, i) => <Text key={i} style={[styles.summaryText, { color: colors.text }]}>• {b}</Text>)}
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.catchUpBtn} onPress={handleSummarize} disabled={summarizing}>
                      {summarizing ? <ActivityIndicator size="small" color={colors.primary} /> : (
                        <>
                          <Sparkles size={16} color="#fff" />
                          <Text style={[styles.catchUpText, { color: colors.text }]}>Catch Up on Missed Messages</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ) : null
            )}
          />
        )}

        {replyTo && (
          <Animated.View entering={FadeInDown.duration(200)} style={[styles.replyBar, { backgroundColor: colors.primaryLight, borderTopColor: colors.primary }]}>
            <View style={[styles.replyBarLine, { backgroundColor: colors.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.replyBarLabel, { color: colors.primary }]}>Replying to</Text>
              <Text style={[styles.replyBarText, { color: colors.textSecondary }]} numberOfLines={1}>{replyTo.content}</Text>
            </View>
            <TouchableOpacity onPress={() => setReplyTo(null)}><X size={18} color={colors.textSecondary} /></TouchableOpacity>
          </Animated.View>
        )}

        <GlassBlur intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.composer, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)', borderTopColor: colors.border }]}>
          {canPost ? (
            <>
              <TouchableOpacity onPress={() => setShowAttachMenu(!showAttachMenu)} style={{ padding: 8, paddingBottom: 12 }}>
                <Plus size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              {showAttachMenu && (
                <View style={[styles.attachMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TouchableOpacity style={styles.attachBtn} onPress={() => { setShowAttachMenu(false); setShowPollModal(true); }}>
                    <BarChart2 size={18} color={colors.primary} />
                    <Text style={[styles.attachText, { color: colors.text }]}>Poll</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.attachBtn} onPress={() => { setShowAttachMenu(false); setShowEventModal(true); }}>
                    <Calendar size={18} color={colors.primary} />
                    <Text style={[styles.attachText, { color: colors.text }]}>Event</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.attachBtn} onPress={() => { setShowAttachMenu(false); setShowGoalModal(true); }}>
                    <Target size={18} color={colors.primary} />
                    <Text style={[styles.attachText, { color: colors.text }]}>Group Goal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.attachBtn} onPress={() => { setShowAttachMenu(false); setShowPersonalGoalModal(true); }}>
                    <Target size={18} color={colors.textSecondary} />
                    <Text style={[styles.attachText, { color: colors.text }]}>Personal Goal</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Message…"
                placeholderTextColor={colors.textTertiary}
                style={[styles.composerInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                multiline
                maxLength={1000}
                keyboardType="default"
                returnKeyType="default"
                autoCorrect={false}
                autoCapitalize="sentences"
              />
              {/* ── Voice Note Recorder ── */}
              {isRecordingVoice ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {/* Cancel swipe hint */}
                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: '#FF3B3020' }]}
                    onPress={() => stopVoiceRecording(true)}
                  >
                    <MicOff size={18} color="#FF3B30" />
                  </TouchableOpacity>
                  {/* Recording indicator */}
                  <RNAnimated.View style={[
                    styles.recordingPill,
                    { backgroundColor: '#FF3B30', transform: [{ scale: recordingPulse }] }
                  ]}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingTime}>
                      {Math.floor(recordingDisplayMs / 60000)}:{String(Math.floor((recordingDisplayMs % 60000) / 1000)).padStart(2, '0')}
                    </Text>
                  </RNAnimated.View>
                  {/* Send voice note */}
                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                    onPress={() => stopVoiceRecording(false)}
                  >
                    <Send size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : voiceNote.isUploading || (sending && !draft.trim()) ? (
                <View style={[styles.sendBtn, { backgroundColor: colors.primaryLight }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <TouchableOpacity
                  onPress={draft.trim() ? send : startVoiceRecording}
                  disabled={sending}
                  style={[styles.sendBtn, { backgroundColor: draft.trim() ? colors.primary : colors.primaryLight }]}
                >
                  {sending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : draft.trim()
                    ? <Send size={18} color="#fff" />
                    : <Mic size={18} color={colors.primary} />}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={[styles.composerLocked, { color: colors.textTertiary }]}>Only admins can send messages.</Text>
          )}
        </GlassBlur>
      </KeyboardAvoidingView>

      <MessageContextMenu
        visible={!!pickerTarget}
        msg={pickerTarget}
        isOwn={pickerTarget?.user_id === userId}
        colors={colors}
        isDark={isDark}
        isStarred={starredIds.has(pickerTarget?.id as string)}
        onPick={handleReact}
        onClose={() => setPickerTarget(null)}
        onReply={() => { if (pickerTarget) { setReplyTo(pickerTarget); setPickerTarget(null); } }}
        onCopy={() => { if (pickerTarget) Clipboard.setStringAsync(pickerTarget.content); }}
        onStar={() => { if (pickerTarget) handleStar(pickerTarget); }}
        onDelete={() => {
          if (!pickerTarget) return;
          Alert.alert('Delete Message', 'Delete this message for everyone?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
              await supabase.from('circle_messages').delete().eq('id', pickerTarget.id);
              setMessages(prev => prev.filter(m => m.id !== pickerTarget.id));
              setPickerTarget(null);
            }}
          ]);
        }}
      />

      <CreatePollModal visible={showPollModal} onClose={() => setShowPollModal(false)} circleId={id as string} userId={userId} colors={colors} />
      <CreateEventModal visible={showEventModal} onClose={() => setShowEventModal(false)} circleId={id as string} userId={userId} colors={colors} />

      <CircleGoalPickerModal
        visible={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        circleId={id as string}
        isAdmin={isAdmin}
        currentReadingGoal={readingGoal}
        currentHifzGoal={hifzGoal}
        onGoalSaved={(goal, type) => {
          if (type === 'reading') {
            setReadingGoal(goal);
            setGroupGoalType('ayahs');
            setGroupGoalTarget(String(goal.totalAyahs));
          } else {
            setHifzGoal(goal);
          }
        }}
      />

      <CircleGoalPickerModal
        visible={showPersonalGoalModal}
        onClose={() => setShowPersonalGoalModal(false)}
        personalMode={true}
        onPersonalGoalSaved={async (goal) => {
          const { error } = await supabase.from('circle_members')
            .update({ personal_goal: goal })
            .eq('circle_id', id)
            .eq('user_id', userId);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            Alert.alert('Success', 'Personal goal saved!');
          }
        }}
      />

      <MemberRoleModal
        visible={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        circleId={id as string}
        memberData={memberData}
        onUpdateMember={(uid, title) => {
          setMemberData(prev => ({
            ...prev,
            [uid]: { ...prev[uid], custom_title: title }
          }));
        }}
      />

      <HalaqahRoomModal
        visible={showHalaqahModal}
        onClose={() => setShowHalaqahModal(false)}
        circleId={id as string}
        circleName={name as string}
        userId={userId}
        userName={memberData[userId]?.name ?? 'Member'}
      />

      <Modal visible={showInvite} transparent animationType="fade" onRequestClose={() => setShowInvite(false)}>
        <TouchableOpacity style={cmStyles.backdrop} activeOpacity={1} onPress={() => setShowInvite(false)}>
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.inviteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.inviteTitle, { color: colors.text }]}>Invite to {name}</Text>
            <Text style={[styles.inviteSub, { color: colors.textTertiary }]}>Scan QR or share the code</Text>
            
            <View style={styles.qrContainer}>
              <QRCode value={`lahzah://circles/join/${inviteCode}`} size={160} color={colors.text} backgroundColor="transparent" />
            </View>

            <View style={[styles.codeBox, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
              <Text style={[styles.codeText, { color: colors.primary }]}>{inviteCode}</Text>
            </View>
            <TouchableOpacity onPress={shareInvite} style={[styles.shareBtn, { backgroundColor: colors.primary }]}>
              <Share2 size={16} color="#fff" />
              <Text style={styles.shareBtnText}>Share Link</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <GlassBlur intensity={80} tint={colors.background === '#000000' ? 'dark' : 'light'} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={[styles.settingsSheet, { backgroundColor: colors.background === '#000000' ? 'rgba(20,20,20,0.85)' : 'rgba(255,255,255,0.85)' }]}>
            
            <View style={styles.dragHandle} />

            <View style={[styles.settingsHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingsTitle, { color: colors.text }]}>Circle Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <View style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
                  <X size={20} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={Object.entries(memberData).sort((a, b) => (a[1].role === 'admin' ? -1 : 1))}
              keyExtractor={([uid]) => uid}
              ListHeaderComponent={
                <View style={{ paddingBottom: 20 }}>
                  <View style={styles.bigAvatarContainer}>
                    <View style={[styles.bigAvatar, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.bigAvatarText, { color: colors.primary }]}>{name.substring(0, 1).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.bigName, { color: colors.text }]}>{name}</Text>
                    <Text style={[styles.bigDesc, { color: colors.textSecondary }]}>{circleDesc || 'No description provided.'}</Text>
                  </View>
                  
                  {isAdmin && (
                    <View style={styles.premiumCardContainer}>
                      <Text style={[styles.premiumSectionTitle, { color: colors.textTertiary }]}>CIRCLE GOAL</Text>
                      <View style={[styles.premiumCard, { backgroundColor: colors.surface }]}>
                        <TouchableOpacity style={styles.premiumRow} onPress={setGroupGoalPrompt} activeOpacity={0.7}>
                          <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                            <Target size={18} color={colors.primary} />
                          </View>
                          <View style={styles.premiumRowContent}>
                            <Text style={[styles.premiumRowTitle, { color: colors.text }]}>Shared Reading Target</Text>
                            <Text style={[styles.premiumRowDesc, { color: colors.textTertiary }]}>Set a goal to read together</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.premiumRowValue, { color: colors.primary }]}>{groupGoalType ? `${groupGoalTarget} ${groupGoalType}` : 'Tap to set'}</Text>
                            <ChevronRight size={16} color={colors.textTertiary} />
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}


                  {/* ── Invite Link Card ── */}
                  <View style={styles.premiumCardContainer}>
                    <Text style={[styles.premiumSectionTitle, { color: colors.textTertiary }]}>INVITE</Text>
                    <View style={[styles.premiumCard, { backgroundColor: colors.surface }]}>

                      {/* Tap-to-copy invite code */}
                      <TouchableOpacity
                        style={[styles.premiumRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                        onPress={copyInviteCode}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.iconBox, { backgroundColor: codeCopied ? '#22c55e22' : colors.primaryLight }]}>
                          <Link size={18} color={codeCopied ? '#22c55e' : colors.primary} />
                        </View>
                        <View style={styles.premiumRowContent}>
                          <Text style={[styles.premiumRowTitle, { color: colors.text }]}>Invite Code</Text>
                          <Text style={[styles.premiumRowValue, {
                            color: codeCopied ? '#22c55e' : colors.primary,
                            fontFamily: Fonts.sansBold,
                            fontSize: 20,
                            letterSpacing: 5,
                            marginTop: 2,
                          }]}>{inviteCode}</Text>
                        </View>
                        <View style={[{
                          paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                          backgroundColor: codeCopied ? '#22c55e22' : colors.skeleton,
                        }]}>
                          <Text style={{ fontFamily: Fonts.sansSemiBold, fontSize: 12, color: codeCopied ? '#22c55e' : colors.textTertiary }}>
                            {codeCopied ? 'Copied!' : 'Tap to copy'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.premiumRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                        onPress={shareInvite}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.iconBox, { backgroundColor: colors.skeleton }]}>
                          <Share2 size={18} color={colors.textSecondary} />
                        </View>
                        <View style={styles.premiumRowContent}>
                          <Text style={[styles.premiumRowTitle, { color: colors.text }]}>Share Invite Link</Text>
                          <Text style={[styles.premiumRowDesc, { color: colors.textTertiary }]}>Send via WhatsApp, Messages or link</Text>
                        </View>
                        <ChevronRight size={16} color={colors.textTertiary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.premiumRow}
                        onPress={() => { setShowSettings(false); setTimeout(() => setShowInvite(true), 300); }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.iconBox, { backgroundColor: colors.skeleton }]}>
                          <QRCode value={`lahzah://circles/join/${inviteCode}`} size={18} color={colors.textSecondary} backgroundColor="transparent" />
                        </View>
                        <View style={styles.premiumRowContent}>
                          <Text style={[styles.premiumRowTitle, { color: colors.text }]}>Show QR Code</Text>
                          <Text style={[styles.premiumRowDesc, { color: colors.textTertiary }]}>Let someone scan to join</Text>
                        </View>
                        <ChevronRight size={16} color={colors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isAdmin && (
                    <View style={styles.premiumCardContainer}>
                      <Text style={[styles.premiumSectionTitle, { color: colors.textTertiary }]}>ADMIN CONTROLS</Text>
                      <View style={[styles.premiumCard, { backgroundColor: colors.surface }]}>
                        
                        <View style={[styles.premiumRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                          <View style={[styles.iconBox, { backgroundColor: colors.skeleton }]}>
                            <MessageSquare size={18} color={colors.textSecondary} />
                          </View>
                          <View style={styles.premiumRowContent}>
                            <Text style={[styles.premiumRowTitle, { color: colors.text }]}>Admin-Only Chat</Text>
                            <Text style={[styles.premiumRowDesc, { color: colors.textTertiary }]}>Only admins can post</Text>
                          </View>
                          <Switch value={postingPolicy === 'admins_only'} onValueChange={togglePolicy} trackColor={{ true: colors.primary, false: colors.border }} />
                        </View>

                        <View style={styles.premiumRow}>
                          <View style={[styles.iconBox, { backgroundColor: colors.skeleton }]}>
                            <ShieldCheck size={18} color={colors.textSecondary} />
                          </View>
                          <View style={styles.premiumRowContent}>
                            <Text style={[styles.premiumRowTitle, { color: colors.text }]}>Approve Participants</Text>
                            <Text style={[styles.premiumRowDesc, { color: colors.textTertiary }]}>Admins must approve joins</Text>
                          </View>
                          <Switch value={requireApproval} onValueChange={toggleRequireApproval} trackColor={{ true: colors.primary, false: colors.border }} />
                        </View>

                        <TouchableOpacity 
                          style={[styles.premiumRow, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}
                          onPress={() => { setShowSettings(false); setTimeout(() => setShowRoleModal(true), 300); }}
                        >
                          <View style={[styles.iconBox, { backgroundColor: colors.skeleton }]}>
                            <Users size={18} color={colors.textSecondary} />
                          </View>
                          <View style={styles.premiumRowContent}>
                            <Text style={[styles.premiumRowTitle, { color: colors.text }]}>Assign Member Titles</Text>
                            <Text style={[styles.premiumRowDesc, { color: colors.textTertiary }]}>Give custom titles (e.g. Sheikh)</Text>
                          </View>
                          <ChevronRight size={16} color={colors.textTertiary} />
                        </TouchableOpacity>

                      </View>
                    </View>
                  )}
                  
                  {isAdmin && pendingMembers.length > 0 && (
                    <View style={styles.premiumCardContainer}>
                      <Text style={[styles.premiumSectionTitle, { color: colors.primary }]}>PENDING APPROVALS ({pendingMembers.length})</Text>
                      <View style={[styles.premiumCard, { backgroundColor: colors.surface }]}>
                        {pendingMembers.map((pending, idx) => (
                          <View key={pending.id} style={[styles.premiumRow, idx !== pendingMembers.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                            <View style={[styles.memberAvatarSmall, { backgroundColor: colors.border }]}>
                              <Text style={{ fontFamily: Fonts.sansSemiBold, color: colors.textSecondary }}>{pending.name.substring(0,1)}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={[styles.memberName, { color: colors.text }]}>{pending.name}</Text>
                              <Text style={[styles.memberRole, { color: colors.textTertiary }]}>Wants to join</Text>
                            </View>
                            <View style={styles.memberActions}>
                              <TouchableOpacity onPress={() => handleApproveMember(pending.id)} style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}>
                                <Text style={[styles.actionText, { color: colors.primary }]}>Approve</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleRejectMember(pending.id)} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
                                <X size={16} color={colors.error} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={[styles.premiumCardContainer, { marginTop: 32 }]}>
                    <Text style={[styles.premiumSectionTitle, { color: colors.textTertiary }]}>PARTICIPANTS ({Object.keys(memberData).length})</Text>
                  </View>
                </View>
              }
              renderItem={({ item: [uid, data] }) => (
                <View style={[styles.premiumRow, { backgroundColor: colors.surface, marginHorizontal: 24, paddingHorizontal: 16 }]}>
                  <View style={[styles.memberAvatarSmall, { backgroundColor: colors.border }]}>
                    <Text style={{ fontFamily: Fonts.sansSemiBold, color: colors.textSecondary }}>{data.name.substring(0,1)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.memberName, { color: colors.text }]}>{data.name}</Text>
                    <Text style={[styles.memberRole, { color: data.role === 'admin' ? colors.primary : colors.textTertiary }]}>{data.role}{uid === userId ? ' (You)' : ''}</Text>
                  </View>
                  {isAdmin && uid !== userId && (
                    <View style={styles.memberActions}>
                      {data.role !== 'admin' && (
                        <TouchableOpacity onPress={() => promoteAdmin(uid)} style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}>
                          <Text style={[styles.actionText, { color: colors.primary }]}>Make Admin</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => removeMember(uid)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <UserX size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 80 }}
              ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 76, marginRight: 24 }} />}
              ListFooterComponent={<View style={{ height: 16, backgroundColor: colors.surface, marginHorizontal: 24, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }} />}
              ListHeaderComponentStyle={{ paddingHorizontal: 24 }}
            />
            {isAdmin && (
              <View style={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 }}>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert('Delete Circle', `Permanently delete "${name}"?\n\nAll messages and members will be removed. This cannot be undone.`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete Circle',
                        style: 'destructive',
                        onPress: async () => {
                          setShowSettings(false);
                          const { error } = await supabase.from('circles').delete().eq('id', id as string);
                          if (error) Alert.alert('Error', error.message);
                          else router.push('/(tabs)/messages');
                        },
                      },
                    ])
                  }
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, backgroundColor: 'rgba(204,0,0,0.08)' }}
                >
                  <Trash2 size={18} color={colors.error} />
                  <Text style={{ color: colors.error, fontSize: 15, fontFamily: Fonts.sansSemiBold }}>Delete This Circle</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </GlassBlur>
      </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  headerCenter: { flex: 1 },
  headerName: { fontFamily: Fonts.sansBold, fontSize: 17, letterSpacing: -0.3 },
  headerSub: { fontFamily: Fonts.sans, fontSize: 13, marginTop: 2 },
  listContent: { paddingHorizontal: 16, paddingVertical: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontFamily: Fonts.sansBold, fontSize: 18, marginBottom: 8, letterSpacing: -0.4 },
  emptySub: { fontFamily: Fonts.sans, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowOwn: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 0 },
  bubbleOwn: { borderBottomRightRadius: 8 },
  bubbleOther: { borderBottomLeftRadius: 8 },
  senderName: { fontFamily: Fonts.sansSemiBold, fontSize: 13, marginBottom: 4 },
  msgContent: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  msgFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 6, gap: 6 },
  msgTime: { fontFamily: Fonts.mono, fontSize: 11, letterSpacing: 0.5 },
  replyBtn: { padding: 4 },
  replyPreview: { borderLeftWidth: 3, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8 },
  replyText: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, marginLeft: 4 },
  reactionsRowOwn: { justifyContent: 'flex-end', marginLeft: 0, marginRight: 4 },
  reactionPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4, borderWidth: 0 },
  reactionCount: { fontFamily: Fonts.sansSemiBold, fontSize: 12 },
  dateSepRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  dateSepLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dateSepText: { fontFamily: Fonts.sansMedium, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2 },
  replyBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  replyBarLine: { width: 3, height: 36, borderRadius: 2 },
  replyBarLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 13, marginBottom: 2 },
  replyBarText: { fontFamily: Fonts.sans, fontSize: 14 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 10, position: 'relative' },
  composerInput: { flex: 1, borderRadius: 24, borderWidth: 0, paddingHorizontal: 16, paddingVertical: 12, fontFamily: Fonts.sans, fontSize: 15, maxHeight: 120 },
  composerLocked: { fontFamily: Fonts.sansMedium, fontSize: 15, textAlign: 'center', padding: 16, flex: 1 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  recordingPill: { height: 44, borderRadius: 22, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, flex: 1, justifyContent: 'center', gap: 8 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  recordingTime: { color: '#fff', fontFamily: Fonts.sansMedium, fontSize: 15, fontVariant: ['tabular-nums'] },
  attachMenu: { position: 'absolute', bottom: 70, left: 16, borderRadius: 16, borderWidth: 0, padding: 8, gap: 4, width: 150, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  attachBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10 },
  attachText: { fontFamily: Fonts.sansSemiBold, fontSize: 14 },
  inviteCard: { width: 300, borderRadius: 28, padding: 32, borderWidth: 0, alignItems: 'center', gap: 12 },
  inviteTitle: { fontFamily: Fonts.sansBold, fontSize: 20, letterSpacing: -0.4 },
  inviteSub: { fontFamily: Fonts.sans, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  qrContainer: { padding: 16, backgroundColor: '#fff', borderRadius: 20, marginVertical: 12 },
  codeBox: { borderWidth: 0, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 16, marginVertical: 8 },
  codeText: { fontFamily: Fonts.sansBold, fontSize: 32, letterSpacing: 8 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 100 },
  shareBtnText: { color: '#fff', fontFamily: Fonts.sansBold, fontSize: 16 },
  settingsSheet: { flex: 1, marginTop: 80, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  dragHandle: { width: 48, height: 5, backgroundColor: 'rgba(150,150,150,0.3)', borderRadius: 2.5, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  settingsTitle: { fontFamily: Fonts.sansBold, fontSize: 22, letterSpacing: -0.4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  bigAvatarContainer: { alignItems: 'center', paddingVertical: 32 },
  bigAvatar: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  bigAvatarText: { fontFamily: Fonts.sansBold, fontSize: 40 },
  bigName: { fontFamily: Fonts.sansBold, fontSize: 26, marginBottom: 6, textAlign: 'center', letterSpacing: -0.5 },
  bigDesc: { fontFamily: Fonts.sans, fontSize: 15, textAlign: 'center', paddingHorizontal: 32, lineHeight: 22 },
  
  premiumCardContainer: { marginTop: 24 },
  premiumSectionTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: 24, marginBottom: 8 },
  premiumCard: { borderRadius: 24, overflow: 'hidden', marginHorizontal: 24, borderWidth: 0 },
  premiumRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, minHeight: 64 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  premiumRowContent: { flex: 1, paddingRight: 16 },
  premiumRowTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 16, marginBottom: 2, letterSpacing: -0.3 },
  premiumRowDesc: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  premiumRowValue: { fontFamily: Fonts.sansMedium, fontSize: 14 },
  
  memberAvatarSmall: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  memberName: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  memberRole: { fontFamily: Fonts.sans, fontSize: 13, textTransform: 'capitalize', marginTop: 2 },
  memberActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100 },
  actionText: { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  catchUpBanner: { marginVertical: 20, marginHorizontal: 16, borderRadius: 24, borderWidth: 0, padding: 16 },
  catchUpBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  catchUpText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  summaryBox: { gap: 8 },
  summaryTitle: { fontFamily: Fonts.sansBold, fontSize: 16, marginBottom: 4, letterSpacing: -0.3 },
  summaryText: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
});
