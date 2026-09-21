/**
 * Folio — the design tokens for Lahzah's visual world.
 *
 * A botanical folio follows one subject through its stages, drawn at one
 * unchanging scale on one shared ground. Change reads by comparison, never by
 * assertion — which is how this product shows progress without ranking anyone.
 *
 * See DESIGN-BRIEF.md. Two appearances, one folio: the night plate is the same
 * page photographed under different light, not a second theme.
 */

import { StyleSheet, type TextStyle } from 'react-native';

export interface FolioPalette {
  ground: string;
  rule: string;
  ink: string;
  graphite: string;
  /** Locked brand green in day, its night sibling at raised luminance. */
  accent: string;
  accentDeep: string;
  attention: string;
}

export const FolioColors: { day: FolioPalette; night: FolioPalette } = {
  day: {
    ground: '#EEEBE3',
    rule: '#D9CDB5',
    ink: '#1A1A1D',
    graphite: '#4A4A4A',
    /** Locked brand green. Primary action, active state, attestation. */
    accent: '#000000',
    accentDeep: '#2E5E3D',
    /** Reserved: overdue review, missed prayer, mispronunciation. Never decorative. */
    attention: '#B21E18',
  },
  night: {
    ground: '#131311',
    rule: '#3A382F',
    ink: '#F6F1E6',
    graphite: '#9A9689',
    /** Same hue as the locked green, luminance raised to hold contrast on near-black. */
    accent: '#8FBA72',
    accentDeep: '#8FBA72',
    attention: '#D14A42',
  },
};

export const FolioFonts = {
  /** Engraved serif — plate titles, surah names, the display voice. */
  plate: 'SourceSerif4_400Regular',
  plateMedium: 'SourceSerif4_600SemiBold',
  plateItalic: 'SourceSerif4_400Regular_Italic',
  /** Inter carries body and controls. */
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  /** Numerals: plate indices, times, countdowns, ayah and juz numbers. */
  numeral: 'DMMono_400Regular',
  numeralMedium: 'DMMono_500Medium',
  /** Uthmani mushaf script. */
  quran: 'AmiriQuran',
} as const;

/** Every frame and band in the folio is a hairline. Elevation is declared once, as a rule. */
export const Rule = StyleSheet.hairlineWidth;

/**
 * The folio's caption voice: tracked uppercase standing in for letterspaced
 * small caps. Used as a field label attached to data, never as an eyebrow
 * stacked above a heading.
 */
export const label: TextStyle = {
  fontFamily: FolioFonts.bodyMedium,
  fontSize: 11,
  letterSpacing: 1.1,
  textTransform: 'uppercase',
};

/**
 * Type scale — size, leading, and tracking decided together.
 *
 * Tracking is size-specific: large text reads too loose as it grows, so it
 * tightens; small text needs a little air to stay legible. A single
 * letter-spacing value applied across a scale is wrong somewhere. Leading runs
 * inversely to size — tight on display, comfortable in body copy.
 */
export const Type = {
  display: { fontSize: 34, lineHeight: 39, letterSpacing: -0.6 },
  title: { fontSize: 27, lineHeight: 33, letterSpacing: -0.3 },
  heading: { fontSize: 20, lineHeight: 26, letterSpacing: -0.15 },
  body: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  callout: { fontSize: 14, lineHeight: 20, letterSpacing: 0.05 },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.15 },
} as const satisfies Record<string, TextStyle>;

/** Spacing scale. Tight groups, generous separation between bands. */
export const Step = {
  hair: 2,
  tight: 4,
  snug: 8,
  base: 12,
  band: 20,
  bandGap: 32,
  margin: 20,
} as const;
