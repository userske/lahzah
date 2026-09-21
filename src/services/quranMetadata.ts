/**
 * quranMetadata.ts
 *
 * Offline-first metadata service backed by Tarteel QUL datasets.
 * All data is bundled with the app — zero network calls, zero latency.
 *
 * Datasets (assets/quran-metadata/):
 *   surah_names  – 114 surahs  (name, name_arabic, verses_count, revelation_place…)
 *   juz          – 30 juzs     (first/last verse keys, verse mappings)
 *   hizb         – 60 hizbs
 *   rub          – 240 rubs (rub al-hizb)
 *   manzil       – 7 manzils
 *   ruku         – 558 rukus
 *   sajda        – 15 sajda verses (required / optional)
 */

// ─── Raw data imports ─────────────────────────────────────────────────────────
import surahNamesRaw  from '../../assets/quran-metadata/surah_names.json';
import juzRaw         from '../../assets/quran-metadata/juz.json';
import hizbRaw        from '../../assets/quran-metadata/hizb.json';
import rubRaw         from '../../assets/quran-metadata/rub.json';
import manzilRaw      from '../../assets/quran-metadata/manzil.json';
import rukuRaw        from '../../assets/quran-metadata/ruku.json';
import sajdaRaw       from '../../assets/quran-metadata/sajda.json';

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface SurahInfo {
  id: number;
  name: string;
  name_simple: string;
  name_arabic: string;
  revelation_order: number;
  revelation_place: 'makkah' | 'madinah';
  verses_count: number;
  bismillah_pre: boolean;
}

export interface JuzInfo {
  juz_number: number;
  verses_count: number;
  first_verse_key: string;
  last_verse_key: string;
  verse_mapping: Record<string, string>;
}

export interface HizbInfo {
  hizb_number: number;
  verses_count: number;
  first_verse_key: string;
  last_verse_key: string;
}

export interface RubInfo {
  rub_number: number;
  verses_count: number;
  first_verse_key: string;
  last_verse_key: string;
}

export interface ManzilInfo {
  manzil_number: number;
  verses_count: number;
  first_verse_key: string;
  last_verse_key: string;
}

export interface RukuInfo {
  ruku_number: number;
  surah_ruku_number: number;
  verses_count: number;
  first_verse_key: string;
  last_verse_key: string;
}

export interface SajdaInfo {
  sajdah_number: number;
  verse_key: string;
  sajdah_type: 'required' | 'optional';
}

export interface VerseMetadata {
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  juzNumber: number;
  hizbNumber: number;
  rubNumber: number;
  manzilNumber: number;
  rukuNumber: number;
  sajda: SajdaInfo | null;
}

// ─── Build lookup maps (runs once on import) ──────────────────────────────────

const parseKey = (key: string): { surah: number; ayah: number } => {
  const [s, a] = key.split(':').map(Number);
  return { surah: s, ayah: a };
};

const cmpKey = (a: string, b: string): number => {
  const pa = parseKey(a), pb = parseKey(b);
  if (pa.surah !== pb.surah) return pa.surah - pb.surah;
  return pa.ayah - pb.ayah;
};

export const SURAHS: Record<number, SurahInfo> = surahNamesRaw as any;

const juzData: Record<string, JuzInfo> = juzRaw as any;
const JUZ_LIST: JuzInfo[] = Object.values(juzData).sort((a, b) => a.juz_number - b.juz_number);

const hizbData: Record<string, HizbInfo> = hizbRaw as any;
const HIZB_LIST: HizbInfo[] = Object.values(hizbData).sort((a, b) => a.hizb_number - b.hizb_number);

const rubData: Record<string, RubInfo> = rubRaw as any;
const RUB_LIST: RubInfo[] = Object.values(rubData).sort((a, b) => a.rub_number - b.rub_number);

const manzilData: Record<string, ManzilInfo> = manzilRaw as any;
const MANZIL_LIST: ManzilInfo[] = Object.values(manzilData).sort((a, b) => a.manzil_number - b.manzil_number);

const rukuData: Record<string, RukuInfo> = rukuRaw as any;
const RUKU_LIST: RukuInfo[] = Object.values(rukuData).sort((a, b) => a.ruku_number - b.ruku_number);

