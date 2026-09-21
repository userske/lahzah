import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Animated,
  Switch,
} from 'react-native';
import { Check, ChevronRight, Play, ChevronUp, ChevronDown, CloudDownload, CheckCircle2, Headphones, Radio, Download } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { usePreferences } from '../../hooks/usePreferences';
import { useAudioDownload } from '../../hooks/useAudioDownload';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Fonts } from '../../constants/theme';
import { Reciter } from '../../data/reciters';
import { JUZ_DATA } from '../../data/juzs';

const { width } = Dimensions.get('window');

// --- Helper Data ---
const ARABIC_NAMES: Record<number, string> = {
  1: 'الفَاتِحَة', 2: 'البَقَرَة', 3: 'آل عِمْرَان', 4: 'النِّسَاء',
  5: 'المَائِدَة', 6: 'الأَنْعَام', 7: 'الأَعْرَاف', 8: 'الأَنفَال',
  9: 'التَّوبَة', 10: 'يُونُس', 11: 'هُود', 12: 'يُوسُف',
  13: 'الرَّعْد', 14: 'إِبْرَاهِيم', 15: 'الحِجْر', 16: 'النَّحْل',
  17: 'الإِسْرَاء', 18: 'الكَهْف', 19: 'مَرْيَم', 20: 'طه',
  21: 'الأَنبِيَاء', 22: 'الحَجّ', 23: 'المُؤمِنُون', 24: 'النُّور',
  25: 'الفُرْقَان', 26: 'الشُّعَرَاء', 27: 'النَّمْل', 28: 'القَصَص',
  29: 'العَنكَبُوت', 30: 'الرُّوم', 31: 'لُقمَان', 32: 'السَّجدَة',
  33: 'الأَحزَاب', 34: 'سَبَأ', 35: 'فَاطِر', 36: 'يس',
  37: 'الصَّافَّات', 38: 'ص', 39: 'الزُّمَر', 40: 'غَافِر',
  41: 'فُصِّلَت', 42: 'الشُّورَى', 43: 'الزُّخرُف', 44: 'الدُّخَان',
  45: 'الجَاثِيَة', 46: 'الأَحقَاف', 47: 'مُحَمَّد', 48: 'الفَتح',
  49: 'الحُجُرَات', 50: 'ق', 51: 'الذَّارِيَات', 52: 'الطُّور',
  53: 'النَّجم', 54: 'القَمَر', 55: 'الرَّحمَن', 56: 'الوَاقِعَة',
  57: 'الحَدِيد', 58: 'المُجَادِلَة', 59: 'الحَشر', 60: 'المُمتَحِنَة',
  61: 'الصَّف', 62: 'الجُمُعَة', 63: 'المُنَافِقُون', 64: 'التَّغَابُن',
  65: 'الطَّلَاق', 66: 'التَّحرِيم', 67: 'المُلك', 68: 'القَلَم',
  69: 'الحَاقَّة', 70: 'المَعَارِج', 71: 'نُوح', 72: 'الجِنّ',
  73: 'المُزَّمِّل', 74: 'المُدَّثِّر', 75: 'القِيَامَة', 76: 'الإِنسَان',
  77: 'المُرسَلَات', 78: 'النَّبَأ', 79: 'النَّازِعَات', 80: 'عَبَس',
  81: 'التَّكوِير', 82: 'الانفِطَار', 83: 'المُطَفِّفِين', 84: 'الانشِقَاق',
  85: 'البُرُوج', 86: 'الطَّارِق', 87: 'الأَعلى', 88: 'الغَاشِيَة',
  89: 'الفَجر', 90: 'البَلَد', 91: 'الشَّمس', 92: 'اللَّيل',
  93: 'الضُّحَى', 94: 'الشَّرح', 95: 'التِّين', 96: 'العَلَق',
  97: 'القَدر', 98: 'البَيِّنَة', 99: 'الزَّلزَلَة', 100: 'العَادِيَات',
  101: 'القَارِعَة', 102: 'التَّكَاثُر', 103: 'العَصر', 104: 'الهُمَزَة',
  105: 'الفِيل', 106: 'قُرَيش', 107: 'المَاعُون', 108: 'الكَوثَر',
  109: 'الكَافِرُون', 110: 'النَّصر', 111: 'المَسَد', 112: 'الإِخلَاص',
  113: 'الفَلَق', 114: 'النَّاس',
};

