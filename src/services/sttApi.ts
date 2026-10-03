/**
 * sttApi.ts — Zipformer Phoneme STT (Offline)
 *
 * Uses Muno459/zipformer_p-quran via react-native-sherpa-onnx.
 *
 * Model files expected at: assets/models/
 *   - model.int8.onnx   (renamed from quran_phoneme_zipformer_int8.onnx)
 *   - tokens.txt
 *
 * The model is a CTC phoneme recogniser — it outputs space-separated
 * phoneme units (250-unit Ḥafṣ tokenizer):
 *   "b i s m i l l aah i r r a H m aah n i r r a H iy m i"
 *
 * IMPORTANT:
 *  - Input audio MUST be WAV/PCM (16-bit, 16 kHz, mono).
 *  - sherpa-onnx cannot decode AAC/m4a on-device on iOS.
 *  - createSTT lives in 'react-native-sherpa-onnx/stt', not the root package.
 *
 * NOTE: react-native-sherpa-onnx depends on @dr.pogodin/react-native-fs which
 * requires a native module (ReactNativeFs) that must be present in the build.
 * We lazy-import it to avoid crashing at module load time.
 */

export interface STTResponse {
  /** The predicted phoneme string, space-separated */
  text: string;
  /** Always true for this model */
  isPhonemes: true;
  error?: string;
}

export const transcribeAudio = async (uri: string): Promise<STTResponse> => {
  let engine: any = null;
  try {
    // Lazy import — 'react-native-sherpa-onnx' root does NOT export createSTT.
    // It lives exclusively in the 'stt' submodule.
    // @ts-ignore
    const { createSTT } = await import('react-native-sherpa-onnx/stt');

    engine = await createSTT({
      modelPath: { type: 'asset', path: 'models' },
      modelType: 'zipformer_ctc',
      preferInt8: true,
    });

    // sherpa-onnx expects an absolute file path, not a file:// URI
    const filePath = uri.startsWith('file://') ? uri.slice(7) : uri;

    const result = await engine.transcribeFile(filePath);

    return {
      text: (result.text ?? '').trim(),
      isPhonemes: true,
    };
  } catch (error: any) {
    return {
      text: '',
      isPhonemes: true,
      error: error?.message ?? 'Failed to transcribe audio locally',
    };
  } finally {
    // Always free native resources after each transcription
    if (engine) {
      try { await engine.destroy(); } catch (_) {}
    }
  }
};
