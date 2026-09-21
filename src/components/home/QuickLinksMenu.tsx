import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { BookOpen, HandHeart, Menu, Star, Sun, Target, X } from 'lucide-react-native';
import { useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { Fonts } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';

const { width } = Dimensions.get('window');

const MENU_ITEMS = [
  { id: 'hadiths', path: '/hadiths', label: 'Hadiths', icon: BookOpen, color: 'rgba(0, 0, 0, 0.08)' },
  { id: 'tasbih', path: '/tasbih', label: 'Tasbih Counter', icon: HandHeart, color: 'rgba(230, 57, 70, 0.1)' },
  { id: 'duas', path: '/duas', label: 'Daily Duas', icon: Sun, color: 'rgba(234, 179, 8, 0.1)' },
  { id: 'hifz', path: '/messages/hifz', label: 'Hifz Challenges', icon: Target, color: 'rgba(16, 185, 129, 0.1)' },
  { id: 'names', path: '/names', label: '99 Names of Allah', icon: Star, color: 'rgba(124, 58, 237, 0.1)' },
];

export function QuickLinksMenu() {
  const { colors, isDark } = useAppTheme();
  const [isVisible, setIsVisible] = useState(false);

  const toggleMenu = () => setIsVisible(!isVisible);

  const navigate = (path: any) => {
    setIsVisible(false);
    // Allow animation to finish before routing
    setTimeout(() => {
      router.push(path);
    }, 150);
  };

  return (
    <>
      <TouchableOpacity
        onPress={toggleMenu}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.menuButton}
      >
        <Menu size={24} color={isDark ? '#fff' : '#000'} />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        onRequestClose={toggleMenu}
      >
        <View style={styles.modalWrapper}>
          {/* Animated Backdrop */}
          {isVisible && (
            <Animated.View
              style={StyleSheet.absoluteFill}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
            >
              <BlurView
                style={StyleSheet.absoluteFill}
                tint={isDark ? 'dark' : 'light'}
                intensity={40}
              >
                <Pressable style={StyleSheet.absoluteFill} onPress={toggleMenu} />
              </BlurView>
            </Animated.View>
          )}

          {/* Bottom Sheet Menu */}
          {isVisible && (
            <Animated.View
              style={styles.sheetContainer}
              entering={SlideInDown.duration(300)}
              exiting={SlideOutDown.duration(300)}
            >
              <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Handle for bottom sheet */}
                <View style={styles.sheetHandleContainer}>
                  <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
                </View>

                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Quick Access</Text>
                  <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
                    <X size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.linksGrid}>
                  {MENU_ITEMS.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Animated.View
                        key={item.id}
                        style={styles.linkItem}
                        entering={FadeInDown.delay(index * 50).duration(200)}
                      >
                        <TouchableOpacity
                          onPress={() => navigate(item.path)}
                          activeOpacity={0.7}
                          style={styles.linkButton}
                        >
                          <Text style={[styles.linkLabel, { color: colors.text }]}>{item.label}</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    marginLeft: 12,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
  },
  modalContent: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 48,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
  },
  closeButton: {
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
  },
  linksGrid: {
    flexDirection: 'column',
    gap: 20,
    justifyContent: 'flex-start',
  },
  linkItem: {
    width: '100%',
    alignItems: 'flex-start',
  },
  linkButton: {
    alignItems: 'flex-start',
    width: '100%',
    paddingVertical: 12,
  },
  linkLabel: {
    fontFamily: Fonts.display,
    fontSize: 20,
    textAlign: 'left',
    opacity: 0.9,
  },
});
