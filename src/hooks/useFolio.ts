import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { FolioColors, type FolioPalette } from '../constants/folio';

/**
 * The folio under the light it is being read in.
 *
 * The scene decided this, not the category: a phone held one-handed at 5:40am
 * before Fajr, and again at 11pm with the lights off. Night is the common case,
 * so it is a first-class appearance rather than an inversion.
 */
export function useFolio(): { plate: FolioPalette; isNight: boolean } {
  const scheme = useColorScheme();
  const isNight = scheme === 'dark';
  const plate = useMemo(() => (isNight ? FolioColors.night : FolioColors.day), [isNight]);
  return { plate, isNight };
}
