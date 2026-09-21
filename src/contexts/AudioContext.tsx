import React, { createContext, useState, useEffect } from 'react';
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  State,
  usePlaybackState,
  useProgress,
} from 'react-native-track-player';
import { Reciter, DEFAULT_RECITER } from '../data/reciters';
import * as QuranLiveActivity from '../../modules/quran-live-activity/src';

// Set up TrackPlayer once
let isPlayerInitialized = false;

const setupPlayer = async () => {
  if (isPlayerInitialized) return;
  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
    });
    isPlayerInitialized = true;
  } catch (e) {
  }
};

interface AudioContextType {
  playAudio: (url: string) => Promise<void>;
  playPlaylist: (urls: string[], startIndex?: number) => Promise<void>;
  togglePlayback: () => Promise<void>;
  stopAudio: () => Promise<void>;
  skipTo: (index: number) => void;
  seekTo: (positionSeconds: number) => void;
  isPlaying: boolean;
  isLoading: boolean;
  positionMillis: number;
  durationMillis: number;
  currentTrackIndex: number;
  
  // Shared state
  selectedReciter: Reciter;
  setSelectedReciter: (reciter: Reciter) => void;
  playlist: string[];
}

export const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const playbackState = usePlaybackState();
  const { position, duration } = useProgress();

  const [playlist, setPlaylist] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(DEFAULT_RECITER);

  useEffect(() => {
    setupPlayer();
  }, []);

  const isPlaying = playbackState.state === State.Playing;
  const isLoading = playbackState.state === State.Buffering || playbackState.state === State.Loading;

  // Sync Live Activity
  useEffect(() => {
    if (playlist.length > 0) {
      QuranLiveActivity.updateActivity(
        currentIndex + 1, // Ayah number roughly matches index + 1 for now
        isPlaying,
        duration > 0 ? position / duration : 0
      );
    }
  }, [currentIndex, isPlaying]);

  const playAudio = async (url: string) => {
    if (!isPlayerInitialized) await setupPlayer();
    setPlaylist([url]);
    setCurrentIndex(0);
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: 'track-0',
        url,
        title: 'Quran Recitation',
        artist: selectedReciter.reciter_name,
      });
      await TrackPlayer.play();
      QuranLiveActivity.startActivity('Quran', 1, selectedReciter.reciter_name);
    } catch (error) {
    }
  };

  const playPlaylist = async (urls: string[], startIndex = 0) => {
    if (!urls.length) return;
    if (!isPlayerInitialized) await setupPlayer();
    
    setPlaylist(urls);
    setCurrentIndex(startIndex);
    try {
      await TrackPlayer.reset();
      const tracks = urls.map((u, i) => ({
        id: `track-${i}`,
        url: u,
        title: `Ayah ${i + 1}`,
        artist: selectedReciter.reciter_name,
      }));
      await TrackPlayer.add(tracks);
      await TrackPlayer.skip(startIndex);
      await TrackPlayer.play();
      QuranLiveActivity.startActivity('Quran', startIndex + 1, selectedReciter.reciter_name);
    } catch (error) {
    }
  };

  const togglePlayback = async () => {
    const state = await TrackPlayer.getPlaybackState();
    if (state.state === State.Playing) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  const stopAudio = async () => {
    await TrackPlayer.stop();
    await TrackPlayer.seekTo(0);
    setCurrentIndex(0);
    QuranLiveActivity.endActivity();
  };

  const seekTo = async (positionSeconds: number) => {
    await TrackPlayer.seekTo(positionSeconds);
  };

  const skipTo = async (index: number) => {
    if (index >= 0 && index < playlist.length) {
      setCurrentIndex(index);
      await TrackPlayer.skip(index);
      await TrackPlayer.play();
    }
  };

  const value = {
    playAudio,
    playPlaylist,
    togglePlayback,
    stopAudio,
    skipTo,
    seekTo,
    isPlaying,
    isLoading,
    positionMillis: position * 1000,
    durationMillis: (duration * 1000) || 1,
    currentTrackIndex: currentIndex,
    selectedReciter,
    setSelectedReciter,
    playlist,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}
