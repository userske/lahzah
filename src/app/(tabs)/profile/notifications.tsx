import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Fonts } from '../../../constants/theme';
import * as NotificationService from '../../../services/NotificationService';
import { ArrowLeft } from 'lucide-react-native';

export default function NotificationsSettingsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [streaksEnabled, setStreaksEnabled] = useState(false);
  const [kahfEnabled, setKahfEnabled] = useState(false);
  const [hifzEnabled, setHifzEnabled] = useState(false);

  useEffect(() => {
    // Load preferences
  }, []);

  const handleToggle = async (type: 'streaks' | 'kahf' | 'hifz', value: boolean) => {
    if (value) {
      const granted = await NotificationService.requestNotificationPermissions();
      if (!granted) {
        Alert.alert("Permission Denied", "You need to enable notifications in your phone's settings.");
        return;
      }
    }

    if (type === 'streaks') {
      setStreaksEnabled(value);
      if (value) await NotificationService.scheduleStreakReminder(20, 0); 
      else await NotificationService.cancelAllNotifications(); 
    } else if (type === 'kahf') {
      setKahfEnabled(value);
      if (value) await NotificationService.scheduleFridayKahfReminder();
    } else if (type === 'hifz') {
      setHifzEnabled(value);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: 'Notifications',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: isDark ? colors.background : '#F7F8FA' },
          headerTitleStyle: { fontFamily: Fonts.sansBold, fontSize: 16, color: colors.text },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={{ padding: 8, marginLeft: -8 }}>
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Customize your alerts.</Text>
        <Text style={styles.headerSub}>Control when and how Lahzah reminds you to connect with the Quran.</Text>

        <View style={styles.settingsGroup}>
          
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Streak Saver</Text>
              <Text style={styles.settingDesc}>Daily reminder at 8:00 PM if you haven't read yet.</Text>
            </View>
            <Switch 
              value={streaksEnabled} 
              onValueChange={(val) => handleToggle('streaks', val)} 
              trackColor={{ true: colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Friday Al-Kahf</Text>
              <Text style={styles.settingDesc}>Weekly reminder every Friday morning to read Surah Al-Kahf.</Text>
            </View>
            <Switch 
              value={kahfEnabled} 
              onValueChange={(val) => handleToggle('kahf', val)} 
              trackColor={{ true: colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Hifz Spaced Repetition</Text>
              <Text style={styles.settingDesc}>Smart alerts when it's time to review a memorized verse before you forget it.</Text>
            </View>
            <Switch 
              value={hifzEnabled} 
              onValueChange={(val) => handleToggle('hifz', val)} 
              trackColor={{ true: colors.primary }}
            />
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? colors.background : '#F7F8FA',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: colors.text,
    marginBottom: 8,
  },
  headerSub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 32,
    lineHeight: 20,
  },
  settingsGroup: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: isDark ? colors.surface : '#FFFFFF',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  settingText: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  settingDesc: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: isDark ? colors.border : '#F0F0F0',
    marginLeft: 20,
  }
});
