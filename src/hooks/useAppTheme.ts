import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type AppColors } from '../constants/colors';
import { usePreferences } from './usePreferences';

export function useAppTheme(): { colors: AppColors; isDark: boolean } {
  const scheme = useColorScheme();
  const { theme } = usePreferences();
  
  const isDark = theme === 'system' ? scheme === 'dark' : theme === 'dark';
  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);
  
  return { colors, isDark };
}
