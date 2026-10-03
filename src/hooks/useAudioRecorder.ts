import { useState } from 'react';
import {
  useAudioRecorder as useExpoAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  setAudioModeAsync,
  IOSOutputFormat,
  AudioQuality,
} from 'expo-audio';
import { Alert } from 'react-native';

// Lazy import — avoids pulling react-native-sherpa-onnx (and its
// @dr.pogodin/react-native-fs dependency) into the startup bundle before
// the native ReactNativeFs module is registered in the binary.
let _analyzeAudioWithAI: typeof import('../services/quranAiApi').analyzeAudioWithAI | null = null;
const getAnalyzeAudioWithAI = async () => {
  if (!_analyzeAudioWithAI) {
    const mod = await import('../services/quranAiApi');
    _analyzeAudioWithAI = mod.analyzeAudioWithAI;
  }
  return _analyzeAudioWithAI;
};

/**
 * WAV/PCM recording preset — sherpa-onnx requires WAV (16-bit PCM, 16kHz mono).
 * expo-audio LOW_QUALITY records compressed (3gp); we need LinearPCM.
 */
const WAV_PRESET = {
  extension: '.wav',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 256000,
  ios: {
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.HIGH,
    linearPCMBitDepth: 16 as const,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  android: {
    outputFormat: 'default' as const,
    audioEncoder: 'default' as const,
  },
  web: {
    mimeType: 'audio/wav',
    bitsPerSecond: 256000,
  },
};

export function useAudioRecorder() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const recorder = useExpoAudioRecorder(WAV_PRESET);
  const recorderState = useAudioRecorderState(recorder, 100);

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Microphone access is needed to analyse your recitation.');
        return;
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
      setAnalysisResult(null);
    } catch (err: any) {
      Alert.alert('Recording Error', err?.message ?? 'Could not start recording.');
    }
  };

  const stopRecordingAndAnalyze = async (reference?: string) => {
    try {
      setIsAnalyzing(true);

      await recorder.stop();

      const uri = recorder.uri;
      if (!uri) throw new Error('No recording found. Please try again.');

      const analyzeAudioWithAI = await getAnalyzeAudioWithAI();
      const result = await analyzeAudioWithAI({ uri, reference });

      setAnalysisResult(result);
    } catch (err: any) {
      // Surface a user-friendly message
      const msg: string = err?.message ?? 'Analysis failed. Please try again.';

      // Common error translations
      if (msg.includes('undefined is not a function') || msg.includes('createSTT')) {
        Alert.alert(
          'Analysis Unavailable',
          'The AI recitation model could not be loaded. Please rebuild the app with the latest changes.',
        );
      } else if (msg.includes('transcribeFile') || msg.includes('audio')) {
        Alert.alert('Analysis Failed', 'Could not process the recording. Make sure you recited for at least 2 seconds.');
      } else if (msg.includes('not found') || msg.includes('model')) {
        Alert.alert('Model Error', 'The recitation model is missing. Please reinstall the app.');
      } else {
        Alert.alert('Analysis Failed', msg);
      }
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
