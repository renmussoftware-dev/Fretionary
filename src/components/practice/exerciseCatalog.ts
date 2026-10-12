import { localDayNumber, mod } from '../../utils/dailyPick';
import {
  chromaticPattern, spiderPattern, stringSkipPattern, legatoPattern,
  octavesPattern, harmonizedPairPattern, fourthsFifthsPattern, intervalLadderPattern,
  triadInversionsPattern, harmonizedTriadsPattern, oneFourFivePattern,
  scaleUpDownPattern, scaleCellsPattern, scaleThirdsPattern, oneStringScalePattern,
  type ExercisePattern,
} from './exercisePatterns';

export type ExerciseCategory = 'warmup' | 'interval' | 'triad' | 'sequence';

export interface ExerciseDef {
  id: string;
  category: ExerciseCategory;
  title: string;
  summary: string;
  tip: string;
  usesKey: boolean;               // show the key picker
  variants?: string[];            // optional second picker; first entry is the default
  variantLabel?: string;
  variantKind?: 'scale';          // variants are SCALES keys, gated like the scale picker
  defaultBpm: number;
  minutes: number;
  build: (root: number, variant: string) => ExercisePattern;
}

export const CATEGORIES: { key: ExerciseCategory; title: string; blurb: string }[] = [
  { key: 'warmup',   title: 'Warm-ups',        blurb: 'Loosen up and sync both hands.' },
  { key: 'interval', title: 'Intervals',       blurb: 'Learn the distance between notes by shape.' },
  { key: 'triad',    title: 'Triads',          blurb: 'Three-note chords all over the neck.' },
  { key: 'sequence', title: 'Scale sequences', blurb: 'Turn scale shapes into music.' },
];

// Warm-up variants name the fret the index finger starts on.
const POSITIONS = ['5th fret', '1st fret', '9th fret'];
const positionOf = (v: string) => parseInt(v, 10) || 5;

const SPIDER_ORDERS = ['1-3-2-4', '1-4-2-3', '2-4-1-3', '1-2-4-3'];

// String index 0 = high e. Sets are listed low string first.
const STRING_SETS: Record<string, number[]> = {
  'Strings 1-2-3': [2, 1, 0],
  'Strings 2-3-4': [3, 2, 1],
  'Strings 3-4-5': [4, 3, 2],
  'Strings 4-5-6': [5, 4, 3],
};
const THIRD_PAIRS: Record<string, [number, number]> = {
  'Strings 1-2': [1, 0],
  'Strings 2-3': [2, 1],
  'Strings 3-4': [3, 2],
};
const SIXTH_PAIRS: Record<string, [number, number]> = {
  'Strings 1 and 3': [2, 0],
  'Strings 2 and 4': [3, 1],
  'Strings 3 and 5': [4, 2],
};
const INVERSIONS = ['Root position', '1st inversion', '2nd inversion'];
const NECK_POSITIONS = ['Low position', 'Middle position', 'High position'];

const SEQUENCE_SCALES = [
  'Major', 'Natural Minor', 'Pentatonic Minor', 'Pentatonic Major', 'Blues', 'Dorian', 'Mixolydian',
];
const scaleVariants = {
  variants: SEQUENCE_SCALES, variantLabel: 'Scale', variantKind: 'scale' as const,
};

