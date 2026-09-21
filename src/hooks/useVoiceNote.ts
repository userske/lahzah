/**
 * useVoiceNote
 *
 * Records a voice note using expo-audio, uploads it to Supabase Storage
 * (bucket: "voice-notes"), and returns the public URL ready to persist
 * as a 'voice_note' message in circle_messages.
 *
 * Works in EAS builds only — expo-audio needs microphone entitlements
 * that are not available in Expo Go.
 */
import { useState, useRef } from 'react';
import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

export interface VoiceNoteState {
  isRecording: boolean;
  isUploading: boolean;
  durationMs: number;
}

export function useVoiceNote() {
  const [isUploading, setIsUploading] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 100);
  const startTimeRef = useRef<number>(0);

  // ── Start ──────────────────────────────────────────────────────────
  const startRecording = async (): Promise<boolean> => {
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Microphone permission required', 'Please enable microphone access in Settings.');
        return false;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      startTimeRef.current = Date.now();
      return true;
    } catch (err: any) {
      Alert.alert('Recording error', err.message ?? 'Could not start recording');
      return false;
    }
  };

  // ── Stop + Upload ──────────────────────────────────────────────────
  const stopAndUpload = async (): Promise<{ url: string; durationMs: number } | null> => {
    const durationMs = Date.now() - startTimeRef.current;
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('No recording file found');

      setIsUploading(true);

      // Read the file as Base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Build a unique storage path
      const fileName = `voice_${Date.now()}.m4a`;
      const storagePath = `voice-notes/${fileName}`;

      // Convert base64 → Uint8Array for Supabase storage
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const { error: uploadError } = await supabase.storage
        .from('voice-notes')
        .upload(storagePath, bytes.buffer as ArrayBuffer, {
          contentType: 'audio/mp4',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage.from('voice-notes').getPublicUrl(storagePath);
      if (!data?.publicUrl) throw new Error('Could not get public URL');

      return { url: data.publicUrl, durationMs };
    } catch (err: any) {
      Alert.alert('Upload failed', err.message ?? 'Could not upload voice note');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // ── Cancel ─────────────────────────────────────────────────────────
  const cancelRecording = async () => {
    try {
      await recorder.stop();
    } catch (_) {}
  };

  return {
    isRecording: recorderState.isRecording,
    isUploading,
    durationMs: recorderState.isRecording ? Date.now() - startTimeRef.current : 0,
    metering: recorderState.metering ?? -160,
    startRecording,
    stopAndUpload,
    cancelRecording,
  };
}
