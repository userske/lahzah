import { useRef, useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Pressable } from 'react-native';
import { Share2 } from 'lucide-react-native';
import ViewShot, { ViewShotRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useAppTheme } from '../../hooks/useAppTheme';
import { GlassCard, GlassSolidContext } from '../ui/GlassCard';

interface ShareableCardProps {
  children: React.ReactNode;
}

export function ShareableCard({ children }: ShareableCardProps) {
  const { colors } = useAppTheme();
  const viewRef = useRef<ViewShotRef>(null);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (showShare) {
      const timer = setTimeout(() => setShowShare(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showShare]);

  const handleShare = async () => {
    try {
      if (viewRef.current && viewRef.current.capture) {
        const uri = await viewRef.current.capture();
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Share with Lahzah',
        });
      }
    } catch (e) {
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onLongPress={() => setShowShare(true)} delayLongPress={500}>
        {/* Visible Card */}
        {children}
      </Pressable>
      
      {/* Share Button Overlay */}
      {showShare && (
        <TouchableOpacity onPress={handleShare} style={styles.shareButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <GlassCard style={styles.shareButtonGlass} radius={18}>
            <Share2 size={16} color={colors.textTertiary} />
          </GlassCard>
        </TouchableOpacity>
      )}

      {/* Hidden Branded View for Capture.
          view-shot cannot snapshot a native blur layer, so the glass inside
          renders as a solid fill for the captured image. */}
      <View style={styles.hiddenWrapper} pointerEvents="none">
        <ViewShot ref={viewRef} options={{ format: 'png', quality: 1.0 }}>
          <GlassSolidContext.Provider value={true}>
            <View style={[styles.captureContainer, { backgroundColor: colors.background }]}>
              {children}
              {/* Lahzah Branding */}
              <View style={styles.brandingRow}>
                <View style={styles.brandingIcon}>
                  <Text style={{ fontSize: 16 }}>✦</Text>
                </View>
                <View>
                  <Text style={[styles.brandingTitle, { color: colors.primary }]}>Lahzah</Text>
                  <Text style={[styles.brandingTagline, { color: colors.textSecondary }]}>A moment with the Quran</Text>
                </View>
              </View>
            </View>
          </GlassSolidContext.Provider>
        </ViewShot>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 14, // Same margin as FeedCard to replace it seamlessly
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  shareButtonGlass: {
    padding: 8,
  },
  hiddenWrapper: {
    position: 'absolute',
    left: -10000,
    top: 0,
    opacity: 0,
  },
  captureContainer: {
    padding: 24,
    width: 400, // Fixed width for consistent capture resolution
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 16,
  },
  brandingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F0EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandingTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandingTagline: {
    fontSize: 12,
    fontWeight: '500',
  },
});
