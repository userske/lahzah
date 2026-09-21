import { useState, useCallback, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { Reciter } from '../data/reciters';

export interface DownloadState {
  isDownloading: boolean;
  progress: number; // 0 to 1
  isDownloaded: boolean;
  localUri: string | null;
}

export const getLocalFileUri = (surahNumber: number, reciterId: string | number) => {
  return `${FileSystem.documentDirectory}audio_${reciterId}_surah_${surahNumber}.mp3`;
};

export function useAudioDownload(surahNumber: number, reciter: Reciter | null) {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    progress: 0,
    isDownloaded: false,
    localUri: null,
  });

  const getLocalFileUriHook = useCallback(() => {
    if (!reciter) return null;
    return getLocalFileUri(surahNumber, reciter.id);
  }, [surahNumber, reciter]);

  const checkDownloadedStatus = useCallback(async () => {
    const fileUri = getLocalFileUriHook();
    if (!fileUri) {
      setDownloadState(prev => ({ ...prev, isDownloaded: false, localUri: null }));
      return;
    }

    try {
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        setDownloadState(prev => ({
          ...prev,
          isDownloaded: true,
          localUri: fileUri,
          progress: 1,
        }));
      } else {
        setDownloadState(prev => ({ ...prev, isDownloaded: false, localUri: null }));
      }
    } catch (e) {
      setDownloadState(prev => ({ ...prev, isDownloaded: false, localUri: null }));
    }
  }, [getLocalFileUri]);

  useEffect(() => {
    checkDownloadedStatus();
  }, [checkDownloadedStatus]);

  const downloadSurah = useCallback(async (url: string) => {
    const fileUri = getLocalFileUriHook();
    if (!fileUri) return;

    setDownloadState(prev => ({ ...prev, isDownloading: true, progress: 0 }));

    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadState(prev => ({ ...prev, progress }));
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result && result.status === 200) {
        setDownloadState({
          isDownloading: false,
          progress: 1,
          isDownloaded: true,
          localUri: result.uri,
        });
      } else {
        // Handle failed download
        throw new Error('Download failed');
      }
    } catch (e) {
      setDownloadState(prev => ({
        ...prev,
        isDownloading: false,
        progress: 0,
      }));
    }
  }, [getLocalFileUriHook]);

  const removeDownload = useCallback(async () => {
    const fileUri = getLocalFileUriHook();
    if (!fileUri) return;

    try {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      setDownloadState({
        isDownloading: false,
        progress: 0,
        isDownloaded: false,
        localUri: null,
      });
    } catch (e) {
    }
  }, [getLocalFileUriHook]);

  return {
    downloadState,
    downloadSurah,
    removeDownload,
    checkDownloadedStatus,
  };
}
