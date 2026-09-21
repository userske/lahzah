import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar, ChevronLeft, ChevronRight, X, BookOpen, CheckCircle, Flame } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Fonts } from '../../constants/theme';
import { useStreak } from '../../hooks/useStreak';
import { GlassCard } from '../ui/GlassCard';
import hijriConverter from 'hijri-converter';

// English surah names map (short)
const ENGLISH_NAMES: Record<number, string> = {
  1: 'Al-Fatihah', 2: 'Al-Baqarah', 3: "Ali 'Imran", 4: "An-Nisa'",
  5: "Al-Ma'idah", 6: "Al-An'am", 7: "Al-A'raf", 8: 'Al-Anfal',
  9: 'At-Tawbah', 10: 'Yunus', 11: 'Hud', 12: 'Yusuf',
  13: "Ar-Ra'd", 14: 'Ibrahim', 15: 'Al-Hijr', 16: 'An-Nahl',
  17: 'Al-Isra', 18: 'Al-Kahf', 19: 'Maryam', 20: 'Ta-Ha',
  21: "Al-Anbiya'", 22: 'Al-Hajj', 23: "Al-Mu'minun", 24: 'An-Nur',
  25: 'Al-Furqan', 26: "Ash-Shu'ara", 27: 'An-Naml', 28: 'Al-Qasas',
  29: 'Al-Ankabut', 30: 'Ar-Rum', 31: 'Luqman', 32: 'As-Sajdah',
  33: 'Al-Ahzab', 34: "Saba'", 35: 'Fatir', 36: 'Ya-Sin',
  67: 'Al-Mulk', 78: "An-Naba'", 112: 'Al-Ikhlas', 113: 'Al-Falaq', 114: 'An-Nas',
};

// Calendar Helpers
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Make Monday = 0, Sunday = 6
};

