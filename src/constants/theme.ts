// Fretionary — theme. Dark ("Obsidian") is the default; a light palette
// ("Paper") is selectable under Appearance on the Fretboard tab.
// Obsidian: true near-black background with subtle warm tint, layered
// translucent surfaces using rgba(255,255,255,0.0X) over a single warm-tinted
// base, and 1px hairlines (6% opacity) instead of solid borders.
export const APP_NAME = 'Fretionary';

import { useSyncExternalStore } from 'react';
import {
  Appearance, Dimensions, Platform, StyleSheet,
  type ImageStyle, type TextStyle, type ViewStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Typography ───────────────────────────────────────────────────────────────
// UI uses the platform default (SF Pro on iOS / Roboto on Android) — clean
// modern sans-serifs that already match the design's intent at this scale.
// Mono is JetBrains Mono, loaded via expo-font on app launch (see _layout.tsx)
// for note labels, fret numbers, theory formulas, and any tabular numerics.
export const FONT_FAMILY = {
  ui:   undefined as string | undefined, // platform default
  mono: 'JetBrainsMono',
};

// ── Palettes (RN-safe — no oklch) ────────────────────────────────────────────
// Two palettes with the same shape: Obsidian (dark, the original look) and
// Paper (light — white background, near-black ink, added for players who
// find the dark theme too low-contrast). Components never pick one directly:
// they read COLORS (live getters over the active palette) and build their
// stylesheets with makeStyles(), which re-renders them when the theme flips.
const ROOT  = { fill: '#E0CC58', stroke: '#B49E2E', text: '#3E3208' };
const THIRD = { fill: '#D45846', stroke: '#9B3A2D', text: '#fff' };
const FIFTH = { fill: '#3FA08A', stroke: '#26786A', text: '#fff' };
const EXT   = { fill: '#5C8FCC', stroke: '#3D6BA0', text: '#fff' };

// Position colours rebalanced — same identity, lower chroma so they harmonize
const POS_FILLS = [
  '#6E60D9', // 1  indigo
  '#D77144', // 2  warm orange
  '#3FA08A', // 3  teal
  '#5C8FCC', // 4  blue
  '#C19052', // 5  amber
] as const;

function mix(hex: string, alpha: number): string {
  // hex must be #RRGGBB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const POS = POS_FILLS.map(fill => ({ fill, light: mix(fill, 0.16), stroke: fill }));
const CAGED: Record<string, { fill: string; light: string; stroke: string }> = {
  C: POS[0], A: POS[1], G: POS[2], E: POS[3], D: POS[4],
};

const DARK = {
  // Layered translucent surfaces over a single warm-tinted base.
  // bg is the painted backstop (also used for the iOS frame fill).
  bg:           '#0A0A0C',
  bgElevated:   '#14141A', // fretboard panel and similar feature surfaces
  surface:      'rgba(255,255,255,0.03)',
  surfaceHigh:  'rgba(255,255,255,0.06)',
  surfaceActive:'rgba(255,255,255,0.09)',
  // Hairlines — replace heavy borders. Use these as borderColor everywhere.
  border:       'rgba(255,255,255,0.06)',
  borderLight:  'rgba(255,255,255,0.10)',
  text:         '#F2F1EC',
  textMuted:    'rgba(242,241,236,0.55)',
  textFaint:    'rgba(242,241,236,0.30)',

  root:    ROOT,
  third:   THIRD,
  fifth:   FIFTH,
  ext:     EXT,
  // Scale-tone text brightened from 0.65 → 0.92 alpha so the letters inside
  // the gray "passing tone" dots are actually readable.
  scale:   { fill: 'rgba(255,255,255,0.10)', stroke: 'rgba(255,255,255,0.18)', text: 'rgba(242,241,236,0.92)' },
  ghost:   { fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.10)', text: 'rgba(242,241,236,0.30)' },
  // Solid neutral dot for notes with no interval color (scale passing tones,
  // un-highlighted chord tones). Every fretboard and chord box shares it.
  tone:    { fill: '#3F3F47', stroke: '#666670', text: '#E5E3DC' },

  // Fretboard furniture — shared by every neck diagram in the app. Strings,
  // fret numbers and string names sit well above their original 30–40% alpha:
  // support emails said the gray was hard to pick up quickly.
  fb: {
    inlay:       'rgba(255,255,255,0.10)',
    fret:        'rgba(255,255,255,0.16)',
    fretStrong:  'rgba(255,255,255,0.30)',
    string:      'rgba(242,241,236,0.62)',
    nut:         '#D9D6CC',
    label:       'rgba(242,241,236,0.88)',
    // "Now playing" / triad-root ring and glow: must contrast with the panel.
    ring:        '#FFFFFF',
    ghostFill:   'rgba(255,255,255,0.05)',
    ghostStroke: 'rgba(255,255,255,0.12)',
  },

  pos: POS,
  caged: CAGED,

  accent:      '#6E60D9',                 // brand indigo, slightly desaturated
  accentSoft:  'rgba(110,96,217,0.18)',
  accentGlow:  'rgba(110,96,217,0.35)',
  accentLight: 'rgba(110,96,217,0.18)',
  accentText:  '#837AB7',                 // indigo as small text on a tint

  // Coloured *text* and its tinted chip backgrounds. Fills that carry their
  // own dark label — gold buttons, note dots — stay literal in components.
  gold:        '#E8D44D',
  goldSoft:    'rgba(232,212,77,0.07)',
  goldBorder:  'rgba(232,212,77,0.32)',
  success:     '#3FCB9C',
  danger:      '#E24B4A',
};

export type Palette = typeof DARK;

const LIGHT: Palette = {
  bg:           '#FFFFFF',
  bgElevated:   '#F5F4F1',
  surface:      'rgba(18,18,24,0.035)',
  surfaceHigh:  'rgba(18,18,24,0.07)',
  surfaceActive:'rgba(18,18,24,0.11)',
  border:       'rgba(18,18,24,0.12)',
  borderLight:  'rgba(18,18,24,0.20)',
  text:         '#141418',
  textMuted:    'rgba(20,20,24,0.70)',
  textFaint:    'rgba(20,20,24,0.52)',

  // Interval colours are mid-tones with their own darker stroke, so the
  // same four read on white as well as on black.
  root:    ROOT,
  third:   THIRD,
  fifth:   FIFTH,
  ext:     EXT,
  scale:   { fill: 'rgba(18,18,24,0.08)', stroke: 'rgba(18,18,24,0.30)', text: 'rgba(20,20,24,0.92)' },
  ghost:   { fill: 'rgba(18,18,24,0.03)', stroke: 'rgba(18,18,24,0.14)', text: 'rgba(20,20,24,0.40)' },
  tone:    { fill: '#DCD9D2', stroke: '#75726A', text: '#141418' },

  fb: {
    inlay:       'rgba(18,18,24,0.10)',
    fret:        'rgba(18,18,24,0.24)',
    fretStrong:  'rgba(18,18,24,0.45)',
    string:      'rgba(18,18,24,0.74)',
    nut:         '#35353B',
    label:       'rgba(18,18,24,0.90)',
    ring:        '#141418',
    ghostFill:   'rgba(18,18,24,0.04)',
    ghostStroke: 'rgba(18,18,24,0.20)',
  },

  pos: POS,
  caged: CAGED,

  accent:      '#5546CC',                 // darker indigo: ~6:1 on white
  accentSoft:  'rgba(85,70,204,0.12)',
  accentGlow:  'rgba(85,70,204,0.28)',
  accentLight: 'rgba(85,70,204,0.12)',
  accentText:  '#4A3CC0',

  gold:        '#7A6100',
  goldSoft:    'rgba(214,180,20,0.12)',
  goldBorder:  'rgba(150,120,0,0.45)',
  success:     '#0E7A5A',
  danger:      '#C73432',
};

// ── Theme switch ─────────────────────────────────────────────────────────────
export type ThemeName = 'dark' | 'light';
const PALETTES: Record<ThemeName, Palette> = { dark: DARK, light: LIGHT };
const THEME_KEY = 'fretionary_theme_v1';

let activeTheme: ThemeName = 'dark';
const themeListeners = new Set<() => void>();

// COLORS reads through to whichever palette is active, so inline uses in
// render (`color={COLORS.accent}`) follow the theme with no extra wiring.
// Anything captured at module scope would freeze at the launch theme — build
// stylesheets with makeStyles() instead of a top-level StyleSheet.create().
export const COLORS = {} as Palette;
(Object.keys(DARK) as (keyof Palette)[]).forEach(key => {
  Object.defineProperty(COLORS, key, {
    enumerable: true,
    get: () => PALETTES[activeTheme][key],
  });
});

export function getThemeName(): ThemeName { return activeTheme; }

function applyTheme(name: ThemeName) {
  activeTheme = name;
  // Keep native chrome (keyboard, alerts, pickers) in step with the app.
  try { Appearance.setColorScheme(name); } catch {}
  themeListeners.forEach(l => l());
}

export function setThemeName(name: ThemeName) {
  if (name === activeTheme) return;
  applyTheme(name);
  AsyncStorage.setItem(THEME_KEY, name).catch(() => {});
}

// Called once from the root layout before the first screen renders, so a
// light-theme user never sees a dark flash on launch. Never rejects.
export async function loadTheme(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(THEME_KEY);
    applyTheme(saved === 'light' ? 'light' : 'dark');
  } catch {
    applyTheme('dark');
  }
}

function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  return () => { themeListeners.delete(listener); };
}

