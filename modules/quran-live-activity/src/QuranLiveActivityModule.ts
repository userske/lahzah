import { NativeModule, requireNativeModule } from 'expo';

declare class QuranLiveActivityModule extends NativeModule<{}> {
  startActivity(surahName: string, ayahNumber: number, reciterName: string): Promise<void>;
  updateActivity(ayahNumber: number, isPlaying: boolean, progress: number): Promise<void>;
  endActivity(): Promise<void>;
}

export default requireNativeModule<QuranLiveActivityModule>('QuranLiveActivity');
