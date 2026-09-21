/**
 * quranApi.ts
 *
 * Uses the official @quranjs/api SDK with `createPublicClient` (browser/mobile entrypoint).
 *
 * Auth Strategy:
 *  - `clientId` is safe to expose in the mobile app (just an identifier, not a secret).
 *  - `clientSecret` NEVER leaves the server — it stays in our Supabase Edge Function.
 *  - The public client handles all content (chapters, verses, audio, tafsirs) without a secret.
 *  - For authenticated user actions (bookmarks, notes, goals), we use our edge function token.
 *
 * API Docs: https://api-docs.quran.foundation/docs/sdk/javascript
 */

import { createPublicClient } from '@quranjs/api/public';
import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';

const CLIENT_ID = process.env.QURAN_CLIENT_ID ?? 'bfdcb229-7da7-4325-a3d1-e7d12f2a0b78';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ─── App Token Cache ──────────────────────────────────────────────────────────
const QURAN_API = 'https://api.quran.com/api/v4';
const R2_BASE_URL = 'https://pub-33f8115fd19a4e27a68740a321f72e2d.r2.dev/quran-data';
let cachedBearerToken: string | null = null;

const getBearerToken = async (): Promise<string> => {
  if (cachedBearerToken) return cachedBearerToken;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return '';
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/quran-token`, {
      headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) throw new Error(`quran-token: ${res.status}`);
    const data = await res.json();
    cachedBearerToken = data.access_token ?? '';
    return cachedBearerToken ?? '';
  } catch (err) {
    return '';
  }
};

// ─── SDK Client ───────────────────────────────────────────────────────────────
// createPublicClient is the correct entrypoint for mobile apps.
export const quranClient = createPublicClient({
  clientId: CLIENT_ID,
  clientType: 'public',
  defaults: { language: 'en' as any },
});

// ─── Chapter helpers ──────────────────────────────────────────────────────────

/** Returns all 114 chapters with names, verse counts, and revelation info. */
export const fetchChapters = async (language: string = 'en') => {
  try {
    const res = await fetch(`${QURAN_API}/chapters?language=${language}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
};

