/**
 * ummahApi.ts
 * All UmmahAPI endpoints. Auth uses `Authorization: Bearer <key>` header.
 * Prayer times require lat/lng — the caller must supply device coordinates.
 */

const BASE_URL = process.env.EXPO_PUBLIC_UMMAH_API_BASE_URL ?? 'https://ummahapi.com/api';
const API_KEY = process.env.EXPO_PUBLIC_UMMAH_API_KEY ?? '';

const headers: HeadersInit = {
  'Content-Type': 'application/json',
  ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
};

const R2_BASE_URL = 'https://pub-33f8115fd19a4e27a68740a321f72e2d.r2.dev/hadith-data';

import * as FileSystem from 'expo-file-system/legacy';
import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes, Madhab } from 'adhan';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Dua {
  id: number;
  category: string;
  title?: string;
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
  repeat?: number;
}

export interface PrayerTimes {
  date: string;
  timezone: string;
  prayer_times: {
    imsak: string;
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };
  prayer_datetimes: Record<string, string>;
}

export interface Hadith {
  id: string;
  collection: string;
  collection_name: string;
  hadithnumber: number;
  arabic: string;
  english: string;
  grade: string;
}

export interface NameOfAllah {
  number: number;
  arabic: string;
  transliteration: string;
  english: string;
  meaning: string;
}

export interface HijriDate {
  gregorian: {
    date: string;
    formatted: string;
    day_of_week: string;
  };
  hijri: {
    date: string;
    formatted: string;
    day: number;
    month: number;
    month_name: string;
    year: number;
  };
}

// ─── Today Screen ────────────────────────────────────────────────────────────

export interface PrayerTimesParams {
  lat: number;
  lng: number;
  timezone?: string;
  method?: string;
  madhab?: string;
}

export const fetchPrayerTimes = async (params: PrayerTimesParams): Promise<PrayerTimes | null> => {
  try {
    const coordinates = new Coordinates(params.lat, params.lng);
    const date = new Date();
    
    // Auto-detect calculation method based on location (using MuslimWorldLeague as fallback)
    const methodName = (params.method as keyof typeof CalculationMethod) ?? 'MuslimWorldLeague';
    let paramsCalc = CalculationMethod.MuslimWorldLeague();
    if (typeof CalculationMethod[methodName] === 'function') {
      paramsCalc = (CalculationMethod[methodName] as () => any)();
    } else {

    }
    
    paramsCalc.madhab = params.madhab === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;

    
    const times = new AdhanPrayerTimes(coordinates, date, paramsCalc);
    
    const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const formatIso = (d: Date) => d.toISOString();
    
    // Imsak is roughly 10 minutes before Fajr
    const imsakTime = new Date(times.fajr.getTime() - 10 * 60000);

    return {
      date: date.toISOString().split('T')[0],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      prayer_times: {
        imsak: formatTime(imsakTime),
        fajr: formatTime(times.fajr),
        sunrise: formatTime(times.sunrise),
        dhuhr: formatTime(times.dhuhr),
        asr: formatTime(times.asr),
        maghrib: formatTime(times.maghrib),
        isha: formatTime(times.isha),
      },
      prayer_datetimes: {
        imsak: formatIso(imsakTime),
        fajr: formatIso(times.fajr),
        sunrise: formatIso(times.sunrise),
        dhuhr: formatIso(times.dhuhr),
        asr: formatIso(times.asr),
        maghrib: formatIso(times.maghrib),
        isha: formatIso(times.isha),
      }
    };
  } catch (err) {

    return null;
  }
};

const hadithCache: Record<string, Hadith[]> = {};

