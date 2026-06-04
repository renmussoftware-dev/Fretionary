// Tunings — each tuning provides per-string MIDI notes (low→high) and display
// names (high→low, matching Fretboard SVG row order: row 0 = high e on top).
//
// noteClasses (high→low) are derived from MIDI; provided as a convenience for
// fretboard math that uses the historical OPEN_STRINGS layout.

export interface Tuning {
  id: string;
  name: string;
  shortName: string;       // e.g. "STD", "Drop D" — fits in TopBar pill
  description: string;
  category: 'standard' | 'drop' | 'open' | 'modal' | 'down' | 'experimental';
  midi: number[];          // length 6, low→high (string idx 0 = low E in audio engine)
  stringNames: string[];   // length 6, high→low (matches Fretboard SVG ordering)
}

// MIDI ref: E2=40, A2=45, D3=50, G3=55, B3=59, E4=64
export const TUNINGS: Tuning[] = [
  {
    id: 'standard',
    name: 'Standard',
    shortName: 'STD',
    description: 'E A D G B E — the universal default.',
    category: 'standard',
    midi: [40, 45, 50, 55, 59, 64],
    stringNames: ['e', 'B', 'G', 'D', 'A', 'E'],
  },
  {
    id: 'drop-d',
    name: 'Drop D',
    shortName: 'Drop D',
    description: 'D A D G B E — low E dropped to D. Heavy riffs, easy power chords.',
    category: 'drop',
    midi: [38, 45, 50, 55, 59, 64],
    stringNames: ['e', 'B', 'G', 'D', 'A', 'D'],
  },
  {
    id: 'drop-c',
    name: 'Drop C',
    shortName: 'Drop C',
    description: 'C G C F A D — whole-step down + drop. Modern metal.',
    category: 'drop',
    midi: [36, 43, 48, 53, 57, 62],
    stringNames: ['d', 'A', 'F', 'C', 'G', 'C'],
  },
  {
    id: 'dadgad',
    name: 'DADGAD',
    shortName: 'DADGAD',
    description: 'D A D G A D — modal Celtic and folk tuning.',
    category: 'modal',
    midi: [38, 45, 50, 55, 57, 62],
    stringNames: ['d', 'A', 'G', 'D', 'A', 'D'],
  },
  {
    id: 'open-d',
    name: 'Open D',
    shortName: 'Open D',
    description: 'D A D F# A D — open strings strum a D major chord.',
    category: 'open',
    midi: [38, 45, 50, 54, 57, 62],
    stringNames: ['d', 'A', 'F#', 'D', 'A', 'D'],
  },
  {
    id: 'open-g',
    name: 'Open G',
    shortName: 'Open G',
    description: 'D G D G B D — slide blues and Keith Richards favorite.',
    category: 'open',
    midi: [38, 43, 50, 55, 59, 62],
    stringNames: ['d', 'B', 'G', 'D', 'G', 'D'],
  },
  {
    id: 'open-e',
    name: 'Open E',
    shortName: 'Open E',
    description: 'E B E G# B E — bright open major. Slide guitar staple.',
    category: 'open',
    midi: [40, 47, 52, 56, 59, 64],
    stringNames: ['e', 'B', 'G#', 'E', 'B', 'E'],
  },
  {
    id: 'facgce',
    name: 'FACGCE',
    shortName: 'FACGCE',
    description: 'F A C G C E — math rock tuning made famous by American Football. Ringing open voicings and unusual chord shapes.',
    category: 'experimental',
    midi: [41, 45, 48, 55, 60, 64],
    stringNames: ['e', 'C', 'G', 'C', 'A', 'F'],
  },
  {
    id: 'half-step-down',
    name: 'Eb Standard',
    shortName: 'Eb',
    description: 'Eb Ab Db Gb Bb Eb — half-step down. Hendrix, SRV, Van Halen.',
    category: 'down',
    midi: [39, 44, 49, 54, 58, 63],
    stringNames: ['eb', 'Bb', 'Gb', 'Db', 'Ab', 'Eb'],
  },
  {
    id: 'whole-step-down',
    name: 'D Standard',
    shortName: 'D Std',
    description: 'D G C F A D — whole-step down. Heavier rock and grunge.',
    category: 'down',
    midi: [38, 43, 48, 53, 57, 62],
    stringNames: ['d', 'A', 'F', 'C', 'G', 'D'],
  },
];

const TUNINGS_BY_ID: Record<string, Tuning> = Object.fromEntries(
  TUNINGS.map(t => [t.id, t]),
);

export const STANDARD_TUNING = TUNINGS_BY_ID['standard'];

export function getTuning(id: string): Tuning {
  return TUNINGS_BY_ID[id] ?? STANDARD_TUNING;
}

// Note-classes (0-11) ordered high→low to match the existing Fretboard layout
// (row 0 = high e on top). Derived from MIDI on demand.
export function tuningNoteClasses(t: Tuning): number[] {
  // midi is low→high; reverse to high→low and mod 12
  return [...t.midi].reverse().map(m => m % 12);
}
