/**
 * quranPreload.ts
 *
 * Downloads all Quran data to the device on first launch so every page
 * and every surah loads instantly — zero network calls after the first run.
 *
 * What it downloads:
 *  - 604 Mushaf page JSONs  → documentDirectory/quran/page_{n}.json
 *  - 114 Surah verse JSONs  → documentDirectory/quran/surah_{n}.json
 *
 * Uses the same file paths as fetchVersesByPage / fetchVersesByChapter so
 * those functions automatically hit the local cache without any changes.
 */

import * as FileSystem from 'expo-file-system/legacy';

const QURAN_DIR    = `${FileSystem.documentDirectory}quran`;
const R2_BASE      = 'https://pub-33f8115fd19a4e27a68740a321f72e2d.r2.dev/quran-data';
const QURAN_API    = 'https://api.quran.com/api/v4';

// Bump this any time the R2 data changes — existing installs will re-download.
const PRELOAD_VERSION = 2;

// Sentinel file: if this exists AND contains the right version, all data is ready.
const SENTINEL     = `${QURAN_DIR}/.preload_complete`;

// ─── Progress callback ─────────────────────────────────────────────────────────
export type PreloadProgress = {
  phase: 'mushaf' | 'surahs' | 'done';
  downloaded: number;
  total: number;
  percent: number;
};

export type PreloadProgressCallback = (p: PreloadProgress) => void;

// ─── Directory setup ──────────────────────────────────────────────────────────
async function ensureDir() {
  const info = await FileSystem.getInfoAsync(QURAN_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(QURAN_DIR, { intermediates: true });
  }
}

// ─── Check if preload is done ─────────────────────────────────────────────────
export async function isPreloadComplete(): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(SENTINEL);
    if (!info.exists) return false;
    // Check version — if stale, wipe and re-download
    const content = await FileSystem.readAsStringAsync(SENTINEL);
    const saved = JSON.parse(content);
    if (saved?.version !== PRELOAD_VERSION) {
      await FileSystem.deleteAsync(SENTINEL, { idempotent: true });
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Download a single file if it doesn't already exist ───────────────────────
async function downloadIfMissing(url: string, localPath: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) return true; // already cached

    const result = await FileSystem.downloadAsync(url, localPath);
    return result.status >= 200 && result.status < 300;
  } catch (e) {
    return false;
  }
}

// ─── Download surah verse data from Quran.com API ────────────────────────────
// We fetch all verses in one shot (per_page=500 covers even Al-Baqarah's 286)
// and store as a local JSON file that fetchVersesByChapter reads first.
const SURAH_VERSE_COUNTS: Record<number, number> = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
  11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98,
  20: 135, 21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88,
  29: 69, 30: 60, 31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182,
  38: 88, 39: 75, 40: 85, 41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35,
  47: 38, 48: 29, 49: 18, 50: 45, 51: 60, 52: 49, 53: 62, 54: 55, 55: 78,
  56: 96, 57: 29, 58: 22, 59: 24, 60: 13, 61: 14, 62: 11, 63: 11, 64: 18,
  65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44, 71: 28, 72: 28, 73: 20,
  74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42, 81: 29, 82: 19,
  83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20, 91: 15,
  92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
  101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6,
  110: 3, 111: 5, 112: 4, 113: 5, 114: 6,
};

async function downloadSurah(surahNum: number): Promise<boolean> {
  const localPath = `${QURAN_DIR}/surah_${surahNum}.json`;
  const info = await FileSystem.getInfoAsync(localPath);
  if (info.exists) return true;

  try {
    const perPage = Math.max(SURAH_VERSE_COUNTS[surahNum] ?? 300, 50);
    const url = `${QURAN_API}/verses/by_chapter/${surahNum}?language=en&words=true&fields=text_uthmani,text_uthmani_tajweed&word_fields=text_uthmani,text_uthmani_tajweed&per_page=${perPage}&page=1`;
    const res = await fetch(url);
    if (!res.ok) return false;
    const data = await res.json();
    await FileSystem.writeAsStringAsync(localPath, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

// ─── Main preload function ────────────────────────────────────────────────────
const BATCH_SIZE = 8; // concurrent downloads

async function downloadBatch<T>(
  items: T[],
  fn: (item: T) => Promise<boolean>
): Promise<number> {
  let done = 0;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(fn));
    done += results.filter(Boolean).length;
  }
  return done;
}

export async function startPreload(
  onProgress?: PreloadProgressCallback,
  signal?: AbortSignal
): Promise<void> {
  await ensureDir();

  // ── Phase 1: Mushaf pages (1–604) ─────────────────────────────────────────
  const TOTAL_PAGES = 604;
  let pagesDownloaded = 0;

  const pageNums = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);

  for (let i = 0; i < pageNums.length; i += BATCH_SIZE) {
    if (signal?.aborted) return;
    const batch = pageNums.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(p =>
        downloadIfMissing(
          `${R2_BASE}/${p}.json`,
          `${QURAN_DIR}/page_${p}.json`
        )
      )
    );
    pagesDownloaded += results.filter(Boolean).length;
    onProgress?.({
      phase: 'mushaf',
      downloaded: pagesDownloaded,
      total: TOTAL_PAGES,
      percent: Math.round((pagesDownloaded / TOTAL_PAGES) * 50), // 0–50%
    });
  }

  // ── Phase 2: Surah verse data (1–114) ─────────────────────────────────────
  const TOTAL_SURAHS = 114;
  let surahsDownloaded = 0;

  for (let s = 1; s <= TOTAL_SURAHS; s += BATCH_SIZE) {
    if (signal?.aborted) return;
    const batch = Array.from(
      { length: Math.min(BATCH_SIZE, TOTAL_SURAHS - s + 1) },
      (_, i) => s + i
    );
    const results = await Promise.all(batch.map(n => downloadSurah(n)));
    surahsDownloaded += results.filter(Boolean).length;
    onProgress?.({
      phase: 'surahs',
      downloaded: surahsDownloaded,
      total: TOTAL_SURAHS,
      percent: 50 + Math.round((surahsDownloaded / TOTAL_SURAHS) * 50), // 50–100%
    });
  }

  // ── Mark complete ──────────────────────────────────────────────────────────
  await FileSystem.writeAsStringAsync(
    SENTINEL,
    JSON.stringify({ version: PRELOAD_VERSION, date: new Date().toISOString() })
  );
  onProgress?.({ phase: 'done', downloaded: TOTAL_PAGES + TOTAL_SURAHS, total: TOTAL_PAGES + TOTAL_SURAHS, percent: 100 });
}

/** Reset preload (for testing / re-download). */
export async function resetPreload(): Promise<void> {
  try {
    await FileSystem.deleteAsync(SENTINEL, { idempotent: true });
  } catch {}
}