async function getHadithCollection(collection: string): Promise<Hadith[]> {
  if (hadithCache[collection]) {
    return hadithCache[collection];
  }

  const dir = `${FileSystem.documentDirectory}hadith`;
  const filePath = `${dir}/${collection}.json`;
  
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  
  let hadiths: Hadith[] = [];
  const fileInfo = await FileSystem.getInfoAsync(filePath);
  
  if (fileInfo.exists) {
    const fileContent = await FileSystem.readAsStringAsync(filePath);
    hadiths = JSON.parse(fileContent);
  } else {
    const res = await fetch(`${R2_BASE_URL}/${collection}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    hadiths = await res.json();
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(hadiths));
  }
  
  hadithCache[collection] = hadiths;
  return hadiths;
}

export const fetchHadithByNumber = async (
  collection: string = 'bukhari',
  number: number = 1
): Promise<Hadith | null> => {
  try {
    const hadiths = await getHadithCollection(collection);
    
    // Find the specific hadith
    const hadith = hadiths.find(h => h.hadithnumber === number);
    return hadith || null;
  } catch (err) {

    return null;
  }
};

export const fetchHadithOfTheDay = async (
  collection: string = 'bukhari',
  seed?: number
): Promise<Hadith | null> => {
  try {
    const hadiths = await getHadithCollection(collection);
    
    if (hadiths.length === 0) return null;
    const index = seed !== undefined ? seed % hadiths.length : Math.floor(Math.random() * hadiths.length);
    return hadiths[index] || null;
  } catch (err) {

    return null;
  }
};

export const fetchNamesOfAllah = async (): Promise<NameOfAllah[] | null> => {
  try {
    const res = await fetch(`${BASE_URL}/asma-ul-husna`, { headers });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const json = await res.json();
    return json.data.names as NameOfAllah[];
  } catch (err) {

    return null;
  }
};

export const fetchHijriDate = async (): Promise<HijriDate | null> => {
  try {
    const res = await fetch(`${BASE_URL}/today-hijri`, { headers });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const json = await res.json();
    return json.data as HijriDate;
  } catch (err) {

    return null;
  }
};

// ─── Utilities Screen ─────────────────────────────────────────────────────────

export interface QiblaParams {
  lat: number;
  lng: number;
}

export const fetchQiblaDirection = async (params: QiblaParams): Promise<{ qibla_direction: number; compass_bearing: string } | null> => {
  try {
    const query = new URLSearchParams({ lat: String(params.lat), lng: String(params.lng) });
    const res = await fetch(`${BASE_URL}/qibla?${query}`, { headers });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const json = await res.json();
    // API returns: { data: { qibla_direction: 58.48, compass_bearing: "ENE", ... } }
    return json.data;
  } catch (err) {

    return null;
  }
};

export const fetchAllDuas = async (): Promise<any | null> => {
  try {
    const dir = `${FileSystem.documentDirectory}duas`;
    const filePath = `${dir}/duas.json`;

    // 1. Local Cache
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }

    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      const fileContent = await FileSystem.readAsStringAsync(filePath);
      return JSON.parse(fileContent);
    }

    // 2. Fetch from R2
    const res = await fetch(`${R2_BASE_URL.replace('/hadith-data', '')}/duas.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(json));
    return json;
  } catch (err) {

    return null;
  }
};

export const fetchDuaCategories = async (): Promise<{ id: string; name: string; count: number }[] | null> => {
  try {
    const data = await fetchAllDuas();
    return data?.categories || null;
  } catch (err) {

    return null;
  }
};

export const fetchDuas = async (category: string = 'morning'): Promise<Dua[] | null> => {
  try {
    const data = await fetchAllDuas();
    if (!data || !data.duas) return null;
    return data.duas.filter((d: any) => d.category === category) as Dua[];
  } catch (err) {

    return null;
  }
};

export const fetchRandomDua = async (seed?: number): Promise<Dua | null> => {
  try {
    const data = await fetchAllDuas();
    if (!data || !data.duas || data.duas.length === 0) return null;
    const index = seed !== undefined ? seed % data.duas.length : Math.floor(Math.random() * data.duas.length);
    return data.duas[index] as Dua;
  } catch (err) {

    return null;
  }
};

export const fetchHadithsByCollection = async (
  collection: string,
  page: number = 1,
  limit: number = 20,
): Promise<Hadith[] | null> => {
  try {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetch(`${BASE_URL}/hadith/${collection}?${query}`, { headers });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const json = await res.json();
    return json.data.hadiths as Hadith[];
  } catch (err) {

    return null;
  }
};

export const fetchRandomHadith = async (collection?: string): Promise<Hadith | null> => {
  try {
    const query = collection ? `?collection=${collection}` : '';
    const res = await fetch(`${BASE_URL}/hadith/random${query}`, { headers });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const json = await res.json();
    return json.data as Hadith;
  } catch (err) {

    return null;
  }
};

export const fetchZakatNisab = async (currency: string = 'USD'): Promise<any | null> => {
  try {
    const res = await fetch(`${BASE_URL}/zakat/nisab?currency=${currency}`, { headers });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const json = await res.json();
    return json.data;
  } catch (err) {

    return null;
  }
};

export const fetchMoonPhase = async (): Promise<any | null> => {
  try {
    const res = await fetch(`${BASE_URL}/moon`, { headers });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const json = await res.json();
    return json.data;
  } catch (err) {

    return null;
  }
};

export const calculateZakat = async (payload: Record<string, unknown>): Promise<any | null> => {
  try {
    const res = await fetch(`${BASE_URL}/zakat/calculate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const json = await res.json();
    return json.data;
  } catch (err) {

    return null;
  }
};
