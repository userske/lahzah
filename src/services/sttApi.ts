import { createSTT, SttEngine } from 'react-native-sherpa-onnx';

/**
 * sttApi.ts — Zipformer Phoneme STT (Offline version)
 *
 * Uses Muno459/zipformer_p-quran or zipformer_p_arabic_v3.1 via react-native-sherpa-onnx.
 *
 * This model is a CTC phoneme recognizer, NOT a text ASR.
 * It outputs a space-separated phoneme string (250-unit Ḥafṣ tokenizer).
 * e.g. "b i s m i l l aah i r r a H m aah n i r r a H iy m i"
 *
 * Compare the output phonemes against quran_text2phoneme.json (canonical Ḥafṣ)
 * to detect Tajweed mistakes — not against Arabic text.
 */

let sttEngine: SttEngine | null = null;

const initSttEngine = async (): Promise<SttEngine> => {
  if (sttEngine) return sttEngine;

  try {
    sttEngine = await createSTT({
      modelPath: { type: 'asset', path: 'models' }, // Bundled via expo-asset plugin in app.json
      modelType: 'zipformer_ctc', 
      preferInt8: true, // Uses quran_phoneme_zipformer_int8.onnx (renamed from .int8.onnx for Android compatibility)
    });
    return sttEngine;
  } catch (error) {
    throw error;
  }
};

export interface STTResponse {
  /** The predicted phoneme string, space-separated, e.g. "m aah l i k i" */
  text: string;
  /** True if the output is phonemes (always true for this model) */
  isPhonemes: true;
  error?: string;
}

export const transcribeAudio = async (uri: string): Promise<STTResponse> => {
  try {
    const engine = await initSttEngine();
    
    // In React Native Expo, the URI is often a file:// path.
    // Sherpa-ONNX transcribeFile expects an absolute file path without the file:// prefix on some platforms.
    const filePath = uri.replace(/^file:\/\//, '');

    const result = await engine.transcribeFile(filePath);

    // The result.text is the transcribed phonemes separated by whatever tokenizer format it is in.
    return { 
      text: result.text.trim(), 
      isPhonemes: true 
    };
  } catch (error: any) {
    return {
      text: '',
      isPhonemes: true,
      error: error.message || 'Failed to transcribe audio locally',
    };
  }
};