// --- Custom Wheel Picker ---
const ITEM_HEIGHT = 44;

interface WheelPickerProps {
  data: any[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  renderItem: (item: any, isSelected: boolean, index: number) => React.ReactNode;
}

const WheelPicker = ({ data, selectedIndex, onIndexChange, renderItem }: WheelPickerProps) => {
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Pad the list so the first and last items can reach the center
  const paddedData = [null, null, ...data, null, null];

  useEffect(() => {
    // Scroll to initial index on mount
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    }, 100);
  }, []);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (index !== selectedIndex && index >= 0 && index < data.length) {
      onIndexChange(index);
    }
  };

  return (
    <View style={{ height: ITEM_HEIGHT * 5, overflow: 'hidden' }}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {paddedData.map((item, i) => {
          const actualIndex = i - 2;
          const isSelected = actualIndex === selectedIndex;
          return (
            <View key={i} style={{ height: ITEM_HEIGHT, justifyContent: 'center' }}>
              {item !== null ? renderItem(item, isSelected, actualIndex) : null}
            </View>
          );
        })}
      </ScrollView>
      {/* Center Highlight overlay */}
      <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', justifyContent: 'center' }]}>
        <View style={{ height: ITEM_HEIGHT, backgroundColor: 'rgba(150,150,150,0.1)', borderRadius: 8, marginHorizontal: 8 }} />
      </View>
    </View>
  );
};

// --- Main Modal Component ---
interface AudioSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onPlay: () => void;
  chapters: any[];
  reciters: Reciter[];
  selectedReciter: Reciter;
  setSelectedReciter: (r: Reciter) => void;
  startSurah: number;
  setStartSurah: (v: number) => void;
  startAyah: number;
  setStartAyah: (v: number) => void;
  endSurah: number;
  setEndSurah: (v: number) => void;
  endAyah: number;
  setEndAyah: (v: number) => void;
}

