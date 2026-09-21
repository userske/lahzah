/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#EEEBE3',
    backgroundElement: '#f8f9fa',
    backgroundSelected: '#e5e5e5',
    textSecondary: '#555555',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#121212',
    backgroundSelected: '#222222',
    textSecondary: '#aaaaaa',
  },
  lahzah: {
    paper: '#EEEBE3',
    stone: '#e5e5e5',
    coral: '#000000',
    black: '#000000',
  }
} as const;

/**
 * The canonical Lahzah design palette.
 * Use `theme.colors.paper`, `theme.colors.coral`, etc. across all components.
 */
export const theme = {
  colors: Colors.lahzah,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  // Headings & Large Display numbers
  display: 'Syne_700Bold',
  displayMedium: 'Syne_600SemiBold',
  displayRegular: 'Syne_400Regular',
  
  // Body text
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  
  // Monospace
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
  
  // Arabic Script
  arabic: 'AmiriQuran',
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
