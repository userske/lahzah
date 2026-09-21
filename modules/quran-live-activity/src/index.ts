import QuranLiveActivityModule from './QuranLiveActivityModule';

export function startActivity(surahName: string, ayahNumber: number, reciterName: string) {
  return QuranLiveActivityModule.startActivity(surahName, ayahNumber, reciterName);
}

export function updateActivity(ayahNumber: number, isPlaying: boolean, progress: number) {
  return QuranLiveActivityModule.updateActivity(ayahNumber, isPlaying, progress);
}

export function endActivity() {
  return QuranLiveActivityModule.endActivity();
}
