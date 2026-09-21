/**
 * quranPhonemes.ts
 *
 * Fetches and caches the canonical Ḥafṣ phoneme table from
 * Muno459/zipformer_p-quran (quran_text2phoneme.json).
 *
 * The table maps every ayah key ("1:1", "2:255", etc.) to its
 * deterministic phoneme string — the gold standard we compare
 * the model's output against to catch Tajweed mistakes.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PHONEME_TABLE_URL =
  'https://huggingface.co/Muno459/zipformer_p-quran/resolve/main/quran_text2phoneme.json';

const CACHE_KEY = 'quran_phoneme_table_v1';

let _tableCache: Record<string, string> | null = null;

/**
 * Returns the phoneme table, loading from AsyncStorage or network as needed.
 * Structure: { "1:1": "b i s m i ..." , "2:255": "aallaaahu ..." , ... }
 */
export async function getPhonemeTable(): Promise<Record<string, string>> {
  if (_tableCache) return _tableCache;

  // Try disk cache first
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      _tableCache = JSON.parse(cached);
      return _tableCache!;
    }
  } catch {
    // ignore
  }

  // Fetch from HuggingFace
  const res = await fetch(PHONEME_TABLE_URL);
  if (!res.ok) throw new Error(`[quranPhonemes] HTTP ${res.status} fetching phoneme table`);
  const table: Record<string, string> = await res.json();
  _tableCache = table;

  // Persist to disk (fire-and-forget, best-effort)
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(table)).catch(() => {});

  return table;
}

/**
 * Returns the canonical phoneme string for a given ayah key.
 * Returns null if the ayah is not found in the table.
 */
export async function getCanonicalPhonemes(verseKey: string): Promise<string | null> {
  const table = await getPhonemeTable();
  return table[verseKey] ?? null;
}

/**
 * Find the best-matching ayah key in the phoneme table for a predicted phoneme string.
 * Uses character-level edit-distance ratio (fast approximation).
 * Used when we don't know which specific ayah was recited.
 */
export function findBestAyah(
  predictedPhonemes: string,
  table: Record<string, string>,
  topK = 1
): { verseKey: string; score: number }[] {
  const pred = predictedPhonemes.trim().toLowerCase();

  const results: { verseKey: string; score: number }[] = [];

  for (const [key, canonical] of Object.entries(table)) {
    const score = jaccardSimilarity(pred, canonical.toLowerCase());
    results.push({ verseKey: key, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/));
  const setB = new Set(b.split(/\s+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}
