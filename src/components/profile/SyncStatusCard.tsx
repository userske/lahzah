import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { CloudDownload, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Fonts } from '../../constants/theme';
import { useQuranPreload } from '../../hooks/useQuranPreload';

export function SyncStatusCard() {
  const { colors } = useAppTheme();
  const { status, progress } = useQuranPreload();

  if (status === 'checking') return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
          {status === 'downloading' ? (
            <CloudDownload size={20} color={colors.primary} />
          ) : status === 'complete' ? (
            <CheckCircle2 size={20} color={colors.primary} />
          ) : (
            <AlertCircle size={20} color={colors.error} />
          )}
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.text }]}>
            Quran Data Sync
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {status === 'downloading' 
              ? `Syncing offline data... ${progress?.percent ?? 0}%` 
              : status === 'complete' 
                ? 'All Mushaf pages and Surahs are downloaded for offline access.'
                : 'Failed to sync offline data. Please check your connection.'}
          </Text>
        </View>
      </View>

      {status === 'downloading' && (
        <View style={styles.progressTrack}>
          <View 
            style={[
              styles.progressBar, 
              { backgroundColor: colors.primary, width: `${progress?.percent ?? 0}%` }
            ]} 
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
