export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type NoteName = typeof NOTES[number];

export const NOTE_DISPLAY: Record<string, string> = {
  'C#': 'C#/D♭', 'D#': 'D#/E♭', 'F#': 'F#/G♭', 'G#': 'G#/A♭', 'A#': 'A#/B♭',
};

export const NOTE_FLAT: Record<string, string> = {
  'C#': 'D♭', 'D#': 'E♭', 'F#': 'G♭', 'G#': 'A♭', 'A#': 'B♭',
};

// Standard tuning: e B G D A E (string 0 = high e)
export const OPEN_STRINGS = [4, 11, 7, 2, 9, 4] as const;
export const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'] as const;

export const INTERVAL_NAMES = ['R', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'];

export interface ScaleDef {
  steps: number[];
  degrees: string[];
  formula: string;
  category: 'major' | 'minor' | 'pentatonic' | 'mode' | 'other';
  description: string;
}

export const SCALES: Record<string, ScaleDef> = {
  'Major': {
    steps: [2,2,1,2,2,2,1], degrees: ['1','2','3','4','5','6','7'],
    formula: 'W W H W W W H', category: 'major',
    description: 'The foundation of Western music. Bright, happy sound.',
  },
  'Natural Minor': {
    steps: [2,1,2,2,1,2,2], degrees: ['1','2','♭3','4','5','♭6','♭7'],
    formula: 'W H W W H W W', category: 'minor',
    description: 'Dark, emotive. Used in countless rock and classical pieces.',
  },
  'Harmonic Minor': {
    steps: [2,1,2,2,1,3,1], degrees: ['1','2','♭3','4','5','♭6','7'],
    formula: 'W H W W H WH H', category: 'minor',
    description: 'Minor with raised 7th. Exotic, dramatic flavor.',
  },
  'Melodic Minor': {
    steps: [2,1,2,2,2,2,1], degrees: ['1','2','♭3','4','5','6','7'],
    formula: 'W H W W W W H', category: 'minor',
    description: 'Jazz staple. Smoother ascending minor scale.',
  },
  'Pentatonic Major': {
    steps: [2,2,3,2,3], degrees: ['1','2','3','5','6'],
    formula: 'W W WH W WH', category: 'pentatonic',
    description: '5-note scale. Works over almost anything. Country and blues.',
  },
  'Pentatonic Minor': {
    steps: [3,2,2,3,2], degrees: ['1','♭3','4','5','♭7'],
    formula: 'WH W W WH W', category: 'pentatonic',
    description: 'The most common rock/blues scale. Never sounds wrong.',
  },
  'Blues': {
    steps: [3,2,1,1,3,2], degrees: ['1','♭3','4','♯4','5','♭7'],
    formula: 'WH W H H WH W', category: 'pentatonic',
    description: 'Pentatonic minor + blue note. Essential for blues and rock.',
  },
  'Dorian': {
    steps: [2,1,2,2,2,1,2], degrees: ['1','2','♭3','4','5','6','♭7'],
    formula: 'W H W W W H W', category: 'mode',
    description: 'Minor mode with raised 6th. Jazz and funk favorite.',
  },
  'Phrygian': {
    steps: [1,2,2,2,1,2,2], degrees: ['1','♭2','♭3','4','5','♭6','♭7'],
    formula: 'H W W W H W W', category: 'mode',
    description: 'Dark Spanish/Flamenco sound. Starts with a half step.',
  },
  'Lydian': {
    steps: [2,2,2,1,2,2,1], degrees: ['1','2','3','♯4','5','6','7'],
    formula: 'W W W H W W H', category: 'mode',
    description: 'Dreamy, ethereal major mode. Raised 4th is the signature.',
  },
  'Mixolydian': {
    steps: [2,2,1,2,2,1,2], degrees: ['1','2','3','4','5','6','♭7'],
    formula: 'W W H W W H W', category: 'mode',
    description: 'Major with flat 7th. Dominant, bluesy. Classic rock staple.',
  },
  'Locrian': {
    steps: [1,2,2,1,2,2,2], degrees: ['1','♭2','♭3','4','♭5','♭6','♭7'],
    formula: 'H W W H W W W', category: 'mode',
    description: 'Darkest mode. Diminished fifth. Used in metal.',
  },
  'Whole Tone': {
    steps: [2,2,2,2,2,2], degrees: ['1','2','3','♯4','♯5','♭7'],
    formula: 'W W W W W W', category: 'other',
    description: 'All whole steps. Dreamy, ambiguous. Debussy.',
  },
  'Diminished (HW)': {
    steps: [1,2,1,2,1,2,1,2], degrees: ['1','♭2','♭3','3','♯4','5','6','♭7'],
    formula: 'H W H W H W H W', category: 'other',
    description: 'Symmetrical 8-note scale. Jazz and metal.',
  },
};

export interface ChordDef {
  intervals: number[];
  intervalNames: string[];
  category: 'triad' | 'seventh' | 'extended' | 'altered' | 'sus';
  description: string;
}

// Friendly long-form name for an interval symbol used in the chord-detail
// "Interval structure" cards. Falls back to the raw symbol for any rare
// interval not in the map.
const INTERVAL_LONG_NAMES: Record<string, string> = {
  'R':    'Root',
  '♭2':   'Minor 2nd',
  '2':    'Major 2nd',
  '♭3':   'Minor 3rd',
  '3':    'Major 3rd',
  '4':    'Perfect 4th',
  '♭5':   'Diminished 5th',
  '5':    'Perfect 5th',
  '♯5':   'Augmented 5th',
  '♭6':   'Minor 6th',
  '6':    'Major 6th',
  '♭7':   'Minor 7th',
  '7':    'Major 7th',
  '♭♭7':  'Diminished 7th',
  '♭9':   'Minor 9th',
  '9':    '9th',
  '♯9':   'Augmented 9th',
  '11':   '11th',
  '♯11':  'Augmented 11th',
  '13':   '13th',
};

export function intervalLongName(symbol: string): string {
  return INTERVAL_LONG_NAMES[symbol] ?? symbol;
}

const SCALE_CATEGORY_LABELS: Record<ScaleDef['category'], string> = {
  major:      'Major scale',
  minor:      'Minor scale',
  pentatonic: 'Pentatonic scale',
  mode:       'Diatonic mode',
  other:      'Symmetric scale',
};

export function scaleCategoryLabel(cat: ScaleDef['category']): string {
  return SCALE_CATEGORY_LABELS[cat];
}

const CATEGORY_LABELS: Record<ChordDef['category'], string> = {
  triad:    'Triad',
  seventh:  'Seventh chord',
  extended: 'Extended chord',
  altered:  'Altered chord',
  sus:      'Suspended chord',
};

export function categoryLabel(cat: ChordDef['category']): string {
  return CATEGORY_LABELS[cat];
}

// Map an interval symbol to one of the four note-color buckets used on the
// fretboard so the interval-structure cards match the dot palette.
export function intervalColorBucket(symbol: string): 'root' | 'third' | 'fifth' | 'ext' {
  if (symbol === 'R') return 'root';
  if (symbol === '3' || symbol === '♭3') return 'third';
  if (symbol === '5' || symbol === '♭5' || symbol === '♯5') return 'fifth';
  return 'ext';
}

/**
 * Like intervalColorBucket but for scale-degree symbols. Differs in two
 * places vs. the chord version:
 *   - Root for scales is '1' (not 'R').
 *   - Only 7ths route to 'ext'; 2nds, 4ths, and 6ths return 'tone' so they
 *     render as scaleTone gray rather than ext blue. In chord context every
 *     non-root/3rd/5th IS a structural tone (Sus4's 4 should be colored,
 *     Major6's 6 should be colored); in scale context, 2/4/6 are passing
 *     tones between chord-tone anchors and the convention is to leave them
 *     uncolored so the 1-3-5-7 arpeggio reads through the scale.
 */
export function scaleDegreeColorBucket(symbol: string): 'root' | 'third' | 'fifth' | 'ext' | 'tone' {
  if (symbol === '1' || symbol === 'R') return 'root';
  if (symbol === '3' || symbol === '♭3') return 'third';
  if (symbol === '5' || symbol === '♭5' || symbol === '♯5') return 'fifth';
  if (symbol === '7' || symbol === '♭7' || symbol === '♭♭7') return 'ext';
  return 'tone';
}

export const CHORDS: Record<string, ChordDef> = {
  'Major':       { intervals:[0,4,7],          intervalNames:['R','3','5'],             category:'triad',    description:'Bright and stable.' },
  'Minor':       { intervals:[0,3,7],          intervalNames:['R','♭3','5'],            category:'triad',    description:'Dark and emotive.' },
  'Diminished':  { intervals:[0,3,6],          intervalNames:['R','♭3','♭5'],          category:'triad',    description:'Tense, unstable.' },
  'Augmented':   { intervals:[0,4,8],          intervalNames:['R','3','♯5'],           category:'triad',    description:'Mysterious, floating.' },
  'Sus2':        { intervals:[0,2,7],          intervalNames:['R','2','5'],             category:'sus',      description:'Open, ambiguous.' },
  'Sus4':        { intervals:[0,5,7],          intervalNames:['R','4','5'],             category:'sus',      description:'Anticipatory tension.' },
  'Dom 7sus4':   { intervals:[0,5,7,10],       intervalNames:['R','4','5','♭7'],         category:'sus',      description:'Dominant 7 with the 3rd suspended to a 4th. Funk and modal jazz staple.' },
  '7sus2':       { intervals:[0,2,7,10],       intervalNames:['R','2','5','♭7'],         category:'sus',      description:'Dominant 7 with the 3rd suspended to a 2nd. Open and unresolved.' },
  'Maj7sus2':    { intervals:[0,2,7,11],       intervalNames:['R','2','5','7'],          category:'sus',      description:'Major 7 with the 3rd suspended to a 2nd. Floating, ambiguous.' },
  'Maj7sus4':    { intervals:[0,5,7,11],       intervalNames:['R','4','5','7'],          category:'sus',      description:'Major 7 with the 3rd suspended to a 4th. Airy, never quite settles.' },
  '9sus4':       { intervals:[0,5,7,10,14],    intervalNames:['R','4','5','♭7','9'],     category:'sus',      description:'The sus9 sound. Gospel, soul and modal jazz.' },
  'Power (5)':   { intervals:[0,7],            intervalNames:['R','5'],                 category:'triad',    description:'Root + 5th. Rock staple.' },
  'Major 6':     { intervals:[0,4,7,9],        intervalNames:['R','3','5','6'],         category:'seventh',  description:'Sweet jazz color.' },
  'Minor 6':     { intervals:[0,3,7,9],        intervalNames:['R','♭3','5','6'],       category:'seventh',  description:'Bittersweet quality.' },
  'Dominant 7':  { intervals:[0,4,7,10],       intervalNames:['R','3','5','♭7'],       category:'seventh',  description:'Wants to resolve. Blues essential.' },
  'Major 7':     { intervals:[0,4,7,11],       intervalNames:['R','3','5','7'],         category:'seventh',  description:'Lush, romantic jazz.' },
  'Minor 7':     { intervals:[0,3,7,10],       intervalNames:['R','♭3','5','♭7'],     category:'seventh',  description:'Smooth, melancholic.' },
  'Minor Maj7':  { intervals:[0,3,7,11],       intervalNames:['R','♭3','5','7'],       category:'seventh',  description:'Dark, cinematic.' },
  'Dim 7':       { intervals:[0,3,6,9],        intervalNames:['R','♭3','♭5','♭♭7'],  category:'seventh',  description:'Maximum tension. Symmetrical.' },
  'Half-Dim 7':  { intervals:[0,3,6,10],       intervalNames:['R','♭3','♭5','♭7'],   category:'seventh',  description:'Minor 7 flat 5. ii chord in minor.' },
  'Aug 7':       { intervals:[0,4,8,10],       intervalNames:['R','3','♯5','♭7'],     category:'seventh',  description:'Dominant with raised 5th.' },
  'Maj7♯5':      { intervals:[0,4,8,11],       intervalNames:['R','3','♯5','7'],      category:'seventh',  description:'Major 7 with a raised 5th. Lydian augmented colour.' },
  'Dominant 9':  { intervals:[0,4,7,10,14],    intervalNames:['R','3','5','♭7','9'],   category:'extended', description:'Rich dominant extension. R&B.' },
  'Major 9':     { intervals:[0,4,7,11,14],    intervalNames:['R','3','5','7','9'],     category:'extended', description:'Bright and expansive.' },
  'Minor 9':     { intervals:[0,3,7,10,14],    intervalNames:['R','♭3','5','♭7','9'], category:'extended', description:'Lush minor color.' },
  'Add9':        { intervals:[0,4,7,14],       intervalNames:['R','3','5','9'],         category:'extended', description:'Major with 9th, no 7th.' },
  'Dominant 11': { intervals:[0,4,7,10,14,17], intervalNames:['R','3','5','♭7','9','11'], category:'extended', description:'Full dominant stack.' },
  'Major 11':    { intervals:[0,4,7,11,14,17], intervalNames:['R','3','5','7','9','11'],  category:'extended', description:'Sophisticated jazz voicing.' },
  'Minor 11':    { intervals:[0,3,7,10,14,17], intervalNames:['R','♭3','5','♭7','9','11'], category:'extended', description:'Modal jazz staple.' },
  'Dominant 13': { intervals:[0,4,7,10,14,17,21], intervalNames:['R','3','5','♭7','9','11','13'], category:'extended', description:'Full jazz dominant.' },
  'Major 13':    { intervals:[0,4,7,11,14,17,21], intervalNames:['R','3','5','7','9','11','13'],   category:'extended', description:'Maximum major extension.' },
  'Minor 13':    { intervals:[0,3,7,10,14,17,21], intervalNames:['R','♭3','5','♭7','9','11','13'], category:'extended', description:'Full minor extension. Rich, complex jazz color.' },
  'Minor Add9':  { intervals:[0,3,7,14],           intervalNames:['R','♭3','5','9'],               category:'triad',    description:'Minor triad with added 9th. Emotional and open.' },
  'Add11':       { intervals:[0,4,7,17],           intervalNames:['R','3','5','11'],               category:'triad',    description:'Major triad with added 11th. Bright and expansive.' },
  '6/9':         { intervals:[0,4,7,9,14],         intervalNames:['R','3','5','6','9'],            category:'extended', description:'No 7th. Lush jazz voicing, works as a tonic.' },
  'Minor 6/9':   { intervals:[0,3,7,9,14],         intervalNames:['R','♭3','5','6','9'],           category:'extended', description:'Minor with 6th and 9th. Sophisticated jazz color.' },
  'Dom 7♭5':     { intervals:[0,4,6,10],           intervalNames:['R','3','♭5','♭7'],             category:'seventh',  description:'Dominant with flat 5. Tense tritone sound.' },
  'Dom 7♭9':     { intervals:[0,4,7,10,13],        intervalNames:['R','3','5','♭7','♭9'],         category:'extended', description:'Dark and tense. Classic jazz altered sound.' },
  'Dom 7♯9':     { intervals:[0,4,7,10,15],        intervalNames:['R','3','5','♭7','♯9'],         category:'extended', description:'The Hendrix chord. Blues, funk and rock.' },
  'Dom 7♯11':    { intervals:[0,4,7,10,18],        intervalNames:['R','3','5','♭7','♯11'],        category:'extended', description:'Lydian dominant. Jazz and fusion staple.' },
  'Maj7♯11':     { intervals:[0,4,7,11,18],        intervalNames:['R','3','5','7','♯11'],         category:'seventh',  description:'Lydian major 7th. Dreamy and floating.' },
  'Maj9♯11':     { intervals:[0,4,7,11,14,18],     intervalNames:['R','3','5','7','9','♯11'],     category:'extended', description:'Lydian major 9. Floating and cinematic.' },
};

export interface CagedShape {
  name: string;
  rootString: number; // which string the root sits on (0=high e)
  description: string;
  fretSpan: [number, number]; // offset from caret fret [lo, hi]
  openShape: string; // what open chord it resembles
}

// fretSpan is measured from the caret (the fret where rootString carries the
// root), so it depends on WHICH root string the shape is anchored to. Derive
// it from the open shape: take the root's fret on rootString as the caret,
// then offset the shape's lowest and highest fretted/open string from it.
//
//   shape  open voicing   fret extent   root frets (low→high strings)
//   C      x 3 2 0 1 0    0..3          A str 3, B str 1
//   A      x 0 2 2 2 0    0..2          A str 0, G str 2
//   G      3 2 0 0 0 3    0..3          low E 3, G str 0, high e 3
//   E      0 2 2 1 0 0    0..2          low E 0, D str 2, high e 0
//   D      x x 0 2 3 2    0..3          D str 0, B str 3
//
// e.g. C is anchored on the B string, whose root sits at fret 1 of an open
// C, and the shape runs 0..3 — so the span is [0-1, 3-1] = [-1, 2].
//
// These agree with VOICING_TEMPLATES, which encodes the same five shapes for
// 'Major' independently (note it indexes strings the other way round:
// 0=low E there, 0=high e here).
export const CAGED_SHAPES: Record<string, CagedShape> = {
  C: { name:'C shape', rootString:1, description:'Root on B string. Upper-neck brightness.', fretSpan:[-1,2], openShape:'C' },
  A: { name:'A shape', rootString:2, description:'Root on G string. Very common barre shape.', fretSpan:[-2,0], openShape:'A' },
  G: { name:'G shape', rootString:5, description:'Root on low E. Widest shape, spans 4+ frets.', fretSpan:[-3,0], openShape:'G' },
  E: { name:'E shape', rootString:5, description:'Root on low E & high e. Most common barre shape.', fretSpan:[0,2], openShape:'E' },
  // Anchored on the D string, not the high e: an open D is x x 0 2 3 2, so
  // the high e plays F# — the 3rd, not a root. Anchoring there put the caret
  // (and the whole highlight band) on a fret unrelated to the shape.
  D: { name:'D shape', rootString:3, description:'Root on D string. Bright upper voicing for lead lines.', fretSpan:[0,3], openShape:'D' },
};

export const CAGED_ORDER = ['C','A','G','E','D'] as const;
export type CagedLetter = typeof CAGED_ORDER[number];

// Per-shape pedagogical tips, surfaced in the Fretboard tab's CAGED detail card.
export const CAGED_SHAPE_TIPS: Record<CagedLetter, string[]> = {
  C: [
    'Root on B string (2nd string)',
    'Often used in upper fret positions',
    'Common in country and folk styles',
    'Connects to A shape above it',
  ],
  A: [
    'Root on G string (3rd string)',
    'Classic barre chord shape',
    'Works great for power chord extensions',
    'Connects to G shape above it',
  ],
  G: [
    'Root on low E string (6th string)',
    'Widest shape — spans 4+ frets',
    'Common in open position rock',
    'Connects to E shape above it',
  ],
  E: [
    'Root on low E AND high e strings',
    'Most common barre chord shape',
    'Foundation of rock guitar',
    'Connects to D shape above it',
  ],
  D: [
    'Root on D string (4th string)',
    'High e plays the 3rd, not the root',
    'Great for melodic lead work',
    'Connects to C shape above it',
  ],
};

// Note colors — Obsidian theme (rebalanced for harmony on dark surfaces).
// Same identity as before (root yellow / 3rd red / 5th green / ext blue) but
// lower-chroma so they sit alongside each other instead of competing.
export const COLORS = {
  root:       { fill:'#E0CC58', stroke:'#B49E2E', text:'#3E3208' },
  third:      { fill:'#D45846', stroke:'#9B3A2D', text:'#fff' },
  fifth:      { fill:'#3FA08A', stroke:'#26786A', text:'#fff' },
  extension:  { fill:'#5C8FCC', stroke:'#3D6BA0', text:'#fff' },
  // Solid neutral grey — still clearly subordinate to the colored interval
  // notes, but with real presence on the dark surface (the design's prior
  // 10% white was so faint the dots looked unrendered).
  scaleTone:  { fill:'#3F3F47', stroke:'#666670', text:'#E5E3DC' },
  ghost:      { fill:'#1A1A20', stroke:'#2E2E36', text:'rgba(242,241,236,0.30)' },
};

// Position colors — `light` is a translucent fill for use on a dark fretboard
// surface (was a pale tint designed for a light surface in the prior theme).
export const POSITION_COLORS = [
  { fill:'#6E60D9', light:'rgba(110,96,217,0.16)',  stroke:'#6E60D9' },
  { fill:'#D77144', light:'rgba(215,113,68,0.16)',  stroke:'#D77144' },
  { fill:'#3FA08A', light:'rgba(63,160,138,0.16)',  stroke:'#3FA08A' },
  { fill:'#5C8FCC', light:'rgba(92,143,204,0.16)',  stroke:'#5C8FCC' },
  { fill:'#C19052', light:'rgba(193,144,82,0.16)',  stroke:'#C19052' },
];

export const CAGED_COLORS: Record<string, { fill:string; light:string; stroke:string }> = {
  C: { fill:'#6E60D9', light:'rgba(110,96,217,0.16)', stroke:'#6E60D9' },
  A: { fill:'#D77144', light:'rgba(215,113,68,0.16)', stroke:'#D77144' },
  G: { fill:'#3FA08A', light:'rgba(63,160,138,0.16)', stroke:'#3FA08A' },
  E: { fill:'#5C8FCC', light:'rgba(92,143,204,0.16)', stroke:'#5C8FCC' },
  D: { fill:'#C19052', light:'rgba(193,144,82,0.16)', stroke:'#C19052' },
};