// Returns an array of 7 dates for the week containing `targetDate` (Monday to Sunday)
const getWeekDays = (targetDate: Date) => {
  const currentDay = targetDate.getDay();
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() + distanceToMonday);

  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const StreakCard = () => {
  const { colors, isDark } = useAppTheme();
  const { streakCount, detailedHistory, loading } = useStreak();

  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [dateType, setDateType] = useState<'gregorian' | 'hijri'>('gregorian');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const { width } = Dimensions.get('window');
  // Card: 16px marginHorizontal (x2=32) + 24px padding (x2=48) = 80px total
  const CELL_WIDTH = Math.floor((width - 80) / 7);

  // Navigation
  const goBack = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    }
  };
  
  const goForward = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
    }
  };

  // Generate grid cells
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const cells = [];

    if (viewMode === 'month') {
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);

      // Empty padding for days before the 1st
      for (let i = 0; i < firstDay; i++) {
        cells.push({ empty: true, key: `empty-${i}` });
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const fullDisplay = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'long' });
        
        const hj = hijriConverter.toHijri(year, month + 1, d);
        
        cells.push({
          empty: false,
          key: dateStr,
          dayNumber: dateType === 'hijri' ? hj.hd : d,
          dateStr,
          fullDisplay,
        });
      }
    } else {
      // Week View
      const weekDates = getWeekDays(currentDate);
      for (let i = 0; i < weekDates.length; i++) {
        const d = weekDates[i];
        const y = d.getFullYear();
        const m = d.getMonth();
        const dt = d.getDate();
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dt).padStart(2, '0')}`;
        const fullDisplay = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'long' });
        
        const hj = hijriConverter.toHijri(y, m + 1, dt);
        
        cells.push({
          empty: false,
          key: dateStr,
          dayNumber: dateType === 'hijri' ? hj.hd : dt,
          dateStr,
          fullDisplay,
        });
      }
    }

    return cells;
  }, [currentDate, viewMode, dateType]);

  if (loading) {
    return (
      <GlassCard style={styles.card} radius={24}>
        <Text style={{color: colors.textSecondary, padding: 24}}>Loading...</Text>
      </GlassCard>
    );
  }

  // Calculate total ayahs for the currently viewed period
  let totalAyahsInView = 0;
  if (viewMode === 'month') {
    const currentMonthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    Object.keys(detailedHistory).forEach(date => {
      if (date.startsWith(currentMonthPrefix)) {
        detailedHistory[date].forEach(h => {
          totalAyahsInView += h.ayahs_count;
        });
      }
    });
  } else {
    // Week view sum
    calendarGrid.forEach(cell => {
      if (!cell.empty && cell.dateStr && detailedHistory[cell.dateStr]) {
        detailedHistory[cell.dateStr].forEach(h => {
          totalAyahsInView += h.ayahs_count;
        });
      }
    });
  }

  const selectedDetails = selectedDateStr ? (detailedHistory[selectedDateStr] || []) : [];
  const selectedTotalAyahs = selectedDetails.reduce((sum, item) => sum + item.ayahs_count, 0);
  
  // Need to find fullDisplay for selected date
  // (In case the selected date is from a different view, we might not find it, so fallback to formatting it)
  const selectedCell = calendarGrid.find(c => c.key === selectedDateStr);
  let selectedFullDisplay = selectedCell && !selectedCell.empty ? selectedCell.fullDisplay : '';
  if (!selectedFullDisplay && selectedDateStr) {
    const d = new Date(selectedDateStr);
    selectedFullDisplay = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'long' });
  }

  return (
    <>
      <GlassCard style={styles.card} radius={24}>

        {/* ── Top Header ── */}
        <View style={styles.streakHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quran Reading Streak</Text>
          <TouchableOpacity 
            onPress={() => setDateType(prev => prev === 'gregorian' ? 'hijri' : 'gregorian')}
            style={[styles.hijriToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
          >
            <Calendar size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.hijriToggleText, { color: colors.textSecondary }]}>
              {dateType === 'gregorian' ? 'Gregorian' : 'Hijri'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Segment toggle ── */}
        <View style={[styles.segmentControl, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
          {(['week', 'month'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.segmentTab,
                viewMode === mode && styles.segmentTabActive,
                viewMode === mode && { backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : '#fff' },
              ]}
              onPress={() => setViewMode(mode)}
              activeOpacity={0.7}
            >
              <Text style={[
                viewMode === mode ? styles.segmentTextActive : styles.segmentText,
                { color: viewMode === mode ? (isDark ? '#fff' : '#111') : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)') },
              ]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Header: Month Year + Total ── */}
        <View style={styles.calendarHeader}>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={goBack} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.monthText, { color: colors.text }]}>
              {dateType === 'hijri' ? (
                (() => {
                  const y = currentDate.getFullYear();
                  const m = currentDate.getMonth() + 1;
                  const hj = hijriConverter.toHijri(y, m, 1);
                  const HIJRI_MONTHS = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'];
                  return (
                    <Text>
                      {HIJRI_MONTHS[hj.hm - 1]} <Text style={{ color: colors.textTertiary }}>{hj.hy}</Text>
                    </Text>
                  );
                })()
              ) : (
                <Text>
                  {MONTHS[currentDate.getMonth()]} <Text style={{ color: colors.textTertiary }}>{currentDate.getFullYear()}</Text>
                </Text>
              )}
            </Text>
            <TouchableOpacity onPress={goForward} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.monthlyTotalText, { color: colors.textSecondary }]}>
            {viewMode === 'month' ? 'Monthly' : 'Weekly'}:{' '}
            <Text style={[styles.totalNumber, { color: colors.text }]}>{totalAyahsInView}</Text>
            <Text style={{ fontSize: 12 }}> ayahs</Text>
          </Text>
        </View>

        {/* ── Weekday Labels ── */}
        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map(day => (
            <Text key={day} style={[styles.weekdayLabel, { color: colors.textTertiary, width: CELL_WIDTH }]}>{day}</Text>
          ))}
        </View>

        {/* ── Calendar Grid ── */}
        <View style={styles.grid}>
          {calendarGrid.map((cell) => {
            if (cell.empty) {
              return <View key={cell.key} style={[styles.dayCell, { width: CELL_WIDTH, height: CELL_WIDTH }]} />;
            }
            
            const isRead = !!detailedHistory[cell.dateStr!];
            const isSelected = selectedDateStr === cell.dateStr;

            return (
              <TouchableOpacity
                key={cell.key}
                style={[
                  styles.dayCell,
                  { width: CELL_WIDTH, height: CELL_WIDTH, borderRadius: CELL_WIDTH / 2 },
                  isSelected && styles.dayCellSelected
                ]}
                activeOpacity={0.6}
                onPress={() => {
                  if (isRead) {
                    setSelectedDateStr(cell.dateStr!);
                  }
                }}
              >
                <Text style={[
                  styles.dayNumberText,
                  { color: isRead ? colors.text : colors.textTertiary },
                  isSelected && { color: '#f59e0b' } // Orange text if selected
                ]}>
                  {cell.dayNumber}
                </Text>
                {/* Flame indicator if read, empty ring if not */}
                {isRead ? (
                  <Flame 
                    size={14} 
                    color={isSelected ? '#f59e0b' : '#ff3b30'} 
                    style={{ marginTop: 2 }} 
                  />
                ) : (
                  <View style={[styles.dayDotEmpty, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      {/* ── Heavy Blur Modal & Popover ── */}
      <Modal
        visible={!!selectedDateStr}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDateStr(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedDateStr(null)}>
          <View style={styles.modalBackdrop}>
            {/* The Blur Effect */}
            <BlurView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            
            {/* The Popover Card */}
            <TouchableWithoutFeedback>
              <View style={[
                styles.popover, 
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}>
                {/* Popover Header */}
                <View style={styles.popoverHeader}>
                  <Text style={[styles.popoverDate, { color: colors.text }]}>
                    {selectedFullDisplay?.split(',')[0]}, <Text style={{ color: colors.textSecondary, fontFamily: Fonts.sans }}>{selectedFullDisplay?.split(',')[1]}</Text>
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedDateStr(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <X size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Popover List */}
                <View style={styles.popoverList}>
                  {selectedDetails.map((detail, idx) => (
                    <View key={idx} style={styles.popoverRow}>
                      <View style={styles.popoverIconWrap}>
                        <BookOpen size={16} color={colors.primary} />
                      </View>
                      <View style={styles.popoverSurahInfo}>
                        <Text style={[styles.popoverSurahName, { color: colors.text }]}>
                          {ENGLISH_NAMES[detail.surah_number] ?? `Surah ${detail.surah_number}`}
                        </Text>
                        <Text style={[styles.popoverSurahType, { color: colors.textSecondary }]}>Surah</Text>
                      </View>
                      <Text style={[styles.popoverCount, { color: colors.text }]}>{detail.ayahs_count} Ayahs</Text>
                    </View>
                  ))}
                </View>

                {/* Popover Footer (Total) */}
                <View style={[styles.popoverFooter, { borderTopColor: isDark ? '#404040' : '#e5e7eb' }]}>
                  <Text style={[styles.popoverTotalLabel, { color: colors.textSecondary }]}>Total:</Text>
                  <Text style={[styles.popoverTotalCount, { color: colors.text }]}>{selectedTotalAyahs} Ayahs</Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

// Removed CELL_WIDTH as we now use percentages

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    padding: 24,
  },
  streakHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  hijriToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  hijriToggleText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
  },
  segmentControl: {
    flexDirection: 'row',
    borderRadius: 100,
    padding: 4,
    marginBottom: 24,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 100,
  },
  segmentTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
  },
  segmentTextActive: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
  },
  monthlyTotalText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  weekdayLabel: {
    textAlign: 'center',
    fontFamily: Fonts.sans,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayCellSelected: {
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 100,
  },
  dayNumberText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
  },
  dayDotEmpty: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    borderWidth: 1,
  },
  readDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  totalNumber: {
    fontFamily: Fonts.display,
    fontSize: 18,
  },
  
  // Modal Popover Styles
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popover: {
    width: 290,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 10,
  },
  popoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  popoverDate: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
  },
  popoverList: {
    gap: 16,
    marginBottom: 24,
  },
  popoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popoverIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(26, 122, 82, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  popoverSurahInfo: {
    flex: 1,
  },
  popoverSurahName: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    marginBottom: 2,
  },
  popoverSurahType: {
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  popoverCount: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  popoverFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  popoverTotalLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
  },
  popoverTotalCount: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
  },
});
