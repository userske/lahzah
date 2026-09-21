/**
 * useFeed.ts — Daily spiritual feed for Lahzah home screen
 *
 * Replaced third-party RSS feed with internal curated content.
 * Dua of the Day is deterministic based on the calendar date (same dua all day).
 * Ayah of the Day fetches from the Quran Foundation API.
 */
import { useEffect, useState } from 'react';
import { fetchRandomDua, type Dua } from '../services/ummahApi';
import { fetchVersesByChapter } from '../services/quranApi';

export interface FeedItem {
  type: 'ayah' | 'dua';
  arabic?: string;
  text: string;
  source?: string;
  translation?: string;
  dua?: Dua; // Full Dua object for DuaCard rendering
}

// Deterministic surah cycle for Ayah of the Day
const FEATURED_SURAHS = [1, 18, 36, 55, 67, 2, 3];

export function useFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const feedItems: FeedItem[] = [];

      // ── 1. Dua of the Day (fetch from R2 cache) ──────────────────────
      const today = new Date();
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      
      const dua = await fetchRandomDua(seed);
      if (dua) {
        feedItems.push({ type: 'dua', dua, arabic: dua.arabic, text: dua.translation, source: dua.source });
      }

      // ── 2. Ayah of the Day (Quran Foundation API) ─────────────────────────
      try {
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const surah = FEATURED_SURAHS[seed % FEATURED_SURAHS.length];

        const { verses } = await fetchVersesByChapter(surah, { page: 1, perPage: 1, translations: [85] });
        if (verses?.length > 0) {
          const v = verses[0];
          feedItems.push({
            type: 'ayah',
            arabic: v.text_uthmani,
            text: v.translations?.[0]?.text || '',
            source: `Quran ${surah}:${v.verse_number}`,
          });
        }
      } catch (err) {
      }

      if (!cancelled) {
        setItems(feedItems);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return { items, loading };
}
