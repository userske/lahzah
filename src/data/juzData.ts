/**
 * Standard Quran Juz & Hizb boundaries.
 * Each entry = one row in the Juz' browse list.
 * source: quran.com / standard Uthmani mushaf divisions
 */

export type HizbLabel =
  | 'Juz'
  | '¼ Hizb'
  | '½ Hizb'
  | '¾ Hizb';

export interface JuzEntry {
  juz: number;
  hizb: number;           // Hizb number (1–60)
  hizbQuarter: 1 | 2 | 3 | 4; // quarter within the hizb
  surah: number;
  ayah: number;
  page: number;
  hizbLabel: HizbLabel;
}

export const JUZ_DATA: JuzEntry[] = [
  // JUZ 1
  { juz: 1, hizb: 1, hizbQuarter: 1, surah: 1, ayah: 1, page: 1,   hizbLabel: 'Juz' },
  { juz: 1, hizb: 1, hizbQuarter: 2, surah: 2, ayah: 25, page: 4,  hizbLabel: '¼ Hizb' },
  { juz: 1, hizb: 1, hizbQuarter: 3, surah: 2, ayah: 43, page: 7,  hizbLabel: '½ Hizb' },
  { juz: 1, hizb: 1, hizbQuarter: 4, surah: 2, ayah: 60, page: 9,  hizbLabel: '¾ Hizb' },
  { juz: 1, hizb: 2, hizbQuarter: 1, surah: 2, ayah: 75, page: 11, hizbLabel: 'Hizb 2' as HizbLabel },
  { juz: 1, hizb: 2, hizbQuarter: 2, surah: 2, ayah: 92, page: 14, hizbLabel: '¼ Hizb' },
  { juz: 1, hizb: 2, hizbQuarter: 3, surah: 2, ayah: 106, page: 17, hizbLabel: '½ Hizb' },
  { juz: 1, hizb: 2, hizbQuarter: 4, surah: 2, ayah: 124, page: 19, hizbLabel: '¾ Hizb' },

  // JUZ 2
  { juz: 2, hizb: 3, hizbQuarter: 1, surah: 2, ayah: 142, page: 22, hizbLabel: 'Juz' },
  { juz: 2, hizb: 3, hizbQuarter: 2, surah: 2, ayah: 164, page: 25, hizbLabel: '¼ Hizb' },
  { juz: 2, hizb: 3, hizbQuarter: 3, surah: 2, ayah: 177, page: 27, hizbLabel: '½ Hizb' },
  { juz: 2, hizb: 3, hizbQuarter: 4, surah: 2, ayah: 189, page: 29, hizbLabel: '¾ Hizb' },
  { juz: 2, hizb: 4, hizbQuarter: 1, surah: 2, ayah: 203, page: 32, hizbLabel: 'Juz' },
  { juz: 2, hizb: 4, hizbQuarter: 2, surah: 2, ayah: 219, page: 34, hizbLabel: '¼ Hizb' },
  { juz: 2, hizb: 4, hizbQuarter: 3, surah: 2, ayah: 232, page: 37, hizbLabel: '½ Hizb' },
  { juz: 2, hizb: 4, hizbQuarter: 4, surah: 2, ayah: 246, page: 39, hizbLabel: '¾ Hizb' },

  // JUZ 3
  { juz: 3, hizb: 5, hizbQuarter: 1, surah: 2, ayah: 253, page: 41, hizbLabel: 'Juz' },
  { juz: 3, hizb: 5, hizbQuarter: 2, surah: 2, ayah: 268, page: 44, hizbLabel: '¼ Hizb' },
  { juz: 3, hizb: 5, hizbQuarter: 3, surah: 2, ayah: 283, page: 46, hizbLabel: '½ Hizb' },
  { juz: 3, hizb: 5, hizbQuarter: 4, surah: 3, ayah: 14,  page: 52, hizbLabel: '¾ Hizb' },
  { juz: 3, hizb: 6, hizbQuarter: 1, surah: 3, ayah: 30,  page: 53, hizbLabel: 'Juz' },
  { juz: 3, hizb: 6, hizbQuarter: 2, surah: 3, ayah: 55,  page: 57, hizbLabel: '¼ Hizb' },
  { juz: 3, hizb: 6, hizbQuarter: 3, surah: 3, ayah: 79,  page: 60, hizbLabel: '½ Hizb' },
  { juz: 3, hizb: 6, hizbQuarter: 4, surah: 3, ayah: 101, page: 63, hizbLabel: '¾ Hizb' },

  // JUZ 4
  { juz: 4, hizb: 7, hizbQuarter: 1, surah: 3, ayah: 121, page: 65, hizbLabel: 'Juz' },
  { juz: 4, hizb: 7, hizbQuarter: 2, surah: 3, ayah: 148, page: 69, hizbLabel: '¼ Hizb' },
  { juz: 4, hizb: 7, hizbQuarter: 3, surah: 3, ayah: 171, page: 73, hizbLabel: '½ Hizb' },
  { juz: 4, hizb: 7, hizbQuarter: 4, surah: 3, ayah: 187, page: 75, hizbLabel: '¾ Hizb' },
  { juz: 4, hizb: 8, hizbQuarter: 1, surah: 4, ayah: 1,   page: 77, hizbLabel: 'Juz' },
  { juz: 4, hizb: 8, hizbQuarter: 2, surah: 4, ayah: 24,  page: 81, hizbLabel: '¼ Hizb' },
  { juz: 4, hizb: 8, hizbQuarter: 3, surah: 4, ayah: 36,  page: 84, hizbLabel: '½ Hizb' },
  { juz: 4, hizb: 8, hizbQuarter: 4, surah: 4, ayah: 52,  page: 86, hizbLabel: '¾ Hizb' },

  // JUZ 5
  { juz: 5, hizb: 9, hizbQuarter: 1, surah: 4, ayah: 88,  page: 92,  hizbLabel: 'Juz' },
  { juz: 5, hizb: 9, hizbQuarter: 2, surah: 4, ayah: 114, page: 96,  hizbLabel: '¼ Hizb' },
  { juz: 5, hizb: 9, hizbQuarter: 3, surah: 4, ayah: 135, page: 100, hizbLabel: '½ Hizb' },
  { juz: 5, hizb: 9, hizbQuarter: 4, surah: 4, ayah: 154, page: 103, hizbLabel: '¾ Hizb' },
  { juz: 5, hizb: 10, hizbQuarter: 1, surah: 4, ayah: 176, page: 106, hizbLabel: 'Juz' },
  { juz: 5, hizb: 10, hizbQuarter: 2, surah: 5, ayah: 12,  page: 110, hizbLabel: '¼ Hizb' },
  { juz: 5, hizb: 10, hizbQuarter: 3, surah: 5, ayah: 27,  page: 112, hizbLabel: '½ Hizb' },
  { juz: 5, hizb: 10, hizbQuarter: 4, surah: 5, ayah: 41,  page: 114, hizbLabel: '¾ Hizb' },

  // JUZ 6
  { juz: 6, hizb: 11, hizbQuarter: 1, surah: 5, ayah: 82,  page: 120, hizbLabel: 'Juz' },
  { juz: 6, hizb: 11, hizbQuarter: 2, surah: 5, ayah: 100, page: 123, hizbLabel: '¼ Hizb' },
  { juz: 6, hizb: 11, hizbQuarter: 3, surah: 6, ayah: 1,   page: 128, hizbLabel: '½ Hizb' },
  { juz: 6, hizb: 11, hizbQuarter: 4, surah: 6, ayah: 36,  page: 132, hizbLabel: '¾ Hizb' },
  { juz: 6, hizb: 12, hizbQuarter: 1, surah: 6, ayah: 59,  page: 135, hizbLabel: 'Juz' },
  { juz: 6, hizb: 12, hizbQuarter: 2, surah: 6, ayah: 83,  page: 138, hizbLabel: '¼ Hizb' },
  { juz: 6, hizb: 12, hizbQuarter: 3, surah: 6, ayah: 111, page: 141, hizbLabel: '½ Hizb' },
  { juz: 6, hizb: 12, hizbQuarter: 4, surah: 6, ayah: 131, page: 144, hizbLabel: '¾ Hizb' },

  // JUZ 7
  { juz: 7, hizb: 13, hizbQuarter: 1, surah: 6, ayah: 166, page: 150, hizbLabel: 'Juz' },
  { juz: 7, hizb: 13, hizbQuarter: 2, surah: 7, ayah: 32,  page: 154, hizbLabel: '¼ Hizb' },
  { juz: 7, hizb: 13, hizbQuarter: 3, surah: 7, ayah: 59,  page: 158, hizbLabel: '½ Hizb' },
  { juz: 7, hizb: 13, hizbQuarter: 4, surah: 7, ayah: 83,  page: 161, hizbLabel: '¾ Hizb' },
  { juz: 7, hizb: 14, hizbQuarter: 1, surah: 7, ayah: 116, page: 165, hizbLabel: 'Juz' },
  { juz: 7, hizb: 14, hizbQuarter: 2, surah: 7, ayah: 142, page: 168, hizbLabel: '¼ Hizb' },
  { juz: 7, hizb: 14, hizbQuarter: 3, surah: 7, ayah: 160, page: 171, hizbLabel: '½ Hizb' },
  { juz: 7, hizb: 14, hizbQuarter: 4, surah: 7, ayah: 171, page: 173, hizbLabel: '¾ Hizb' },

  // JUZ 8
  { juz: 8, hizb: 15, hizbQuarter: 1, surah: 8, ayah: 1,   page: 177, hizbLabel: 'Juz' },
  { juz: 8, hizb: 15, hizbQuarter: 2, surah: 8, ayah: 24,  page: 180, hizbLabel: '¼ Hizb' },
  { juz: 8, hizb: 15, hizbQuarter: 3, surah: 8, ayah: 41,  page: 182, hizbLabel: '½ Hizb' },
  { juz: 8, hizb: 15, hizbQuarter: 4, surah: 8, ayah: 60,  page: 185, hizbLabel: '¾ Hizb' },
  { juz: 8, hizb: 16, hizbQuarter: 1, surah: 9, ayah: 1,   page: 187, hizbLabel: 'Juz' },
  { juz: 8, hizb: 16, hizbQuarter: 2, surah: 9, ayah: 25,  page: 191, hizbLabel: '¼ Hizb' },
  { juz: 8, hizb: 16, hizbQuarter: 3, surah: 9, ayah: 40,  page: 194, hizbLabel: '½ Hizb' },
  { juz: 8, hizb: 16, hizbQuarter: 4, surah: 9, ayah: 60,  page: 196, hizbLabel: '¾ Hizb' },

  // JUZ 9
  { juz: 9, hizb: 17, hizbQuarter: 1, surah: 9, ayah: 94,  page: 203, hizbLabel: 'Juz' },
  { juz: 9, hizb: 17, hizbQuarter: 2, surah: 9, ayah: 112, page: 205, hizbLabel: '¼ Hizb' },
  { juz: 9, hizb: 17, hizbQuarter: 3, surah: 10, ayah: 1,  page: 208, hizbLabel: '½ Hizb' },
  { juz: 9, hizb: 17, hizbQuarter: 4, surah: 10, ayah: 26, page: 212, hizbLabel: '¾ Hizb' },
  { juz: 9, hizb: 18, hizbQuarter: 1, surah: 10, ayah: 53, page: 215, hizbLabel: 'Juz' },
  { juz: 9, hizb: 18, hizbQuarter: 2, surah: 10, ayah: 71, page: 217, hizbLabel: '¼ Hizb' },
  { juz: 9, hizb: 18, hizbQuarter: 3, surah: 10, ayah: 90, page: 220, hizbLabel: '½ Hizb' },
  { juz: 9, hizb: 18, hizbQuarter: 4, surah: 11, ayah: 6,  page: 222, hizbLabel: '¾ Hizb' },

  // JUZ 10
  { juz: 10, hizb: 19, hizbQuarter: 1, surah: 11, ayah: 50,  page: 227, hizbLabel: 'Juz' },
  { juz: 10, hizb: 19, hizbQuarter: 2, surah: 11, ayah: 71,  page: 229, hizbLabel: '¼ Hizb' },
  { juz: 10, hizb: 19, hizbQuarter: 3, surah: 11, ayah: 96,  page: 232, hizbLabel: '½ Hizb' },
  { juz: 10, hizb: 19, hizbQuarter: 4, surah: 12, ayah: 1,   page: 235, hizbLabel: '¾ Hizb' },
  { juz: 10, hizb: 20, hizbQuarter: 1, surah: 12, ayah: 30,  page: 239, hizbLabel: 'Juz' },
  { juz: 10, hizb: 20, hizbQuarter: 2, surah: 12, ayah: 53,  page: 242, hizbLabel: '¼ Hizb' },
  { juz: 10, hizb: 20, hizbQuarter: 3, surah: 12, ayah: 76,  page: 245, hizbLabel: '½ Hizb' },
  { juz: 10, hizb: 20, hizbQuarter: 4, surah: 12, ayah: 100, page: 248, hizbLabel: '¾ Hizb' },

  // JUZ 11–30 abbreviated (start of each juz only for core navigation)
  { juz: 11, hizb: 21, hizbQuarter: 1, surah: 12, ayah: 111, page: 251, hizbLabel: 'Juz' },
  { juz: 12, hizb: 23, hizbQuarter: 1, surah: 15, ayah: 1,   page: 262, hizbLabel: 'Juz' },
  { juz: 13, hizb: 25, hizbQuarter: 1, surah: 18, ayah: 1,   page: 293, hizbLabel: 'Juz' },
  { juz: 14, hizb: 27, hizbQuarter: 1, surah: 20, ayah: 1,   page: 312, hizbLabel: 'Juz' },
  { juz: 15, hizb: 29, hizbQuarter: 1, surah: 23, ayah: 1,   page: 342, hizbLabel: 'Juz' },
  { juz: 16, hizb: 31, hizbQuarter: 1, surah: 25, ayah: 21,  page: 360, hizbLabel: 'Juz' },
  { juz: 17, hizb: 33, hizbQuarter: 1, surah: 27, ayah: 56,  page: 381, hizbLabel: 'Juz' },
  { juz: 18, hizb: 35, hizbQuarter: 1, surah: 30, ayah: 1,   page: 404, hizbLabel: 'Juz' },
  { juz: 19, hizb: 37, hizbQuarter: 1, surah: 33, ayah: 31,  page: 423, hizbLabel: 'Juz' },
  { juz: 20, hizb: 39, hizbQuarter: 1, surah: 36, ayah: 28,  page: 445, hizbLabel: 'Juz' },
  { juz: 21, hizb: 41, hizbQuarter: 1, surah: 40, ayah: 1,   page: 467, hizbLabel: 'Juz' },
  { juz: 22, hizb: 43, hizbQuarter: 1, surah: 43, ayah: 24,  page: 489, hizbLabel: 'Juz' },
  { juz: 23, hizb: 45, hizbQuarter: 1, surah: 47, ayah: 1,   page: 507, hizbLabel: 'Juz' },
  { juz: 24, hizb: 47, hizbQuarter: 1, surah: 51, ayah: 31,  page: 528, hizbLabel: 'Juz' },
  { juz: 25, hizb: 49, hizbQuarter: 1, surah: 57, ayah: 1,   page: 537, hizbLabel: 'Juz' },
  { juz: 26, hizb: 51, hizbQuarter: 1, surah: 62, ayah: 1,   page: 553, hizbLabel: 'Juz' },
  { juz: 27, hizb: 53, hizbQuarter: 1, surah: 68, ayah: 1,   page: 564, hizbLabel: 'Juz' },
  { juz: 28, hizb: 55, hizbQuarter: 1, surah: 76, ayah: 1,   page: 578, hizbLabel: 'Juz' },
  { juz: 29, hizb: 57, hizbQuarter: 1, surah: 83, ayah: 1,   page: 587, hizbLabel: 'Juz' },
  { juz: 30, hizb: 59, hizbQuarter: 1, surah: 93, ayah: 1,   page: 596, hizbLabel: 'Juz' },
];

