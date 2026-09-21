import { useState } from 'react';
import {
  useAudioRecorder as useExpoAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { analyzeAudioWithAI } from '../services/quranAiApi';
import { Alert } from 'react-native';

export function useAudioRecorder() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const recorder = useExpoAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 100);

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (permission.granted) {
        await setAudioModeAsync({ 
          allowsRecording: true, 
          playsInSilentMode: true,
          interruptionMode: 'doNotMix',
          shouldPlayInBackground: false,
          shouldRouteThroughEarpiece: false
        });
        await recorder.prepareToRecordAsync();
        recorder.record();
        setAnalysisResult(null);
      } else {
        Alert.alert('Permission to access microphone is required');
      }
    } catch (err) {
    }
  };


  const stopRecordingAndAnalyze = async (reference?: string) => {
    try {
      setIsAnalyzing(true);
      
      await recorder.stop();
      
      const uri = recorder.uri;

      if (!uri) throw new Error('Failed to get recording URI');

      const result = await analyzeAudioWithAI({ uri, reference });
      
      setAnalysisResult(result);
    } catch (err: any) {
      Alert.alert('Analysis Failed', err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cancelRecording = async () => {
    try {
      await recorder.stop();
    } catch (_) {}
  };

  return {
    isRecording: recorderState.isRecording,
    isAnalyzing,
    analysisResult,
    startRecording,
    stopRecordingAndAnalyze,
    cancelRecording,
    setAnalysisResult,
  };
}