// Subscribes the calling component to theme changes.
export function useThemeName(): ThemeName {
  return useSyncExternalStore(subscribeTheme, getThemeName, getThemeName);
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

// Themed replacement for a module-level StyleSheet.create(). Returns a hook;
// each palette's sheet is built once on first use, then cached.
export function makeStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  factory: (colors: Palette) => T & NamedStyles<any>,
): () => T {
  const cache: Partial<Record<ThemeName, T>> = {};
  return function useStyles() {
    const name = useThemeName();
    return (cache[name] ??= StyleSheet.create(factory(PALETTES[name])));
  };
}

export const FONT = {
  regular: { fontWeight: '400' as const },
  medium:  { fontWeight: '500' as const },
  bold:    { fontWeight: '700' as const },
};

// Section-label treatment — small all-caps mono with wide tracking.
// `color` is a getter so spreading this into a makeStyles() sheet picks up
// the palette being built.
export const SECTION_LABEL = {
  fontSize: 10,
  fontWeight: '600' as const,
  get color() { return COLORS.textFaint; },
  letterSpacing: 1.2,
  textTransform: 'uppercase' as const,
  fontFamily: FONT_FAMILY.mono,
};

export const RADIUS = {
  sm: 6, md: 10, lg: 14, xl: 20, full: 999,
};

export const SPACE = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
};

// Helper used by callers that want platform-specific tabular numerals.
export const TABULAR_NUMS = Platform.select({
  ios: { fontVariant: ['tabular-nums' as const] },
  default: {},
});