// Surah names lookup (Arabic)
export const SURAH_NAMES_ARABIC: Record<number, string> = {
  1: 'الْفَاتِحَة', 2: 'الْبَقَرَة', 3: 'آلِ عِمْرَان', 4: 'النِّسَاء',
  5: 'الْمَائِدَة', 6: 'الْأَنْعَام', 7: 'الْأَعْرَاف', 8: 'الْأَنْفَال',
  9: 'التَّوْبَة', 10: 'يُونُس', 11: 'هُود', 12: 'يُوسُف',
  13: 'الرَّعْد', 14: 'إِبْرَاهِيم', 15: 'الْحِجْر', 16: 'النَّحْل',
  17: 'الْإِسْرَاء', 18: 'الْكَهْف', 19: 'مَرْيَم', 20: 'طه',
  21: 'الْأَنْبِيَاء', 22: 'الْحَجّ', 23: 'الْمُؤْمِنُون', 24: 'النُّور',
  25: 'الْفُرْقَان', 26: 'الشُّعَرَاء', 27: 'النَّمْل', 28: 'الْقَصَص',
  29: 'الْعَنْكَبُوت', 30: 'الرُّوم', 31: 'لُقْمَان', 32: 'السَّجْدَة',
  33: 'الْأَحْزَاب', 34: 'سَبَأ', 35: 'فَاطِر', 36: 'يس',
  37: 'الصَّافَّات', 38: 'ص', 39: 'الزُّمَر', 40: 'غَافِر',
  41: 'فُصِّلَت', 42: 'الشُّورَى', 43: 'الزُّخْرُف', 44: 'الدُّخَان',
  45: 'الْجَاثِيَة', 46: 'الْأَحْقَاف', 47: 'مُحَمَّد', 48: 'الْفَتْح',
  49: 'الْحُجُرَات', 50: 'ق', 51: 'الذَّارِيَات', 52: 'الطُّور',
  53: 'النَّجْم', 54: 'الْقَمَر', 55: 'الرَّحْمَن', 56: 'الْوَاقِعَة',
  57: 'الْحَدِيد', 58: 'الْمُجَادِلَة', 59: 'الْحَشْر', 60: 'الْمُمْتَحِنَة',
  61: 'الصَّفّ', 62: 'الْجُمُعَة', 63: 'الْمُنَافِقُون', 64: 'التَّغَابُن',
  65: 'الطَّلَاق', 66: 'التَّحْرِيم', 67: 'الْمُلْك', 68: 'الْقَلَم',
  69: 'الْحَاقَّة', 70: 'الْمَعَارِج', 71: 'نُوح', 72: 'الْجِنّ',
  73: 'الْمُزَّمِّل', 74: 'الْمُدَّثِّر', 75: 'الْقِيَامَة', 76: 'الْإِنسَان',
  77: 'الْمُرْسَلَات', 78: 'النَّبَأ', 79: 'النَّازِعَات', 80: 'عَبَسَ',
  81: 'التَّكْوِير', 82: 'الِانفِطَار', 83: 'الْمُطَفِّفِين', 84: 'الِانشِقَاق',
  85: 'الْبُرُوج', 86: 'الطَّارِق', 87: 'الْأَعْلَى', 88: 'الْغَاشِيَة',
  89: 'الْفَجْر', 90: 'الْبَلَد', 91: 'الشَّمْس', 92: 'اللَّيْل',
  93: 'الضُّحَى', 94: 'الشَّرْح', 95: 'التِّين', 96: 'الْعَلَق',
  97: 'الْقَدْر', 98: 'الْبَيِّنَة', 99: 'الزَّلْزَلَة', 100: 'الْعَادِيَات',
  101: 'الْقَارِعَة', 102: 'التَّكَاثُر', 103: 'الْعَصْر', 104: 'الْهُمَزَة',
  105: 'الْفِيل', 106: 'قُرَيْش', 107: 'الْمَاعُون', 108: 'الْكَوْثَر',
  109: 'الْكَافِرُون', 110: 'النَّصْر', 111: 'الْمَسَد', 112: 'الْإِخْلَاص',
  113: 'الْفَلَق', 114: 'النَّاس',
};

