import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Trash2, CloudDownload, Settings, CheckCircle2, Pause, Play, X } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Fonts } from '../../../constants/theme';
import { usePreferences, AudioPlaybackMode } from '../../../hooks/usePreferences';
import { Reciter, SWAHILI_AL_BARWANI } from '../../../data/reciters';
import { fetchRecitations } from '../../../services/quranApi';
import { SyncStatusCard } from '../../../components/profile/SyncStatusCard';

interface ReciterGroup {
  reciterId: string;
  reciterName: string;
  totalSize: number;
  surahCount: number;
  isDownloading?: boolean;
}

export default function AudioManagerScreen() {
  const { colors, isDark } = useAppTheme();
  const { audioPlaybackMode, setAudioPlaybackMode } = usePreferences();
  
  const [activeTab, setActiveTab] = useState<'Downloaded' | 'All'>('Downloaded');
  const [downloadedGroups, setDownloadedGroups] = useState<ReciterGroup[]>([]);
  const [allReciters, setAllReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingReciters, setDownloadingReciters] = useState<Record<string, number>>({}); // reciterId -> progress
  const [pausedState, setPausedState] = useState<Record<string, boolean>>({});
  const pausedRef = useRef<Record<string, boolean>>({});
  
  // Custom range modal state
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [activeReciterForRange, setActiveReciterForRange] = useState<Reciter | null>(null);
  const [customStart, setCustomStart] = useState(1);
  const [customEnd, setCustomEnd] = useState(114);

  const loadDownloaded = async () => {
    try {
      const dirUri = FileSystem.documentDirectory;
      if (!dirUri) return;
      const contents = await FileSystem.readDirectoryAsync(dirUri);
      
      const groups: Record<string, ReciterGroup> = {};

      for (const file of contents) {
        if (file.startsWith('audio_') && file.endsWith('.mp3')) {
          const match = file.match(/audio_(.+)_surah_(\d+)\.mp3/);
          if (match) {
            const reciterId = match[1];
            
            const fileUri = `${dirUri}${file}`;
            const info = await FileSystem.getInfoAsync(fileUri);
            
            if (info.exists && !info.isDirectory) {
              if (!groups[reciterId]) {
                groups[reciterId] = {
                  reciterId,
                  reciterName: reciterId, // We'll map this to real name later
                  totalSize: 0,
                  surahCount: 0,
                };
              }
              groups[reciterId].totalSize += info.size;
              groups[reciterId].surahCount += 1;
            }
          }
        }
      }
      return Object.values(groups);
    } catch (e) {
      return [];
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchRecitations();
      const apiReciters = res?.recitations || [];
      const combined = [SWAHILI_AL_BARWANI, ...apiReciters];
      setAllReciters(combined);

      const dGroups = await loadDownloaded() || [];
      
      // Map real names
      dGroups.forEach(g => {
        const found = combined.find((r: any) => r.id.toString() === g.reciterId);
        if (found) {
          g.reciterName = found.reciter_name;
        } else if (g.reciterId === 'qa.58') g.reciterName = 'Mishari with Ibrahim Walk (English)';
        else if (g.reciterId === 'qa.57') g.reciterName = 'AbdulBaset with Ibrahim Walk';
        else if (g.reciterId === 'en.walk') g.reciterName = 'Ibrahim Walk (English)';
        else if (g.reciterId === 'mq.swahili_barwani') g.reciterName = 'Mishary Alafasy & Maulana Feroz Alam';
        else if (g.reciterId === 'qa.shuraim') g.reciterName = 'Saud Al-Shuraim';
        else if (g.reciterId === 'qa.dosari') g.reciterName = 'Yasser Al-Dosari';
        else if (g.reciterId === 'qa.ghamdi') g.reciterName = 'Saad al Ghamdi';
      });

      setDownloadedGroups(dGroups);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const openDownloadOptions = (item: Reciter) => {
    Alert.alert(
      'Download Options',
      'Choose how you want to download audio for ' + (item.reciter_name || 'this reciter'),
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Custom Range', 
          onPress: () => {
            setCustomStart(1);
            setCustomEnd(114);
            setActiveReciterForRange(item);
            setShowRangeModal(true);
          }
        },
        { 
          text: 'Download All (114 Surahs)', 
          onPress: () => handleDownloadAll(item, 1, 114) 
        }
      ]
    );
  };

  const handlePauseResume = (rId: string) => {
    if (pausedRef.current[rId]) {
      // Resume
      pausedRef.current[rId] = false;
      setPausedState(prev => ({ ...prev, [rId]: false }));
      const reciterItem = allReciters.find(r => r.id.toString() === rId);
      if (reciterItem) {
        handleDownloadAll(reciterItem, 1, 114); // will skip already downloaded
      }
    } else {
      // Pause
      pausedRef.current[rId] = true;
      setPausedState(prev => ({ ...prev, [rId]: true }));
    }
  };

  const handleDownloadAll = async (reciterItem: Reciter, start: number = 1, end: number = 114) => {
    const rId = reciterItem.id.toString();
    if (downloadingReciters[rId] && !pausedRef.current[rId]) return;

    pausedRef.current[rId] = false;
    setPausedState(prev => ({ ...prev, [rId]: false }));
    setDownloadingReciters(prev => ({ ...prev, [rId]: prev[rId] || 0 }));

    try {
      const isQuranicAudio = rId.startsWith('qa.') || rId.startsWith('mq.') || rId.startsWith('en.');
      
      if (isQuranicAudio && reciterItem.quranicAudioPath) {
        const total = end - start + 1;
        let count = 0;
        for (let i = start; i <= end; i++) {
          if (pausedRef.current[rId]) break;

          const paddedSurah = String(i).padStart(3, '0');
          const url = `https://download.quranicaudio.com/quran/${reciterItem.quranicAudioPath}/${paddedSurah}.mp3`;
          const localUri = `${FileSystem.documentDirectory}audio_${rId}_surah_${i}.mp3`;
          const info = await FileSystem.getInfoAsync(localUri);
          if (!info.exists) {
            await FileSystem.downloadAsync(url, localUri);
          }
          count++;
          setDownloadingReciters(prev => ({ ...prev, [rId]: count / total }));
        }
      } else {
        const numericId = rId.replace('qa.', '');
        const res = await fetch(`https://api.quran.com/api/v4/chapter_recitations/${numericId}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();

        if (data.audio_files && data.audio_files.length > 0) {
          // Filter to the selected range
          const targetFiles = data.audio_files.filter((f: any) => f.chapter_id >= start && f.chapter_id <= end);
          const total = targetFiles.length;
          let downloadedCount = 0;

          for (const file of targetFiles) {
            if (pausedRef.current[rId]) break;

            const surahNumber = file.chapter_id;
            const url = file.audio_url;
            const localUri = `${FileSystem.documentDirectory}audio_${rId}_surah_${surahNumber}.mp3`;
            const info = await FileSystem.getInfoAsync(localUri);
            if (!info.exists) {
              await FileSystem.downloadAsync(url, localUri);
            }
            downloadedCount++;
            setDownloadingReciters(prev => ({ ...prev, [rId]: downloadedCount / total }));
          }
        } else {
          throw new Error('No audio files returned from API');
        }
      }
    } catch (e) {
      Alert.alert('Download Failed', `Could not complete the download: ${e}`);
    } finally {
      if (!pausedRef.current[rId]) {
        // Only clear if we actually finished naturally (not paused)
        setDownloadingReciters(prev => {
          const next = { ...prev };
          delete next[rId];
          return next;
        });
      }
      loadData();
    }
  };

  const handleDeleteGroup = (reciterId: string) => {
    Alert.alert(
      'Delete Downloads',
      'Are you sure you want to delete all downloaded audio for this reciter?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const dirUri = FileSystem.documentDirectory;
            if (!dirUri) return;
            const contents = await FileSystem.readDirectoryAsync(dirUri);
            for (const file of contents) {
              if (file.startsWith(`audio_${reciterId}_surah_`)) {
                await FileSystem.deleteAsync(`${dirUri}${file}`, { idempotent: true });
              }
            }
            loadData();
          }
        }
      ]
    );
  };

  const renderDownloadedGroup = ({ item }: { item: ReciterGroup }) => {
    return (
      <View style={[styles.fileCard, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <View style={styles.fileInfo}>
          <Text style={[styles.surahTitle, { color: colors.text }]}>{item.reciterName}</Text>
          <Text style={[styles.reciterSub, { color: colors.textTertiary }]}>
            {formatSize(item.totalSize)} - {item.surahCount} surahs downloaded
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteGroup(item.reciterId)}>
          <Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAllReciter = ({ item }: { item: Reciter }) => {
    const rId = item.id.toString();
    const isDownloading = typeof downloadingReciters[rId] !== 'undefined';
    const downloadedGroup = downloadedGroups.find(g => g.reciterId === rId);
    const isFullyDownloaded = downloadedGroup?.surahCount === 114;

    return (
      <View style={[styles.fileCard, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <View style={styles.fileInfo}>
          <Text style={[styles.surahTitle, { color: colors.text }]}>{item.reciter_name}</Text>
          {item.style && <Text style={[styles.reciterSub, { color: colors.textTertiary }]}>{item.style}</Text>}
          {isDownloading && (
            <Text style={[styles.reciterSub, { color: pausedState[rId] ? colors.textTertiary : colors.primary, marginTop: 4 }]}>
              {pausedState[rId] ? 'Paused' : 'Downloading...'} {Math.round(downloadingReciters[rId] * 100)}%
            </Text>
          )}
        </View>
        
        {isFullyDownloaded ? (
          <View style={styles.iconBtn}>
            <CheckCircle2 size={22} color={colors.primary} />
          </View>
        ) : isDownloading ? (
          <TouchableOpacity style={styles.iconBtn} onPress={() => handlePauseResume(rId)}>
            {pausedState[rId] ? (
              <Play size={22} color={colors.primary} />
            ) : (
              <Pause size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.iconBtn} onPress={() => openDownloadOptions(item)}>
            <CloudDownload size={22} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : '#f9f9f9' }]}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Audio Manager</Text>
        </View>
      </View>

      <View style={[styles.settingsRow, { backgroundColor: isDark ? '#262626' : '#fff', padding: 16, marginHorizontal: 16, borderRadius: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View style={{ flex: 1, paddingRight: 16 }}>
          <Text style={[styles.settingsLabel, { color: colors.text, marginBottom: 4 }]}>Stream Audio</Text>
          <Text style={{ color: colors.textTertiary, fontFamily: Fonts.sans, fontSize: 13 }}>
            Saves disk space by streaming audio, but requires an internet connection.
          </Text>
        </View>
        <Switch
          value={audioPlaybackMode === 'auto'}
          onValueChange={(val) => setAudioPlaybackMode(val ? 'auto' : 'offline')}
          trackColor={{ false: '#767577', true: colors.primary }}
          thumbColor={audioPlaybackMode === 'auto' ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <SyncStatusCard />
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity onPress={() => setActiveTab('Downloaded')} style={[styles.tabBtn, activeTab === 'Downloaded' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
          <Text style={[styles.tabText, { color: activeTab === 'Downloaded' ? colors.primary : colors.textTertiary }]}>Downloaded</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('All')} style={[styles.tabBtn, activeTab === 'All' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
          <Text style={[styles.tabText, { color: activeTab === 'All' ? colors.primary : colors.textTertiary }]}>All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === 'Downloaded' ? (
        <FlatList
          data={downloadedGroups}
          keyExtractor={item => item.reciterId}
          contentContainerStyle={styles.listContent}
          renderItem={renderDownloadedGroup}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No downloaded audio found.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={allReciters}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={renderAllReciter}
        />
      )}

      <Modal visible={showRangeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Custom Range</Text>
              <TouchableOpacity onPress={() => setShowRangeModal(false)}>
                <X size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalSub, { color: colors.textTertiary }]}>
              Enter the Surah numbers you want to download (1-114).
            </Text>
            
            <View style={styles.rangeInputs}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Start Surah</Text>
                <View style={[styles.inputWrapper, { borderColor: isDark ? '#333' : '#e5e5e5' }]}>
                  <Text style={[styles.inputText, { color: colors.text }]}>{customStart}</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity onPress={() => setCustomStart(s => Math.max(1, s - 1))} style={styles.stepBtn}><Text style={[styles.stepText, { color: colors.text }]}>-</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setCustomStart(s => Math.min(114, s + 1))} style={styles.stepBtn}><Text style={[styles.stepText, { color: colors.text }]}>+</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>End Surah</Text>
                <View style={[styles.inputWrapper, { borderColor: isDark ? '#333' : '#e5e5e5' }]}>
                  <Text style={[styles.inputText, { color: colors.text }]}>{customEnd}</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity onPress={() => setCustomEnd(s => Math.max(1, s - 1))} style={styles.stepBtn}><Text style={[styles.stepText, { color: colors.text }]}>-</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setCustomEnd(s => Math.min(114, s + 1))} style={styles.stepBtn}><Text style={[styles.stepText, { color: colors.text }]}>+</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.startBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowRangeModal(false);
                if (activeReciterForRange) {
                  // Ensure start is <= end
                  const s = Math.min(customStart, customEnd);
                  const e = Math.max(customStart, customEnd);
                  handleDownloadAll(activeReciterForRange, s, e);
                }
              }}
            >
              <Text style={styles.startBtnText}>Start Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4, marginRight: 8 },
  headerTitle: { fontFamily: Fonts.display, fontSize: 22 },
  settingsRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingsLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 15, marginBottom: 12 },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segmentText: { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  tabBtn: {
    marginRight: 24,
    paddingVertical: 12,
  },
  tabText: { fontFamily: Fonts.sansBold, fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  fileInfo: { flex: 1 },
  surahTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  reciterSub: { fontFamily: Fonts.sans, fontSize: 13, marginTop: 4 },
  iconBtn: { padding: 8, marginRight: -8 },
  emptyState: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontFamily: Fonts.sans, fontSize: 15 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontFamily: Fonts.sansBold, fontSize: 20 },
  modalSub: { fontFamily: Fonts.sans, fontSize: 14, marginBottom: 24, lineHeight: 20 },
  rangeInputs: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  inputGroup: { flex: 1 },
  inputLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 13, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  inputText: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  stepper: { flexDirection: 'row', gap: 4 },
  stepBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(150,150,150,0.1)', justifyContent: 'center', alignItems: 'center' },
  stepText: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  startBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  startBtnText: { color: '#fff', fontFamily: Fonts.sansBold, fontSize: 16 },
});