export const AudioSettingsModal = ({
  visible,
  onClose,
  onPlay,
  chapters,
  reciters,
  selectedReciter,
  setSelectedReciter,
  startSurah,
  setStartSurah,
  startAyah,
  setStartAyah,
  endSurah,
  setEndSurah,
  endAyah,
  setEndAyah
}: AudioSettingsModalProps) => {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const { audioPlaybackMode, setAudioPlaybackMode } = usePreferences();
  
  // Local UI state
  const [activeView, setActiveView] = useState<'main' | 'reciters' | 'range'>('main');
  const [expandedSection, setExpandedSection] = useState<'from' | 'to' | null>(null);
  const [endAtMode, setEndAtMode] = useState<'Custom' | 'Surah' | "Juz'" | 'Quran'>('Custom');

  const { downloadState, downloadSurah, removeDownload } = useAudioDownload(startSurah, selectedReciter);

  const textPrimary = isDark ? '#fff' : '#000';
  const textSecondary = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  
  const cardColor = isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.6)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  // Helper to format display
  const getSurahName = (id: number) => {
    const ch = chapters.find(c => c.id === id);
    return ch ? `${ch.name_simple} ${ARABIC_NAMES[id] || ''}` : `Surah ${id}`;
  };

  // When "End at" changes, calculate the new "To" values
  const handleEndAtChange = (mode: string) => {
    setEndAtMode(mode as any);
    if (mode === 'Custom') return;

    if (mode === 'Surah') {
      const ch = chapters.find(c => c.id === startSurah);
      if (ch) {
        setEndSurah(startSurah);
        setEndAyah(ch.verses_count);
      }
    } else if (mode === "Juz'") {
      let currentJuzIndex = 0;
      for (let i = 0; i < JUZ_DATA.length; i++) {
        const juz = JUZ_DATA[i];
        if (startSurah > juz.startingSurah || (startSurah === juz.startingSurah && startAyah >= juz.startingAyah)) {
          currentJuzIndex = i;
        } else {
          break;
        }
      }
      
      const nextJuz = JUZ_DATA[currentJuzIndex + 1];
      if (nextJuz) {
        if (nextJuz.startingAyah === 1) {
          // If next juz starts at ayah 1, this juz ends at the previous surah's last ayah
          const prevSurahId = nextJuz.startingSurah - 1;
          const prevSurah = chapters.find(c => c.id === prevSurahId);
          setEndSurah(prevSurahId);
          setEndAyah(prevSurah ? prevSurah.verses_count : 1);
        } else {
          // Ends at the same surah, previous ayah
          setEndSurah(nextJuz.startingSurah);
          setEndAyah(nextJuz.startingAyah - 1);
        }
      } else {
        // Juz 30 ends at the end of the Quran
        setEndSurah(114);
        setEndAyah(6);
      }
    } else if (mode === 'Quran') {
      setEndSurah(114);
      setEndAyah(6);
    }
  };

  const renderHeader = () => {
    const title = activeView === 'reciters' ? 'Choose Reciter' : activeView === 'range' ? 'Playback Range' : 'Audio Settings';
    return (
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.cancelBtn}
          onPress={() => {
            if (activeView === 'reciters' || activeView === 'range') setActiveView('main');
            else onClose();
          }}
        >
          <Text style={[styles.cancelText, { color: colors.primary }]}>
            {activeView !== 'main' ? '‹ Back' : 'Cancel'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: textPrimary }]} numberOfLines={1}>
          {title}
        </Text>

        {activeView === 'main' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {selectedReciter.isChapterOnly && (
              <TouchableOpacity 
                style={[styles.playBtn, { backgroundColor: isDark ? '#333' : '#e8e8e8', width: 44 }]} 
                onPress={() => {
                  if (downloadState.isDownloaded) {
                    removeDownload();
                  } else if (!downloadState.isDownloading) {
                    const paddedSurah = String(startSurah).padStart(3, '0');
                    const url = `https://download.quranicaudio.com/quran/${selectedReciter.quranicAudioPath}/${paddedSurah}.mp3`;
                    if (selectedReciter.quranicAudioPath) downloadSurah(url);
                  }
                }}
              >
                {downloadState.isDownloading ? (
                  <ActivityIndicator size="small" color={textPrimary} />
                ) : downloadState.isDownloaded ? (
                  <CheckCircle2 size={20} color={colors.primary} />
                ) : (
                  <CloudDownload size={20} color={textPrimary} />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.playBtn, { backgroundColor: colors.primary }]} 
              onPress={() => { onClose(); onPlay(); }}
            >
              <Play size={18} color="#fff" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        ) : (
          // Spacer so title stays centered
          <View style={{ width: 70 }} />
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.bottomSheetContainer]}>
          <BlurView intensity={isDark ? 50 : 80} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />
        {renderHeader()}

        {activeView === 'reciters' ? (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View style={[styles.card, { backgroundColor: cardColor }]}>
              {reciters.map((r, i) => (
                <TouchableOpacity 
                  key={r.id} 
                  style={[
                    styles.row, 
                    i < reciters.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }
                  ]}
                  onPress={() => {
                    setSelectedReciter(r);
                    setActiveView('main');
                  }}
                >
                  <View>
                    <Text style={[styles.rowTitle, { color: textPrimary }]}>{r.reciter_name}</Text>
                    {r.style && <Text style={[styles.rowSubtitle, { color: textSecondary }]}>{r.style}</Text>}
                  </View>
                  {r.id === selectedReciter.id && <Check size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : activeView === 'range' ? (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={[styles.sectionTitle, { color: textSecondary }]}>Playback ayah range</Text>
            
            <View style={[styles.card, { backgroundColor: cardColor }]}>
              {/* FROM ROW */}
              <TouchableOpacity 
                style={[styles.rangeRow, { borderBottomWidth: 1, borderBottomColor: borderColor }]}
                onPress={() => setExpandedSection(expandedSection === 'from' ? null : 'from')}
              >
                <Text style={[styles.rowTitle, { color: textPrimary }]}>From</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.rangeValue, { color: colors.primary }]}>
                    {getSurahName(startSurah)} {selectedReciter.isChapterOnly ? '' : `· ${startSurah}:${startAyah}`}
                  </Text>
                  {expandedSection === 'from' ? <ChevronUp size={18} color={textSecondary} /> : <ChevronDown size={18} color={textSecondary} />}
                </View>
              </TouchableOpacity>

              {expandedSection === 'from' && (
                <View style={styles.pickerContainer}>
                  <View style={{ flex: 1 }}>
                    <WheelPicker 
                      data={chapters} 
                      selectedIndex={startSurah - 1} 
                      onIndexChange={(i) => {
                        setStartSurah(i + 1);
                        setStartAyah(1); // Reset ayah when surah changes
                        setEndAtMode('Custom');
                      }}
                      renderItem={(item, isSel) => (
                        <Text style={[styles.pickerItem, { color: isSel ? textPrimary : textSecondary }, isSel && { fontFamily: Fonts.monoMedium }]} numberOfLines={1}>
                          {item.id} · {item.name_simple} {ARABIC_NAMES[item.id] || ''}
                        </Text>
                      )}
                    />
                  </View>
                  {!selectedReciter.isChapterOnly && (
                    <>
                      <View style={[styles.pickerDivider, { backgroundColor: borderColor }]} />
                      <View style={{ flex: 1 }}>
                        <WheelPicker 
                          data={Array.from({ length: chapters.find(c => c.id === startSurah)?.verses_count || 0 }, (_, k) => k + 1)} 
                          selectedIndex={startAyah - 1} 
                          onIndexChange={(i) => {
                            setStartAyah(i + 1);
                            setEndAtMode('Custom');
                          }}
                          renderItem={(_, isSel, i) => (
                            <Text style={[styles.pickerItem, { color: isSel ? textPrimary : textSecondary, textAlign: 'center' }, isSel && { fontFamily: Fonts.monoMedium }]}>
                              Ayah {i + 1}
                            </Text>
                          )}
                        />
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* TO ROW */}
              <TouchableOpacity 
                style={[styles.rangeRow, { borderBottomWidth: 1, borderBottomColor: borderColor }]}
                onPress={() => setExpandedSection(expandedSection === 'to' ? null : 'to')}
              >
                <Text style={[styles.rowTitle, { color: textPrimary }]}>To</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.rangeValue, { color: colors.primary }]}>
                    {getSurahName(endSurah)} {selectedReciter.isChapterOnly ? '' : `· ${endSurah}:${endAyah}`}
                  </Text>
                  {expandedSection === 'to' ? <ChevronUp size={18} color={textSecondary} /> : <ChevronDown size={18} color={textSecondary} />}
                </View>
              </TouchableOpacity>

              {expandedSection === 'to' && (
                <View style={styles.pickerContainer}>
                  <View style={{ flex: 1 }}>
                    <WheelPicker 
                      data={chapters} 
                      selectedIndex={endSurah - 1} 
                      onIndexChange={(i) => {
                        setEndSurah(i + 1);
                        setEndAyah(1);
                        setEndAtMode('Custom');
                      }}
                      renderItem={(item, isSel) => (
                        <Text style={[styles.pickerItem, { color: isSel ? textPrimary : textSecondary }, isSel && { fontFamily: Fonts.monoMedium }]} numberOfLines={1}>
                          {item.id} · {item.name_simple} {ARABIC_NAMES[item.id] || ''}
                        </Text>
                      )}
                    />
                  </View>
                  {!selectedReciter.isChapterOnly && (
                    <>
                      <View style={[styles.pickerDivider, { backgroundColor: borderColor }]} />
                      <View style={{ flex: 1 }}>
                        <WheelPicker 
                          data={Array.from({ length: chapters.find(c => c.id === endSurah)?.verses_count || 0 }, (_, k) => k + 1)} 
                          selectedIndex={endAyah - 1} 
                          onIndexChange={(i) => {
                            setEndAyah(i + 1);
                            setEndAtMode('Custom');
                          }}
                          renderItem={(_, isSel, i) => (
                            <Text style={[styles.pickerItem, { color: isSel ? textPrimary : textSecondary, textAlign: 'center' }, isSel && { fontFamily: Fonts.monoMedium }]}>
                              Ayah {i + 1}
                            </Text>
                          )}
                        />
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* END AT SEGMENTED CONTROL */}
              <View style={styles.endAtContainer}>
                <Text style={[styles.endAtLabel, { color: textSecondary }]}>End at</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                  {['Custom', 'Surah', "Juz'", 'Quran'].map((mode) => {
                    const isActive = endAtMode === mode;
                    return (
                      <TouchableOpacity
                        key={mode}
                        style={[styles.segmentBtn, isActive && { backgroundColor: isDark ? '#333' : '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }]}
                        onPress={() => handleEndAtChange(mode)}
                      >
                        <Text style={[styles.segmentText, { color: isActive ? textPrimary : textSecondary, fontFamily: isActive ? Fonts.monoMedium : Fonts.mono }]}>
                          {mode}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

            </View>
            
            {selectedReciter.isChapterOnly && (
              <Text style={{ color: textSecondary, marginTop: 16, fontFamily: Fonts.mono, fontSize: 12, textAlign: 'center' }}>
                Ayah range selection is disabled for {selectedReciter.reciter_name} as their audio is provided as full chapters only.
              </Text>
            )}

          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Reciter Picker - Kept separate as requested */}
            <TouchableOpacity 
              style={[styles.card, styles.menuRow, { backgroundColor: cardColor, marginBottom: 24 }]}
              onPress={() => setActiveView('reciters')}
            >
              <View style={styles.menuRowLeft}>
                <View style={[styles.iconWrapper, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}>
                  <Play size={20} color={textPrimary} />
                </View>
                <Text style={[styles.rowTitle, { color: textPrimary, marginLeft: 12 }]}>Reciter</Text>
              </View>
              <View style={styles.menuRowRight}>
                <Text style={[styles.menuValue, { color: textSecondary }]} numberOfLines={1}>
                  {selectedReciter.reciter_name}
                </Text>
                <ChevronRight size={20} color={textSecondary} />
              </View>
            </TouchableOpacity>

            <View style={[styles.card, { backgroundColor: cardColor }]}>
              {/* Download/Play up to */}
              <TouchableOpacity 
                style={[styles.menuRow, { borderBottomWidth: 1, borderBottomColor: borderColor }]}
                onPress={() => setActiveView('range')}
              >
                <View style={styles.menuRowLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}>
                    <Headphones size={20} color={textPrimary} />
                  </View>
                  <Text style={[styles.rowTitle, { color: textPrimary, marginLeft: 12 }]}>Download/Play up to</Text>
                </View>
                <View style={styles.menuRowRight}>
                  <Text style={[styles.menuValue, { color: textSecondary }]}>
                    {endAtMode}
                  </Text>
                  <ChevronRight size={20} color={textSecondary} />
                </View>
              </TouchableOpacity>

              {/* Stream Audio */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: borderColor }}>
                <View style={[styles.iconWrapper, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}>
                  <Radio size={20} color={textPrimary} />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: textPrimary }]}>Stream Audio</Text>
                  <Text style={[styles.menuSubtitle, { color: textSecondary, marginTop: 3 }]}>
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

              {/* Audio Manager */}
              <TouchableOpacity 
                style={styles.menuRow}
                onPress={() => {
                  onClose();
                  router.push('/profile/audio-manager');
                }}
              >
                <View style={styles.menuRowLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}>
                    <Download size={20} color={textPrimary} />
                  </View>
                  <Text style={[styles.rowTitle, { color: textPrimary, marginLeft: 12 }]}>Audio Manager</Text>
                </View>
                <ChevronRight size={20} color={textSecondary} />
              </TouchableOpacity>

            </View>
          </ScrollView>
        )}
      </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  bottomSheetContainer: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', maxHeight: '70%', flex: 1 },
  
  modalContent: { paddingBottom: 30, flex: 1 },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.3)', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 16 
  },
  cancelBtn: { 
    paddingHorizontal: 4,
    paddingVertical: 8,
    minWidth: 70,
  },
  cancelText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 13,
  },
  headerTitle: {
    fontFamily: Fonts.monoMedium,
    fontSize: 13,
    flex: 1,
    textAlign: 'center',
  },
  playBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuValue: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    marginRight: 8,
  },
  menuSubtitle: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    lineHeight: 18,
  },
  card: { 
    borderRadius: 24, 
    overflow: 'hidden', 
    padding: 4 
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16 
  },
  rowTitle: { fontFamily: Fonts.mono, fontSize: 13 },
  rowSubtitle: { fontFamily: Fonts.mono, fontSize: 11, marginTop: 2 },
  sectionTitle: { fontFamily: Fonts.monoMedium, fontSize: 12, marginBottom: 12, marginLeft: 8 },
  rangeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16 
  },
  rangeValue: { fontFamily: Fonts.mono, fontSize: 13 },
  pickerContainer: { 
    flexDirection: 'row', 
    height: ITEM_HEIGHT * 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)'
  },
  pickerDivider: { width: 1, marginVertical: 20 },
  pickerItem: { fontFamily: Fonts.mono, fontSize: 12, paddingHorizontal: 16 },
  endAtContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 16,
  },
  endAtLabel: { fontFamily: Fonts.mono, fontSize: 11, marginLeft: 4 },
  segmentBtn: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 16 
  },
  segmentText: { fontSize: 13 }
});
