import React, { createContext, useState, useEffect, useRef } from 'react';
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  State,
  useIsPlaying,
  useProgress,
  usePlaybackState,
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
    
    // 🔴 FORCE STOP ANY GHOST AUDIO 🔴
    // This catches audio playing from a previous detached hot-reload session
    await TrackPlayer.stop();
    
    isPlayerInitialized = true;
  } catch (e) {
  }
};

interface AudioContextType {
  playAudio: (url: string, title?: string) => Promise<void>;
  playPlaylist: (urls: string[], startIndex?: number, surahName?: string) => Promise<void>;
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
  const { playing, bufferingDuringPlay } = useIsPlaying();
  const { position, duration } = useProgress();

  const [playlist, setPlaylist] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(DEFAULT_RECITER);
  // Track whether a Live Activity (Dynamic Island) is currently active
  const activityActive = useRef(false);

  useEffect(() => {
    setupPlayer();
  }, []);

  const isPlaying = playing === true;
  const isLoading = bufferingDuringPlay === true;
  const playState = usePlaybackState();

  // End live activity if playback is stopped, finished, or errored
  // Guard: only end if we actually started one — State.None fires at startup
  // before any audio plays and must not prematurely kill a non-existent activity.
  useEffect(() => {
    if (
      activityActive.current &&
      (playState.state === State.Stopped ||
        playState.state === State.Ended ||
        playState.state === State.None ||
        playState.state === State.Error)
    ) {
      activityActive.current = false;
      QuranLiveActivity.endActivity();
    }
  }, [playState.state]);

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

  const playAudio = async (url: string, title = 'Quran Recitation') => {
    if (!isPlayerInitialized) await setupPlayer();
    setPlaylist([url]);
    setCurrentIndex(0);
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: 'track-0',
        url,
        title,
        artist: selectedReciter.reciter_name,
      });
      await TrackPlayer.play();
      activityActive.current = true;
      QuranLiveActivity.startActivity('Quran', 1, selectedReciter.reciter_name);
    } catch (error) {
    }
  };

  const playPlaylist = async (urls: string[], startIndex = 0, surahName?: string) => {
    if (!urls.length) return;
    if (!isPlayerInitialized) await setupPlayer();
    
    setPlaylist(urls);
    setCurrentIndex(startIndex);
    try {
      await TrackPlayer.reset();
      const tracks = urls.map((u, i) => ({
        id: `track-${i}`,
        url: u,
        title: surahName ? `${surahName} - Ayah ${i + 1}` : `Ayah ${i + 1}`,
        artist: selectedReciter.reciter_name,
      }));
      await TrackPlayer.add(tracks);
      await TrackPlayer.skip(startIndex);
      await TrackPlayer.play();
      activityActive.current = true;
      QuranLiveActivity.startActivity(surahName ?? 'Quran', startIndex + 1, selectedReciter.reciter_name);
    } catch (error) {
    }
  };

  const togglePlayback = async () => {
    const playState = await TrackPlayer.getPlaybackState();
    const playWhenReady = await TrackPlayer.getPlayWhenReady();
    if (playWhenReady && playState.state !== State.Paused && playState.state !== State.Stopped && playState.state !== State.None) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  const stopAudio = async () => {
    await TrackPlayer.stop();
    await TrackPlayer.seekTo(0);
    setCurrentIndex(0);
    if (activityActive.current) {
      activityActive.current = false;
      QuranLiveActivity.endActivity();
    }
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
