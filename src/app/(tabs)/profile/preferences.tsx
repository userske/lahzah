import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ChevronLeft, Moon, Sun, Monitor, Minus, Plus } from 'lucide-react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { usePreferences, ThemeType, ScriptType } from '../../../hooks/usePreferences';
import { Fonts } from '../../../constants/theme';
import { TranslationPickerModal } from '../../../components/quran/TranslationPickerModal';
import { fetchRecitations } from '../../../services/quranApi';

export default function PreferencesScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  
  const {
    theme, setTheme,
    scriptType, setScriptType,
    arabicFontSize, setArabicFontSize,
    translationFontSize, setTranslationFontSize,
    defaultTranslationId, setDefaultTranslationId,
    defaultReciterId, setDefaultReciterId
  } = usePreferences();

  const [translationModalVisible, setTranslationModalVisible] = useState(false);
  const [reciterModalVisible, setReciterModalVisible] = useState(false);
  const [reciters, setReciters] = useState<any[]>([]);
  
  // Load reciters for the picker
  const loadReciters = async () => {
    const res = await fetchRecitations();
    if (res?.recitations) {
      setReciters(res.recitations);
    }
  };

  const ThemeOption = ({ type, icon: Icon, label }: { type: ThemeType, icon: any, label: string }) => {
    const isActive = theme === type;
    return (
      <TouchableOpacity 
        style={[styles.themeOption, isActive && styles.themeOptionActive]}
        onPress={() => setTheme(type)}
        activeOpacity={0.7}
      >
        <Icon size={20} color={isActive ? colors.primary : colors.textTertiary} />
        <Text style={[styles.themeOptionText, isActive && styles.themeOptionTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const FontStepper = ({ label, value, onDecrease, onIncrease, min, max }: { label: string, value: number, onDecrease: () => void, onIncrease: () => void, min: number, max: number }) => (
    <View style={styles.stepperContainer}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity style={styles.stepperBtn} onPress={onDecrease} disabled={value <= min}>
          <Minus size={16} color={value <= min ? colors.textTertiary : colors.text} opacity={value <= min ? 0.3 : 1} />
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{value}</Text>
        <TouchableOpacity style={styles.stepperBtn} onPress={onIncrease} disabled={value >= max}>
          <Plus size={16} color={value >= max ? colors.textTertiary : colors.text} opacity={value >= max ? 0.3 : 1} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const ScriptOption = ({ type, label }: { type: ScriptType, label: string }) => {
    const isActive = scriptType === type;
    return (
      <TouchableOpacity 
        style={[styles.themeOption, isActive && styles.themeOptionActive]}
        onPress={() => setScriptType(type)}
        activeOpacity={0.7}
      >
        <Text style={[styles.themeOptionText, isActive && styles.themeOptionTextActive, { marginTop: 0 }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const SettingRow = ({ label, value, onPress }: { label: string, value: string, onPress: () => void }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={styles.settingValue}>{value}</Text>
        <ChevronLeft size={16} color={colors.textTertiary} style={{ transform: [{ rotate: '180deg' }] }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>App Preferences</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.themeSelector}>
              <ThemeOption type="system" icon={Monitor} label="System" />
              <ThemeOption type="light" icon={Sun} label="Light" />
              <ThemeOption type="dark" icon={Moon} label="Dark" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reading Font Sizes</Text>
            <View style={styles.card}>
              <FontStepper 
                label="Arabic Font Size"
                value={arabicFontSize}
                onDecrease={() => setArabicFontSize(Math.max(16, arabicFontSize - 2))}
                onIncrease={() => setArabicFontSize(Math.min(48, arabicFontSize + 2))}
                min={16} max={48}
              />
              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
              <FontStepper 
                label="Translation Font Size"
                value={translationFontSize}
                onDecrease={() => setTranslationFontSize(Math.max(10, translationFontSize - 1))}
                onIncrease={() => setTranslationFontSize(Math.min(24, translationFontSize + 1))}
                min={10} max={24}
              />
            </View>
            <Text style={styles.helperText}>
              Note: Font size scaling applies to List mode. The Quran (Mushaf) view uses a fixed layout.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reading & Display Options</Text>
            <View style={styles.card}>
              <View style={[styles.stepperContainer, { marginBottom: 16 }]}>
                <Text style={styles.stepperLabel}>Quran Script Type</Text>
              </View>
              <View style={styles.themeSelector}>
                <ScriptOption type="uthmani" label="Uthmani (Madani)" />
                <ScriptOption type="indopak" label="Indo-Pak" />
              </View>
              
              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
              
              <SettingRow 
                label="Default Translation" 
                value="Tap to change" 
                onPress={() => setTranslationModalVisible(true)} 
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Audio Preferences</Text>
            <View style={styles.card}>
              <SettingRow 
                label="Default Reciter" 
                value="Tap to change" 
                onPress={() => {
                  if (reciters.length === 0) loadReciters();
                  setReciterModalVisible(true);
                }} 
              />
              
              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
              
              <SettingRow 
                label="Audio Download Quality" 
                value="High" 
                onPress={() => {}} 
              />
            </View>
            <Text style={styles.helperText}>
              Note: Offline audio downloads will be fully enabled in a future update.
            </Text>
          </View>

          {/* Preview Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.previewCard}>
              <Text style={[styles.previewArabic, { fontSize: arabicFontSize }]}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </Text>
              <Text style={[styles.previewTranslation, { fontSize: translationFontSize }]}>
                In the name of Allah, the Entirely Merciful, the Especially Merciful.
              </Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>

      <TranslationPickerModal 
        visible={translationModalVisible}
        onClose={() => setTranslationModalVisible(false)}
        selectedTranslationId={defaultTranslationId}
        onSelectTranslation={setDefaultTranslationId}
      />

      {/* Basic Reciter Modal (Can be upgraded later) */}
      {reciterModalVisible && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 100 }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setReciterModalVisible(false)} />
          <View style={{ height: '70%', backgroundColor: isDark ? colors.surface : '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
            <Text style={{ fontFamily: Fonts.sansBold, fontSize: 18, color: colors.text, marginBottom: 16 }}>Select Reciter</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {reciters.length === 0 ? (
                <Text style={{ color: colors.textSecondary, marginTop: 20, textAlign: 'center' }}>Loading reciters...</Text>
              ) : (
                reciters.map(r => (
                  <TouchableOpacity 
                    key={r.id} 
                    style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                    onPress={() => {
                      setDefaultReciterId(String(r.id));
                      setReciterModalVisible(false);
                    }}
                  >
                    <View>
                      <Text style={{ fontFamily: Fonts.sansMedium, fontSize: 16, color: colors.text }}>{r.reciter_name}</Text>
                      {r.style && <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{r.style}</Text>}
                    </View>
                    {String(r.id) === String(defaultReciterId) && (
                      <Text style={{ color: colors.primary }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: isDark ? colors.background : '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: isDark ? colors.surface : '#FFFFFF',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: colors.text,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: isDark ? colors.surface : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  },
  themeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: isDark ? colors.primary + '15' : colors.primary + '0A',
  },
  themeOptionText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
  },
  themeOptionTextActive: {
    color: colors.primary,
    fontFamily: Fonts.sansSemiBold,
  },
  card: {
    borderRadius: 20,
    backgroundColor: isDark ? colors.surface : '#FFFFFF',
    padding: 20,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 16,
    color: colors.text,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepperBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? colors.background : '#F0F2F5',
    alignItems: 'center', justifyContent: 'center',
  },
  stepperValue: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: colors.text,
    minWidth: 28,
    textAlign: 'center',
  },
  helperText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 12,
    lineHeight: 18,
  },
  previewCard: {
    borderRadius: 20,
    backgroundColor: isDark ? colors.surface : '#FFFFFF',
    padding: 24,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  },
  previewArabic: {
    fontFamily: 'AmiriQuran',
    color: colors.text,
    textAlign: 'right',
    lineHeight: 60, // approximate scalable lineHeight
    marginBottom: 16,
  },
  previewTranslation: {
    fontFamily: Fonts.sans,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 16,
    color: colors.text,
  },
  settingValue: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: colors.textSecondary,
  }
});
