/**
 * quranDiff.ts — Phoneme-level Tajweed diff
 *
 * Now driven by Muno459/zipformer_p-quran, which outputs space-separated
 * phoneme units (250-unit Ḥafṣ tokenizer) instead of Arabic words.
 *
 * comparePhonemes() aligns predicted phonemes against the canonical string
 * from quran_text2phoneme.json and returns structured deviations the UI can
 * highlight with a human-readable Tajweed rule name.
 *
 * The old compareAyah / normalizeArabic exports are kept for any callers
 * that still reference them, but they are no longer used in the main pipeline.
 */

export interface DiffResult {
  word: string;
  isCorrect: boolean;
  isMissing: boolean;
}

/** @deprecated — Arabic text diff, kept for backwards-compat only */
export const normalizeArabic = (text: string) => {
  return text
    .replace(/[\u0617-\u061A\u064B-\u0652]/g, '') // Remove tashkeel
    .replace(/[أإآ]/g, 'ا') // Normalize alef
    .replace(/ة/g, 'ه') // Normalize teh marbuta
    .replace(/ي/g, 'ى'); // Normalize yeh
};

/** @deprecated — Word-level text diff, kept for backwards-compat only */
export const compareAyah = (transcribedText: string, actualAyahText: string): DiffResult[] => {
  const actualWords = actualAyahText.trim().split(/\s+/);
  const transcribedWords = transcribedText.trim().split(/\s+/);
  const results: DiffResult[] = [];
  for (let i = 0; i < actualWords.length; i++) {
    const actualWord = actualWords[i];
    const transcribedWord = transcribedWords[i];
    if (!transcribedWord) {
      results.push({ word: actualWord, isCorrect: false, isMissing: true });
      continue;
    }
    const normActual = normalizeArabic(actualWord);
    const normTranscribed = normalizeArabic(transcribedWord);
    results.push({ word: actualWord, isCorrect: normActual === normTranscribed, isMissing: false });
  }
  return results;
};

// ─── Phoneme diff ─────────────────────────────────────────────────────────────

export type TajweedFlag =
  | 'madd_omitted'      // Long vowel shortened
  | 'madd_added'        // Short vowel lengthened
  | 'wrong_phoneme'     // Substituted phoneme
  | 'missing_phoneme'   // Dropped phoneme (e.g. ikhfā omission)
  | 'extra_phoneme'     // Inserted phoneme
  | 'correct';

export interface PhonemeDeviation {
  /** Token index in canonical sequence */
  index: number;
  canonical: string;
  predicted: string | null; // null if missing
  flag: TajweedFlag;
  /** Human-readable Tajweed rule explanation */
  label: string;
}

export interface PhonemeDiffResult {
  deviations: PhonemeDeviation[];
  /** 0–100 accuracy score: (correct / canonical total) × 100 */
  score: number;
}

// ── Madd phonemes in the 250-unit tokenizer (long vowels) ────────────────────
const MADD_PHONEMES = new Set(['aah', 'iy', 'uw', 'aa', 'ii', 'uu']);

function classifyDeviation(canonical: string, predicted: string | null): TajweedFlag {
  if (!predicted) return 'missing_phoneme';
  if (canonical === predicted) return 'correct';
  if (MADD_PHONEMES.has(canonical) && !MADD_PHONEMES.has(predicted)) return 'madd_omitted';
  if (!MADD_PHONEMES.has(canonical) && MADD_PHONEMES.has(predicted)) return 'madd_added';
  return 'wrong_phoneme';
}

function labelForFlag(flag: TajweedFlag, canonical: string, predicted: string | null): string {
  switch (flag) {
    case 'madd_omitted':
      return `Madd omitted on "${canonical}" → recited as "${predicted}"`;
    case 'madd_added':
      return `Unnecessary lengthening: "${predicted}" should be short "${canonical}"`;
    case 'missing_phoneme':
      return `Missing phoneme: "${canonical}" was not recited`;
    case 'extra_phoneme':
      return `Extra phoneme "${predicted}" inserted`;
    case 'wrong_phoneme':
      return `Wrong phoneme: said "${predicted}", should be "${canonical}"`;
    default:
      return 'Correct';
  }
}

/**
 * comparePhonemes — Core Tajweed diff
 *
 * Runs a greedy token-level alignment between the predicted and canonical
 * phoneme sequences using Needleman-Wunsch (global alignment) so insertions
 * and deletions are handled correctly.
 */
export function comparePhonemes(
  predicted: string,
  canonical: string
): PhonemeDiffResult {
  const predTokens = predicted.trim().split(/\s+/).filter(Boolean);
  const canTokens = canonical.trim().split(/\s+/).filter(Boolean);

  // ── Needleman-Wunsch global alignment ────────────────────────────────────
  const GAP = -1;
  const MATCH = 2;
  const MISMATCH = -1;

  const M = canTokens.length;
  const N = predTokens.length;

  // dp[i][j] = best score aligning canTokens[0..i-1] with predTokens[0..j-1]
  const dp: number[][] = Array.from({ length: M + 1 }, (_, i) =>
    Array.from({ length: N + 1 }, (__, j) => (i === 0 ? j * GAP : j === 0 ? i * GAP : 0))
  );

  for (let i = 1; i <= M; i++) {
    for (let j = 1; j <= N; j++) {
      const sim = canTokens[i - 1] === predTokens[j - 1] ? MATCH : MISMATCH;
      dp[i][j] = Math.max(
        dp[i - 1][j - 1] + sim,
        dp[i - 1][j] + GAP,  // gap in predicted (missing phoneme)
        dp[i][j - 1] + GAP   // gap in canonical (extra phoneme)
      );
    }
  }

  // Traceback
  const alignment: { can: string | null; pred: string | null }[] = [];
  let i = M, j = N;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const sim = canTokens[i - 1] === predTokens[j - 1] ? MATCH : MISMATCH;
      if (dp[i][j] === dp[i - 1][j - 1] + sim) {
        alignment.unshift({ can: canTokens[i - 1], pred: predTokens[j - 1] });
        i--; j--;
        continue;
      }
    }
    if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + GAP)) {
      alignment.unshift({ can: canTokens[i - 1], pred: null }); // missing phoneme
      i--;
    } else {
      alignment.unshift({ can: null, pred: predTokens[j - 1] }); // extra phoneme
      j--;
    }
  }

  // Build deviations list
  const deviations: PhonemeDeviation[] = [];
  let correctCount = 0;
  let canonicalIndex = 0;

  for (const pair of alignment) {
    if (pair.can === null) {
      // Extra phoneme inserted by reciter
      deviations.push({
        index: canonicalIndex,
        canonical: '',
        predicted: pair.pred,
        flag: 'extra_phoneme',
        label: labelForFlag('extra_phoneme', '', pair.pred),
      });
      continue;
    }

    const flag = classifyDeviation(pair.can, pair.pred);
    if (flag === 'correct') {
      correctCount++;
    } else {
      deviations.push({
        index: canonicalIndex,
        canonical: pair.can,
        predicted: pair.pred,
        flag,
        label: labelForFlag(flag, pair.can, pair.pred),
      });
    }
    canonicalIndex++;
  }

  const score = M === 0 ? 100 : Math.max(0, Math.round((correctCount / M) * 100));

  return { deviations, score };
}
