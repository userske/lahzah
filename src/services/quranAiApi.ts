/**
 * quranAiApi.ts — Phoneme-based Tajweed analysis
 *
 * Pipeline:
 *  1. Record audio → sttApi.ts → Muno459/zipformer_p-quran
 *     The model returns a space-separated phoneme string (NOT Arabic text).
 *
 *  2. Load canonical phonemes for the target ayah from quranPhonemes.ts
 *     (quran_text2phoneme.json, cached locally after first fetch).
 *
 *  3. quranDiff.ts → Needleman-Wunsch global alignment on phoneme tokens.
 *     Deviations are classified: madd_omitted, wrong_phoneme, missing, extra.
 *
 *  4. Return structured deviations + 0-100 accuracy score for the UI.
 *
 * If no reference verse is given we use Jaccard similarity on phonemes to
 * find the best-matching ayah in the 9,100-entry canonical table.
 */

import { transcribeAudio } from './sttApi';
import { comparePhonemes } from './quranDiff';
import { getPhonemeTable, getCanonicalPhonemes, findBestAyah } from './quranPhonemes';

export interface AnalyzeAudioParams {
  uri: string;
  /** Specific ayah key "2:255" or surah number "2" for auto-detect */
  reference?: string;
}

export interface TajweedAnalysisResult {
  /** 0–100 phoneme accuracy score */
  score: number;
  /** Ayah key that was analysed, e.g. "1:1" */
  verseKey: string;
  /** List of deviations to render in the UI */
  deviations: Array<{
    index: number;
    canonical: string;
    predicted: string | null;
    flag: string;
    label: string;
  }>;
  /** Raw predicted phonemes from the model */
  predictedPhonemes: string;
  /** Canonical Ḥafṣ phonemes for the ayah */
  canonicalPhonemes: string;
}

export const analyzeAudioWithAI = async ({
  uri,
  reference,
}: AnalyzeAudioParams): Promise<TajweedAnalysisResult> => {
  // ── Step 1: Transcribe to phonemes ────────────────────────────────────────
  const sttRes = await transcribeAudio(uri);

  if (sttRes.error) {
    throw new Error(sttRes.error);
  }

  const predictedPhonemes = sttRes.text;

  // ── Step 2: Get canonical phonemes ────────────────────────────────────────
  let canonicalPhonemes: string | null = null;
  let verseKey = '';

  if (reference && reference.includes(':')) {
    // Exact ayah key provided — direct lookup
    verseKey = reference;
    canonicalPhonemes = await getCanonicalPhonemes(verseKey);

    if (!canonicalPhonemes) {
      throw new Error(`Phoneme data not found for ${verseKey}`);
    }
  } else {
    // Auto-detect: find nearest ayah in canonical table
    const table = await getPhonemeTable();

    // Narrow scope if a surah is given
    let searchTable = table;
    if (reference) {
      const prefix = `${reference}:`;
      searchTable = Object.fromEntries(
        Object.entries(table).filter(([k]) => k.startsWith(prefix))
      );
    }

    const [best] = findBestAyah(predictedPhonemes, searchTable);
    if (!best || best.score === 0) {
      throw new Error('Could not match recitation to any known ayah');
    }

    verseKey = best.verseKey;
    canonicalPhonemes = table[verseKey];
  }

  // ── Step 3: Phoneme-level diff ────────────────────────────────────────────
  const { deviations, score } = comparePhonemes(predictedPhonemes, canonicalPhonemes!);


  return {
    score,
    verseKey,
    deviations,
    predictedPhonemes,
    canonicalPhonemes: canonicalPhonemes!,
  };
};