const sajdaData: Record<string, SajdaInfo> = sajdaRaw as any;
const SAJDA_BY_KEY: Record<string, SajdaInfo> = {};
Object.values(sajdaData).forEach(s => { SAJDA_BY_KEY[s.verse_key] = s; });

function findRange<T extends { first_verse_key: string; last_verse_key: string }>(
  list: T[],
  verseKey: string
): T | null {
  let lo = 0, hi = list.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const item = list[mid];
    if (cmpKey(verseKey, item.first_verse_key) < 0) {
      hi = mid - 1;
    } else if (cmpKey(verseKey, item.last_verse_key) > 0) {
      lo = mid + 1;
    } else {
      return item;
    }
  }
  return list.find(
    item =>
      cmpKey(verseKey, item.first_verse_key) >= 0 &&
      cmpKey(verseKey, item.last_verse_key) <= 0
  ) ?? null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const getSurah = (surahNumber: number): SurahInfo | null =>
  SURAHS[surahNumber] ?? null;

export const getJuzForVerse = (verseKey: string): JuzInfo | null =>
  findRange(JUZ_LIST, verseKey);

export const getHizbForVerse = (verseKey: string): HizbInfo | null =>
  findRange(HIZB_LIST, verseKey);

export const getRubForVerse = (verseKey: string): RubInfo | null =>
  findRange(RUB_LIST, verseKey);

export const getManzilForVerse = (verseKey: string): ManzilInfo | null =>
  findRange(MANZIL_LIST, verseKey);

export const getRukuForVerse = (verseKey: string): RukuInfo | null =>
  findRange(RUKU_LIST, verseKey);

export const getSajdaForVerse = (verseKey: string): SajdaInfo | null =>
  SAJDA_BY_KEY[verseKey] ?? null;

export const isRukuStart = (verseKey: string): boolean =>
  RUKU_LIST.some(r => r.first_verse_key === verseKey);

export const isHizbStart = (verseKey: string): boolean =>
  HIZB_LIST.some(h => h.first_verse_key === verseKey);

export const isRubStart = (verseKey: string): boolean =>
  RUB_LIST.some(r => r.first_verse_key === verseKey);

export const isJuzStart = (verseKey: string): boolean =>
  JUZ_LIST.some(j => j.first_verse_key === verseKey);

export const isManzilStart = (verseKey: string): boolean =>
  MANZIL_LIST.some(m => m.first_verse_key === verseKey);

export const getVerseMetadata = (verseKey: string): VerseMetadata => {
  const { surah, ayah } = parseKey(verseKey);
  return {
    verseKey,
    surahNumber: surah,
    ayahNumber: ayah,
    juzNumber:    getJuzForVerse(verseKey)?.juz_number ?? 0,
    hizbNumber:   getHizbForVerse(verseKey)?.hizb_number ?? 0,
    rubNumber:    getRubForVerse(verseKey)?.rub_number ?? 0,
    manzilNumber: getManzilForVerse(verseKey)?.manzil_number ?? 0,
    rukuNumber:   getRukuForVerse(verseKey)?.ruku_number ?? 0,
    sajda:        getSajdaForVerse(verseKey),
  };
};

/**
 * Given the verse keys visible on a Mushaf page, returns header data:
 * the surah name (of the first verse) and juz number.
 */
export const getPageHeaderInfo = (
  verseKeys: string[]
): { surahName: string; surahArabic: string; juzNumber: number } | null => {
  if (!verseKeys.length) return null;
  const firstKey = verseKeys[0];
  const { surah: firstSurah } = parseKey(firstKey);
  const surahInfo = getSurah(firstSurah);
  const juzInfo   = getJuzForVerse(firstKey);
  if (!surahInfo || !juzInfo) return null;
  return {
    surahName:   surahInfo.name_simple,
    surahArabic: surahInfo.name_arabic,
    juzNumber:   juzInfo.juz_number,
  };
};

// ─── Exported lists ───────────────────────────────────────────────────────────
export const ALL_SURAHS  = Object.values(SURAHS) as SurahInfo[];
export const ALL_JUZS    = JUZ_LIST;
export const ALL_HIZBS   = HIZB_LIST;
export const ALL_RUBS    = RUB_LIST;
export const ALL_MANZILS = MANZIL_LIST;
export const ALL_RUKUS   = RUKU_LIST;
export const ALL_SAJDAS  = Object.values(sajdaData) as SajdaInfo[];
