// Fretionary — guitar theory, everywhere on the neck
export const APP_NAME = 'Fretionary';

import { Dimensions } from 'react-native';

export const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const COLORS = {
  bg:           '#0F0F11',
  surface:      '#1A1A1F',
  surfaceHigh:  '#232329',
  border:       '#2E2E38',
  borderLight:  '#3A3A46',
  text:         '#F0EFE8',
  textMuted:    '#888680',
  textFaint:    '#4A4A54',

  root:    { fill:'#E8D44D', stroke:'#C4A800', text:'#5C4400' },
  third:   { fill:'#E24B4A', stroke:'#A32D2D', text:'#fff' },
  fifth:   { fill:'#1D9E75', stroke:'#0F6E56', text:'#fff' },
  ext:     { fill:'#378ADD', stroke:'#185FA5', text:'#fff' },
  scale:   { fill:'#3A3A46', stroke:'#52525F', text:'#C0BEB8' },
  ghost:   { fill:'#1E1E24', stroke:'#2A2A34', text:'#3A3A46' },

  pos: [
    { fill:'#534AB7', light:'rgba(83,74,183,0.18)', stroke:'#3C3489' },
    { fill:'#D85A30', light:'rgba(216,90,48,0.18)',  stroke:'#993C1D' },
    { fill:'#1D9E75', light:'rgba(29,158,117,0.18)', stroke:'#0F6E56' },
    { fill:'#378ADD', light:'rgba(55,138,221,0.18)', stroke:'#185FA5' },
    { fill:'#BA7517', light:'rgba(186,117,23,0.18)', stroke:'#854F0B' },
  ],

  caged: {
    C: { fill:'#534AB7', light:'rgba(83,74,183,0.18)',  stroke:'#3C3489' },
    A: { fill:'#D85A30', light:'rgba(216,90,48,0.18)',  stroke:'#993C1D' },
    G: { fill:'#1D9E75', light:'rgba(29,158,117,0.18)', stroke:'#0F6E56' },
    E: { fill:'#378ADD', light:'rgba(55,138,221,0.18)', stroke:'#185FA5' },
    D: { fill:'#BA7517', light:'rgba(186,117,23,0.18)', stroke:'#854F0B' },
  } as Record<string, { fill:string; light:string; stroke:string }>,

  accent: '#534AB7',
  accentLight: 'rgba(83,74,183,0.18)',
};

export const FONT = {
  regular: { fontWeight: '400' as const },
  medium:  { fontWeight: '500' as const },
  bold:    { fontWeight: '700' as const },
};

export const RADIUS = {
  sm: 6, md: 10, lg: 14, xl: 20, full: 999,
};

export const SPACE = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
};