export const EXERCISES: ExerciseDef[] = [
  // ── Warm-ups ───────────────────────────────────────────────────────────────
  {
    id: 'warmup-chromatic', category: 'warmup',
    title: 'Chromatic 1-2-3-4',
    summary: 'One finger per fret, across all six strings and back.',
    tip: 'Keep each finger down until the next one lands, and alternate your pick strokes.',
    usesKey: false, variants: POSITIONS, variantLabel: 'Position',
    defaultBpm: 60, minutes: 2,
    build: (_r, v) => chromaticPattern(positionOf(v)),
  },
  {
    id: 'warmup-spider', category: 'warmup',
    title: 'Spider walk',
    summary: 'The same four frets, with the fingers in a different order.',
    tip: 'Go slower than feels necessary. The aim is fingers that move independently, not speed.',
    usesKey: false, variants: SPIDER_ORDERS, variantLabel: 'Finger order',
    defaultBpm: 54, minutes: 2,
    build: (_r, v) => spiderPattern(5, v.split('-').map(Number)),
  },
  {
    id: 'warmup-skip', category: 'warmup',
    title: 'String skipping',
    summary: 'Skip a string going up, step one back, and repeat.',
    tip: 'Watch your picking hand. The skip is where the pick tends to catch the wrong string.',
    usesKey: false, variants: POSITIONS, variantLabel: 'Position',
    defaultBpm: 54, minutes: 2,
    build: (_r, v) => stringSkipPattern(positionOf(v)),
  },
  {
    id: 'warmup-legato', category: 'warmup',
    title: 'Legato ladder',
    summary: 'Hammer on up one string, pull off down the next.',
    tip: 'Pick only the first note on each string. Every note should ring as loud as the picked one.',
    usesKey: false, variants: POSITIONS, variantLabel: 'Position',
    defaultBpm: 60, minutes: 2,
    build: (_r, v) => legatoPattern(positionOf(v)),
  },

  // ── Intervals ──────────────────────────────────────────────────────────────
  {
    id: 'interval-octaves', category: 'interval',
    title: 'Octave shapes',
    summary: 'Find every root on the neck, lowest to highest.',
    tip: 'Notice the three shapes that link one root to the next. They are the same in every key.',
    usesKey: true, defaultBpm: 50, minutes: 3,
    build: r => octavesPattern(r),
  },
  {
    id: 'interval-thirds', category: 'interval',
    title: '3rds up the neck',
    summary: 'The major scale in 3rds on one pair of strings.',
    tip: 'There are only two shapes, major and minor. Say which one you are on as you move.',
    usesKey: true, variants: Object.keys(THIRD_PAIRS), variantLabel: 'Strings',
    defaultBpm: 60, minutes: 4,
    build: (r, v) => harmonizedPairPattern(r, ...(THIRD_PAIRS[v] ?? THIRD_PAIRS['Strings 1-2']), 2),
  },
  {
    id: 'interval-sixths', category: 'interval',
    title: '6ths up the neck',
    summary: 'The major scale in 6ths, skipping a string.',
    tip: 'Mute the string in between with the underside of your fretting finger.',
    usesKey: true, variants: Object.keys(SIXTH_PAIRS), variantLabel: 'Strings',
    defaultBpm: 60, minutes: 4,
    build: (r, v) => harmonizedPairPattern(r, ...(SIXTH_PAIRS[v] ?? SIXTH_PAIRS['Strings 1 and 3']), 5),
  },
  {
    id: 'interval-fourths-fifths', category: 'interval',
    title: '4ths and 5ths',
    summary: 'Root to 4th, root to 5th, from every string.',
    tip: 'Both shapes move up one fret when they cross from the G string to the B string.',
    usesKey: true, defaultBpm: 60, minutes: 3,
    build: r => fourthsFifthsPattern(r),
  },
  {
    id: 'interval-ladder', category: 'interval',
    title: 'Interval ladder',
    summary: 'Every interval from one root, along a single string.',
    tip: 'Name each interval out loud before you play it, then listen to how it sounds against the root.',
    usesKey: true, defaultBpm: 54, minutes: 4,
    build: r => intervalLadderPattern(r),
  },

  // ── Triads ─────────────────────────────────────────────────────────────────
  {
    id: 'triad-major', category: 'triad',
    title: 'Major triad inversions',
    summary: 'Every shape of one major triad on a three-string set.',
    tip: 'Track where the root is in each shape. It moves to a different string every time.',
    usesKey: true, variants: Object.keys(STRING_SETS), variantLabel: 'Strings',
    defaultBpm: 66, minutes: 4,
    build: (r, v) => triadInversionsPattern(r, 'Major', STRING_SETS[v] ?? STRING_SETS['Strings 1-2-3']),
  },
  {
    id: 'triad-minor', category: 'triad',
    title: 'Minor triad inversions',
    summary: 'Every shape of one minor triad on a three-string set.',
    tip: 'Each shape is the major one with the 3rd dropped a fret. Find the note that changed.',
    usesKey: true, variants: Object.keys(STRING_SETS), variantLabel: 'Strings',
    defaultBpm: 66, minutes: 4,
    build: (r, v) => triadInversionsPattern(r, 'Minor', STRING_SETS[v] ?? STRING_SETS['Strings 1-2-3']),
  },
  {
    id: 'triad-dim-aug', category: 'triad',
    title: 'Diminished and augmented',
    summary: 'The two less common triads, on the top three strings.',
    tip: 'Augmented shapes repeat every four frets. That is why one fingering covers all three inversions.',
    usesKey: true, variants: ['Diminished', 'Augmented'], variantLabel: 'Triad',
    defaultBpm: 60, minutes: 3,
    build: (r, v) => triadInversionsPattern(r, v === 'Augmented' ? 'Augmented' : 'Diminished', [2, 1, 0]),
  },
  {
    id: 'triad-harmonized', category: 'triad',
    title: 'Triads through the key',
    summary: 'All seven chords of the key, walked up the top three strings.',
    tip: 'Major, minor, minor, major, major, minor, diminished. The order is the same in every key.',
    usesKey: true, variants: INVERSIONS, variantLabel: 'Inversion',
    defaultBpm: 60, minutes: 4,
    build: (r, v) => harmonizedTriadsPattern(r, Math.max(0, INVERSIONS.indexOf(v))),
  },
  {
    id: 'triad-one-four-five', category: 'triad',
    title: 'I–IV–V voice leading',
    summary: 'Change chords by moving each note as little as possible.',
    tip: 'Look for the note the two chords share and leave that finger where it is.',
    usesKey: true, variants: NECK_POSITIONS, variantLabel: 'Position',
    defaultBpm: 66, minutes: 4,
    build: (r, v) => oneFourFivePattern(r, Math.max(0, NECK_POSITIONS.indexOf(v))),
  },

  // ── Scale sequences ────────────────────────────────────────────────────────
  {
    id: 'sequence-updown', category: 'sequence',
    title: 'Position up and down',
    summary: 'Two octaves in one hand position, root to root.',
    tip: 'Aim for every note the same length and volume before you raise the tempo.',
    usesKey: true, ...scaleVariants, defaultBpm: 72, minutes: 3,
    build: (r, v) => scaleUpDownPattern(r, v),
  },
  {
    id: 'sequence-threes', category: 'sequence',
    title: 'Sequence in 3s',
    summary: 'Three notes up, step back one, three more.',
    tip: 'Accent the first note of each group of three to keep your place.',
    usesKey: true, ...scaleVariants, defaultBpm: 66, minutes: 4,
    build: (r, v) => scaleCellsPattern(r, v, 3),
  },
  {
    id: 'sequence-fours', category: 'sequence',
    title: 'Sequence in 4s',
    summary: 'Four notes up, step back, four more.',
    tip: 'This is the pattern behind a lot of fast rock runs. Keep it even before making it quick.',
    usesKey: true, ...scaleVariants, defaultBpm: 66, minutes: 4,
    build: (r, v) => scaleCellsPattern(r, v, 4),
  },
  {
    id: 'sequence-thirds', category: 'sequence',
    title: 'Scale in 3rds',
    summary: 'Skip a note, step back, skip again.',
    tip: 'Many of the skips cross strings. Roll your fingertip across when both notes share a fret.',
    usesKey: true, ...scaleVariants, defaultBpm: 60, minutes: 4,
    build: (r, v) => scaleThirdsPattern(r, v),
  },
  {
    id: 'sequence-one-string', category: 'sequence',
    title: 'One-string scale',
    summary: 'The whole scale along a single string.',
    tip: 'With no shape to lean on you have to know the steps. Say whole or half as you shift.',
    usesKey: true, ...scaleVariants, defaultBpm: 60, minutes: 3,
    build: (r, v) => oneStringScalePattern(r, v),
  },
];

export function exercisesIn(category: ExerciseCategory): ExerciseDef[] {
  return EXERCISES.filter(e => e.category === category);
}

export interface DailySession {
  root: number;
  items: { def: ExerciseDef; minutes: number }[];
  totalMinutes: number;
}

/**
 * Today's guided session: a warm-up, a fretboard-knowledge exercise
 * (intervals and triads on alternating days), and a scale sequence, all in
 * one key. Deterministic by local date like the daily pick, so the card
 * doesn't reshuffle between opens and everyone gets the same session.
 */
export function getDailySession(date: Date = new Date()): DailySession {
  const day = localDayNumber(date);
  const warmups = exercisesIn('warmup');
  const knowledge = exercisesIn(mod(day, 2) === 0 ? 'interval' : 'triad');
  const sequences = exercisesIn('sequence');
  const picks = [
    warmups[mod(day, warmups.length)],
    knowledge[mod(Math.floor(day / 2), knowledge.length)],
    sequences[mod(day, sequences.length)],
  ];
  const items = picks.map(def => ({ def, minutes: def.minutes }));
  return {
    root: mod(day, 12),
    items,
    totalMinutes: items.reduce((sum, it) => sum + it.minutes, 0),
  };
}