/** Returns detailed intro info for a single chapter. */
export const fetchChapterInfo = async (chapterId: number, language: string = 'en') => {
  try {
    const res = await fetch(`${QURAN_API}/chapters/${chapterId}/info?language=${language}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
};

// ─── Verse helpers ────────────────────────────────────────────────────────────

export interface FetchVersesOptions {
  language?: string;
  words?: boolean;
  translations?: number[];
  tafsirs?: number[];
  audio?: number;
  page?: number;
  perPage?: number;
}

const buildVerseQueryParams = (options: FetchVersesOptions) => {
  const params = new URLSearchParams();
  params.append('language', options.language ?? 'en');
  params.append('words', String(options.words ?? true));
  if (options.translations?.length) params.append('translations', options.translations.join(','));
  if (options.tafsirs?.length) params.append('tafsirs', options.tafsirs.join(','));
  if (options.audio) params.append('audio', String(options.audio));
  if (options.page) params.append('page', String(options.page));
  if (options.perPage) params.append('per_page', String(options.perPage));
  params.append('fields', 'text_uthmani,text_uthmani_tajweed');
  params.append('word_fields', 'text_uthmani,text_uthmani_tajweed');
  return params.toString();
};

/** Paginated verses for a chapter. Reads from local preload cache first. */
export const fetchVersesByChapter = async (
  chapterNumber: number,
  options: FetchVersesOptions = {}
) => {
  // ── 1. Try local preloaded file ──────────────────────────────────────────
  // quranPreload.ts saves full surah data to documentDirectory/quran/surah_{n}.json
  try {
    const localPath = `${FileSystem.documentDirectory}quran/surah_${chapterNumber}.json`;
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) {
      const raw = await FileSystem.readAsStringAsync(localPath);
      const data = JSON.parse(raw);
      // Local file has ALL verses — apply pagination in memory if needed
      if (data?.verses) {
        const perPage = options.perPage ?? 20;
        const pageNum = options.page ?? 1;
        const start = (pageNum - 1) * perPage;
        const slice = data.verses.slice(start, start + perPage);
        return {
          verses: slice,
          pagination: {
            current_page: pageNum,
            per_page: perPage,
            total_pages: Math.ceil(data.verses.length / perPage),
            total_records: data.verses.length,
          },
        };
      }
    }
  } catch (_) {
    // fall through to network
  }

  // ── 2. Network fallback ──────────────────────────────────────────────────
  try {
    const qs = buildVerseQueryParams(options);
    const res = await fetch(`${QURAN_API}/verses/by_chapter/${chapterNumber}?${qs}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
};

/** Fetch a single verse by its key (e.g. "2:255"). */
export const fetchVerseByKey = async (verseKey: string, options: FetchVersesOptions = {}) => {
  try {
    const qs = buildVerseQueryParams(options);
    const res = await fetch(`${QURAN_API}/verses/by_key/${verseKey}?${qs}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
};

/** Fetch a random verse. Great for "Verse of the Day" features. */
export const fetchRandomVerse = async (options: FetchVersesOptions = {}) => {
  try {
    const qs = buildVerseQueryParams(options);
    const res = await fetch(`${QURAN_API}/verses/random?${qs}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
};

const pageCache = new Map<number, any>();
let quranDirExists = false;

/** Fetch verses by Mushaf page number (1–604). */
export const fetchVersesByPage = async (pageNumber: number, options: FetchVersesOptions = {}) => {
  if (pageCache.has(pageNumber)) {
    return pageCache.get(pageNumber);
  }

  try {
    const dir = `${FileSystem.documentDirectory}quran`;
    const filePath = `${dir}/page_${pageNumber}.json`;
    
    // 1. Try to load from local cache first
    if (!quranDirExists) {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      }
      quranDirExists = true;
    }
    
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      const fileContent = await FileSystem.readAsStringAsync(filePath);
      const data = JSON.parse(fileContent);
      pageCache.set(pageNumber, data);
      return data;
    }
    
    // 2. Fallback to Cloudflare R2 CDN
    const res = await fetch(`${R2_BASE_URL}/${pageNumber}.json`);
    if (!res.ok) {
      // 3. Last resort fallback to Supabase if R2 fails
      const { data, error } = await supabase
        .from('quran_pages')
        .select('verses_json')
        .eq('page_number', pageNumber)
        .single();
        
      if (error || !data) throw new Error(`HTTP ${res.status}`);
      pageCache.set(pageNumber, data.verses_json);
      return data.verses_json;
    }
    
    const data = await res.json();
    
    // Cache it locally so it's instant next time
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data));
    
    pageCache.set(pageNumber, data);
    return data;
  } catch (err) {
    return null;
  }
};

