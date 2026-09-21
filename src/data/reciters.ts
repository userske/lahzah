export interface Reciter {
  id: number | string;
  reciter_name: string;
  style?: string | null;           // API returns a plain string e.g. "Murattal", "Mujawwad"
  translated_name?: { name: string; language_name?: string } | null;
  quranicAudioPath?: string;
  isChapterOnly?: boolean;
}

export const DEFAULT_RECITER: Reciter = {
  id: 7,
  reciter_name: 'Mishari Rashid al-\u02BEAfasy',
  style: null,
};

// Hardcoded custom reciters (like english translation overlaps)
export const SWAHILI_AL_BARWANI: Reciter = {
  id: 'mq.swahili_barwani',
  reciter_name: 'Mishary Alafasy & Maulana Feroz Alam',
  style: 'Swahili Translation',
  translated_name: { name: 'Mishary Alafasy & Swahili', language_name: 'english' },
  quranicAudioPath: 'mishaari_alafasy_with_swahili_translation',
  isChapterOnly: true,
};
