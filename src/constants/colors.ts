/**
 * Lahzah color palette — Black & White Base
 */

export const lightColors = {
  // Core
  background: '#EEEBE3',
  surface: 'rgba(248, 249, 250, 0.7)',
  card: '#f8f9fa',
  border: '#e5e5e5',
  // Text
  text: '#000000',
  textSecondary: '#555555',
  textTertiary: '#888888',
  // Brand — Black as primary
  primary: '#000000',
  primaryLight: 'rgba(0, 0, 0, 0.08)',
  primaryDark: '#222222',
  // Accents
  coral: '#000000',
  // Misc
  divider: '#e5e5e5',
  skeleton: 'rgba(0, 0, 0, 0.05)',
  error: '#cc0000',
};

export const darkColors = {
  // Core
  background: '#000000',
  surface: 'rgba(18, 18, 18, 0.7)',
  card: '#121212',
  border: '#2a2a2a',
  // Text
  text: '#ffffff',
  textSecondary: '#aaaaaa',
  textTertiary: '#777777',
  // Brand — White as primary in dark mode
  primary: '#ffffff',
  primaryLight: 'rgba(255, 255, 255, 0.1)',
  primaryDark: '#cccccc',
  // Accents
  coral: '#ffffff',
  // Misc
  divider: '#222222',
  skeleton: 'rgba(255, 255, 255, 0.05)',
  error: '#ff6b6b',
};

// Legacy fallback
export const colors = lightColors;

// Static references needed by non-hook-aware StyleSheet.create blocks
export const paper = lightColors.background;
export const stone = lightColors.divider;

// Legacy augmented colors with black/white for old components
(colors as any).black = '#000000';
(colors as any).white = '#ffffff';

export type AppColors = typeof lightColors;
