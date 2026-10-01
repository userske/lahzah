/**
 * ReaderSettingsModal — shared "Display Settings" sheet used by both
 * the Browse screen (hamburger) and the Reader screen (⋯ button).
 */
import { Modal, View, Text, Switch, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { GlassBlur } from '../ui/GlassCard';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { Fonts } from '../../constants/theme';
import { setReaderSettings } from '../../state/readerSettings';
import { useReaderSettings } from '../../hooks/useReaderSettings';
import { useAppTheme } from '../../hooks/useAppTheme';

interface Props {
  visible: boolean;
  onClose: () => void;
  colors: any;
  onMushafEnabled?: () => void;
  onHifzEnabled?: () => void;
  onTranslationChange?: (id: number) => void;
}

export function ReaderSettingsModal({
  visible, onClose, colors,
  onMushafEnabled, onHifzEnabled, onTranslationChange,
}: Props) {
  const settings = useReaderSettings();
  const { isDark } = useAppTheme();

  const update = (patch: Parameters<typeof setReaderSettings>[0]) => {
    setReaderSettings(patch);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Animated Backdrop */}
        {visible && (
          <Animated.View
            style={StyleSheet.absoluteFill}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
          >
            <GlassBlur
              style={StyleSheet.absoluteFill}
              tint={isDark ? 'dark' : 'light'}
              intensity={40}
            >
              <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </GlassBlur>
          </Animated.View>
        )}

        {/* Bottom Sheet Menu */}
        {visible && (
          <Animated.View
            style={styles.sheetContainer}
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(300)}
          >
            <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Handle for bottom sheet */}
              <View style={styles.sheetHandleContainer}>
                <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Display Settings</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Mushaf Mode */}
              <SettingRow
                label="Mushaf Mode"
                sub="Read from traditional pages"
                colors={colors}
                value={settings.viewMode === 'mushaf'}
                onToggle={v => {
                  update({ viewMode: v ? 'mushaf' : 'list' });
                  if (v) { onMushafEnabled?.(); onClose(); }
                }}
              />

              {/* Hifz Mode */}
              <SettingRow
                label="Hifz Mode"
                sub="Blur text to test memorisation"
                colors={colors}
                value={settings.isHifzMode}
                onToggle={v => {
                  update({ isHifzMode: v });
                  if (v) { onHifzEnabled?.(); onClose(); }
                }}
              />

              <View style={[styles.divider, { backgroundColor: colors.divider || colors.border }]} />

              {/* Translation toggle + language pills */}
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.text }]}>Translation</Text>
                  <Text style={[styles.sub, { color: colors.textTertiary }]}>
                    {[85, 131].includes(settings.selectedTranslationId) ? 'English' :
                     [231, 49].includes(settings.selectedTranslationId) ? '🇹🇿 Swahili' : 'Custom'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {settings.showTranslation && (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <LangPill label="SW" active={[231, 49].includes(settings.selectedTranslationId)}
                        activeColor="#10b981" colors={colors}
                        onPress={() => { update({ selectedTranslationId: 231 }); onTranslationChange?.(231); }} />
                      <LangPill label="EN" active={[85, 131].includes(settings.selectedTranslationId)}
                        activeColor={colors.primary} colors={colors}
                        onPress={() => { update({ selectedTranslationId: 85 }); onTranslationChange?.(85); }} />
                    </View>
                  )}
                  <Switch value={settings.showTranslation}
                    onValueChange={v => update({ showTranslation: v })}
                    trackColor={{ true: colors.primary, false: colors.skeleton }} thumbColor="#fff" />
                </View>
              </View>

              {/* Transliteration */}
              <SettingRow label="Transliteration" sub="Show English pronunciation" colors={colors}
                value={settings.showTransliteration} onToggle={v => update({ showTransliteration: v })} />

              {/* Word by Word */}
              <SettingRow label="Word by Word" sub="Show translation under each word" colors={colors}
                value={settings.showWordByWord} onToggle={v => update({ showWordByWord: v })} />

              {/* Tajweed */}
              <SettingRow label="Tajweed Rules" sub="Highlight pronunciation rules" colors={colors}
                value={settings.showTajweed} onToggle={v => update({ showTajweed: v })} />

            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

function SettingRow({ label, sub, colors, value, onToggle }: {
  label: string; sub: string; colors: any; value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.sub, { color: colors.textTertiary }]}>{sub}</Text>
      </View>
      <Switch value={value} onValueChange={onToggle}
        trackColor={{ true: colors.primary, false: colors.skeleton }} thumbColor="#fff" />
    </View>
  );
}

function LangPill({ label, active, activeColor, colors, onPress }: {
  label: string; active: boolean; activeColor: string; colors: any; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
        backgroundColor: active ? activeColor : colors.skeleton }}
      onPress={onPress}
    >
      <Text style={{ color: active ? '#fff' : colors.textSecondary,
        fontFamily: Fonts.sansMedium, fontSize: 11 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 48,
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20,
  },
  sheetHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 22,
  },
  closeButton: {
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    marginBottom: 2,
  },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
});