export const SURAH_NAMES_SIMPLE: Record<number, string> = {
  1: 'Al-Fatihah', 2: 'Al-Baqarah', 3: 'Ali \'Imran', 4: 'An-Nisa',
  5: 'Al-Ma\'idah', 6: 'Al-An\'am', 7: 'Al-A\'raf', 8: 'Al-Anfal',
  9: 'At-Tawbah', 10: 'Yunus', 11: 'Hud', 12: 'Yusuf',
  13: 'Ar-Ra\'d', 14: 'Ibrahim', 15: 'Al-Hijr', 16: 'An-Nahl',
  17: 'Al-Isra', 18: 'Al-Kahf', 19: 'Maryam', 20: 'Ta-Ha',
  21: 'Al-Anbiya', 22: 'Al-Hajj', 23: 'Al-Mu\'minun', 24: 'An-Nur',
  25: 'Al-Furqan', 26: 'Ash-Shu\'ara', 27: 'An-Naml', 28: 'Al-Qasas',
  29: 'Al-\'Ankabut', 30: 'Ar-Rum', 31: 'Luqman', 32: 'As-Sajdah',
  33: 'Al-Ahzab', 34: 'Saba', 35: 'Fatir', 36: 'Ya-Sin',
  37: 'As-Saffat', 38: 'Sad', 39: 'Az-Zumar', 40: 'Ghafir',
  41: 'Fussilat', 42: 'Ash-Shura', 43: 'Az-Zukhruf', 44: 'Ad-Dukhan',
  45: 'Al-Jathiyah', 46: 'Al-Ahqaf', 47: 'Muhammad', 48: 'Al-Fath',
  49: 'Al-Hujurat', 50: 'Qaf', 51: 'Adh-Dhariyat', 52: 'At-Tur',
  53: 'An-Najm', 54: 'Al-Qamar', 55: 'Ar-Rahman', 56: 'Al-Waqi\'ah',
  57: 'Al-Hadid', 58: 'Al-Mujadila', 59: 'Al-Hashr', 60: 'Al-Mumtahanah',
  61: 'As-Saf', 62: 'Al-Jumu\'ah', 63: 'Al-Munafiqun', 64: 'At-Taghabun',
  65: 'At-Talaq', 66: 'At-Tahrim', 67: 'Al-Mulk', 68: 'Al-Qalam',
  69: 'Al-Haqqah', 70: 'Al-Ma\'arij', 71: 'Nuh', 72: 'Al-Jinn',
  73: 'Al-Muzzammil', 74: 'Al-Muddathir', 75: 'Al-Qiyamah', 76: 'Al-Insan',
  77: 'Al-Mursalat', 78: 'An-Naba', 79: 'An-Nazi\'at', 80: '\'Abasa',
  81: 'At-Takwir', 82: 'Al-Infitar', 83: 'Al-Mutaffifin', 84: 'Al-Inshiqaq',
  85: 'Al-Buruj', 86: 'At-Tariq', 87: 'Al-A\'la', 88: 'Al-Ghashiyah',
  89: 'Al-Fajr', 90: 'Al-Balad', 91: 'Ash-Shams', 92: 'Al-Layl',
  93: 'Ad-Duhaa', 94: 'Ash-Sharh', 95: 'At-Tin', 96: 'Al-\'Alaq',
  97: 'Al-Qadr', 98: 'Al-Bayyinah', 99: 'Az-Zalzalah', 100: 'Al-\'Adiyat',
  101: 'Al-Qari\'ah', 102: 'At-Takathur', 103: 'Al-\'Asr', 104: 'Al-Humazah',
  105: 'Al-Fil', 106: 'Quraysh', 107: 'Al-Ma\'un', 108: 'Al-Kawthar',
  109: 'Al-Kafirun', 110: 'An-Nasr', 111: 'Al-Masad', 112: 'Al-Ikhlas',
  113: 'Al-Falaq', 114: 'An-Nas',
};