/** Fetch verses by Juz number (1–30). */
export const fetchVersesByJuz = async (juzNumber: number, options: FetchVersesOptions = {}) => {
  try {
    const qs = buildVerseQueryParams(options);
    const res = await fetch(`${QURAN_API}/verses/by_juz/${juzNumber}?${qs}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
};

/** Fetch verses by a range of verse keys (e.g. from "2:1" to "2:10"). */
export const fetchVersesByRange = async (
  from: string,
  to: string,
  options: FetchVersesOptions = {}
) => {
  try {
    const qs = buildVerseQueryParams(options);
    const res = await fetch(`${QURAN_API}/verses/by_range?from=${from}&to=${to}&${qs}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
};

// ─── Audio helpers (direct REST — SDK audio endpoints are server-only) ────────



/** Returns the single audio file URL for a full chapter by a specific reciter. */
export const fetchChapterRecitations = async (recitationId: number, chapterNumber: number) => {
  try {
    const res = await fetch(
      `${QURAN_API}/chapter_recitations/${recitationId}/${chapterNumber}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
};

/** Returns verse-by-verse audio files for a chapter (for synchronized highlighting). */
export const fetchVerseRecitationsByChapter = async (
  chapterId: number,
  recitationId: number | string
) => {
  try {
    if (typeof recitationId === 'string') {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${chapterId}/${recitationId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      // AlQuran.cloud returns a different structure. We map it to look like Quran.com v4.
      return {
        audio_files: data.data.ayahs.map((ayah: any) => ({
          url: ayah.audio, // Note: this is a full URL, not a relative path
        }))
      };
    } else {
      const res = await fetch(
        `${QURAN_API}/recitations/${recitationId}/by_chapter/${chapterId}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    }
  } catch (err) {
    return null;
  }
};

/** Returns all available reciters from both Quran.com and QuranicAudio APIs. */
export const fetchRecitations = async () => {
  try {
    const res = await fetch(`${QURAN_API}/resources/recitations?language=en`);
    let quranComRecitations: any[] = [];
    if (res.ok) {
      const data = await res.json();
      quranComRecitations = data.recitations || [];
    }

    let qaRecitations: any[] = [];
    const qaRes = await fetch('https://quranicaudio.com/api/qaris');
    if (qaRes.ok) {
      const qaData = await qaRes.json();
      // section_id 1 is Hafs. 2 is Taraweeh. 3 is other Qira'at (Warsh, etc). 4 is translations.
      qaRecitations = qaData
        .filter((q: any) => q.section_id === 1)
        .map((q: any) => ({
          id: `qa.${q.id}`,
          reciter_name: q.name,
          style: null,
          translated_name: { name: q.name, language_name: 'english' },
          quranicAudioPath: q.relative_path.replace('/mp3/', '').replace('/', ''),
          isChapterOnly: true,
        }));
    }

    // Filter out low-quality / non-reciter items from QA
    qaRecitations = qaRecitations.filter((q: any) => {
      const lower = (q.reciter_name || '').toLowerCase();
      if (lower.includes('taraweeh')) return false;
      if (lower.includes('partial')) return false;
      if (lower.includes('assorted')) return false;
      // Drop year-range variants like [1422-1423], [1426-1427]
      if (/\[\d{4}(-\d{4})?\]/.test(q.reciter_name || '')) return false;
      return true;
    });

    // From QDC, also drop entries that are purely year-range variants like [1422-1423]
    // (They show up as duplicate reciters with e.g. Maher al-Muaiqly [1422-1423])
    quranComRecitations = quranComRecitations.filter((r: any) => {
      const name = r.reciter_name || '';
      // If the bracketed portion contains ONLY numbers, year ranges, or "Assorted"
      const bracketContent = name.match(/\[([^\]]*)\]/);
      if (bracketContent) {
        const inner = bracketContent[1].trim();
        // pure year range like "1422-1423" or "1426-1427" or "Soosi, 2020"
        if (/^\d{4}(-\d{4})?$/.test(inner) || /\d{4}/.test(inner) && inner.includes(',')) {
          return false;
        }
        // Assorted
        if (inner.toLowerCase().includes('assorted')) return false;
      }
      return true;
    });

    let allReciters = [...quranComRecitations, ...qaRecitations];

    // Build display name: fold style into name for QDC reciters
    allReciters = allReciters.map(r => {
      let displayName = r.reciter_name || '';
      if (r.style && r.style.trim() !== '') {
        if (!displayName.toLowerCase().includes(r.style.toLowerCase())) {
          displayName = `${displayName} (${r.style})`;
        }
      }
      displayName = displayName.replace(/\s+/g, ' ').trim();
      // "Cleanliness" score: lower = cleaner name (no brackets / parentheses)
      const score = (displayName.includes('[') || displayName.includes('(')) ? 1 : 0;
      return { ...r, reciter_name: displayName, style: null, _score: score };
    });

    // Sort cleaner names first so dedup keeps the best version
    allReciters.sort((a, b) => {
      if (a._score !== b._score) return a._score - b._score;
      return a.reciter_name.localeCompare(b.reciter_name);
    });

    // Deduplicate: normalise to letters + brackets only, keep first (cleanest) occurrence
    const seenNames = new Set<string>();
    allReciters = allReciters.filter(r => {
      // Strip non-alpha except brackets so "Khalil / Khaleel" variants collapse
      const key = r.reciter_name.toLowerCase().replace(/[^a-z()]/g, '');
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    });

    // Clean up internal score field
    allReciters = allReciters.map(({ _score: _, ...r }) => r);

    // Final alphabetical sort
    allReciters.sort((a, b) => a.reciter_name.localeCompare(b.reciter_name));

    return { recitations: allReciters };
  } catch (err) {
    return null;
  }
};

// ─── Resource helpers (translations, tafsirs) ─────────────────────────────────

/** Returns a list of all available translations with their IDs and languages. */
export const fetchTranslations = async (language: string = 'en') => {
  try {
    const res = await fetch(`${QURAN_API}/resources/translations?language=${language}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
};

/** Returns a list of all available tafsirs with their IDs and languages. */
export const fetchTafsirs = async (language: string = 'en') => {
  try {
    const res = await fetch(`${QURAN_API}/resources/tafsirs?language=${language}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
};

/** Returns the list of all 30 Juzs. */
export const fetchJuzs = async () => {
  try {
    return await (quranClient.content.v4.juzs as any).list();
  } catch (err) {
    return null;
  }
};

// Re-export for edge cases that still need a raw Bearer token (e.g. user-auth calls).
export { getBearerToken };

// ─── Tafsir helpers ───────────────────────────────────────────────────────────

/**
 * Fetches tafsir text for a single verse.
 * tafsirId 169 = Tafsir Ibn Kathir (English) — a common scholarly default.
 */
export const fetchTafsirByAyah = async (verseKey: string, tafsirId: number = 169) => {
  try {
    const res = await fetch(`${QURAN_API}/tafsirs/${tafsirId}/by_ayah/${verseKey}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
};

// ─── Search helpers ───────────────────────────────────────────────────────────

/**
 * Search the Quran by keyword in a given translation.
 * translationId 85 = Saheeh International (English)
 */
export const fetchSearchResults = async (
  query: string,
  translationId: number = 85,
  page: number = 1,
  size: number = 20
) => {
  // If the query contains Arabic characters, try offline local search first
  const isArabic = /[\u0600-\u06FF]/.test(query);
  if (isArabic) {
    try {
      const quranDir = `${FileSystem.documentDirectory}quran`;
      const searchRes: any[] = [];
      const qLower = query.trim().toLowerCase();
      // Sequential scan of 114 surahs - might be slightly slow on slow devices, but works completely offline
      for (let s = 1; s <= 114; s++) {
        const localPath = `${quranDir}/surah_${s}.json`;
        const info = await FileSystem.getInfoAsync(localPath);
        if (!info.exists) continue; // fallback to network if not fully downloaded
        
        const raw = await FileSystem.readAsStringAsync(localPath);
        const data = JSON.parse(raw);
        if (data?.verses) {
          for (const v of data.verses) {
            const txt = v.text_uthmani || v.text_imlaei || '';
            // Basic matching - could be improved by stripping diacritics
            if (txt.includes(qLower)) {
              searchRes.push({
                verse_key: v.verse_key,
                text: txt,
                translations: [] // Local data lacks translations by default
              });
            }
          }
        }
      }
      
      if (searchRes.length > 0) {
        // Paginate the local results
        const start = (page - 1) * size;
        const slice = searchRes.slice(start, start + size);
        return {
          search: {
            query,
            total_results: searchRes.length,
            total_pages: Math.ceil(searchRes.length / size),
            current_page: page,
            results: slice
          }
        };
      }
    } catch (_) {
      // ignore and fallback to API
    }
  }

  try {
    const params = new URLSearchParams({
      q: query,
      translations: String(translationId),
      page: String(page),
      size: String(size),
    });
    const res = await fetch(`${QURAN_API}/search?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
};

// ─── Juz helpers ──────────────────────────────────────────────────────────────

/** Returns all 30 Juzs with verse ranges and page numbers. */
export const fetchJuzList = async () => {
  try {
    const res = await fetch(`${QURAN_API}/juzs`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
};
