/**
 * Swahili Quran Audio — Cloudflare R2
 * Arabic recitation + Swahili translation combined in each track.
 * Contains all 114 surahs.
 */

const BASE = 'https://pub-33f8115fd19a4e27a68740a321f72e2d.r2.dev/';

/**
 * Get the full URL for the Swahili translation audio of a specific surah.
 * Files are standardized as 001.mp3, 002.mp3, ... 114.mp3
 * @param surahNumber 1-114
 */
export function getSwahiliAudioUrl(surahNumber: number): string | null {
  if (surahNumber < 1 || surahNumber > 114) {
    return null;
  }
  const padded = surahNumber.toString().padStart(3, '0');
  return `${BASE}${padded}.mp3`;
}
