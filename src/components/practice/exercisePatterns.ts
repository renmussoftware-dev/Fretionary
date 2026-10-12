import {
  CHORDS, SCALES, INTERVAL_NAMES,
  intervalColorBucket, intervalLongName, scaleDegreeColorBucket,
} from '../../constants/music';
import { chordSymbol, diatonicChordRootName, getScaleNotes } from '../../utils/theory';

// Standard tuning, string 0 = high e (matches OPEN_STRINGS and
// PracticeFretboard). Exercises are fingering patterns, so like the drills
// they stay in standard tuning regardless of the tuning picked elsewhere.
const OPEN_MIDI = [64, 59, 55, 50, 45, 40];
const STRING_LABELS = ['high e', 'B', 'G', 'D', 'A', 'low E'];
const LOW_TO_HIGH = [5, 4, 3, 2, 1, 0];

// Highest fret any pattern may ask for — reachable on an acoustic.
export const EXERCISE_MAX_FRET = 15;

export type StepBucket = 'root' | 'third' | 'fifth' | 'ext' | 'tone';

export interface ExerciseStep {
  stringIdx: number;
  fret: number;
  label: string;
  bucket: StepBucket;
  group: number;      // index of the shape / cell / string run this note belongs to
}

export interface ExercisePattern {
  steps: ExerciseStep[];          // one note per click, looped
  groupNames?: string[];          // optional caption per group ("1st inversion", "ii · Am")
  beats: number;                  // clicks per bar — the accent lands on each group
}

type Note = Omit<ExerciseStep, 'group'>;
interface Group { name?: string; notes: Note[] }

const pc = (n: number) => ((n % 12) + 12) % 12;
const pitchAt = (s: number, f: number) => OPEN_MIDI[s] + f;
// Lowest fret >= min on string s that sounds the given pitch class.
const lowestFret = (s: number, pitchClass: number, min = 0) =>
  min + pc(pitchClass - OPEN_MIDI[s] - min);

function toPattern(groups: Group[], beats: number): ExercisePattern {
  const steps: ExerciseStep[] = [];
  groups.forEach((g, gi) => g.notes.forEach(n => steps.push({ ...n, group: gi })));
  const named = groups.some(g => g.name);
  return { steps, beats, groupNames: named ? groups.map(g => g.name ?? '') : undefined };
}

// Up through the groups and back down without repeating either end, so the
// loop point lands cleanly on the first group again.
function upAndBack<T>(items: T[]): T[] {
  return items.length < 3 ? items : [...items, ...items.slice(1, -1).reverse()];
}

// ── Warm-ups ─────────────────────────────────────────────────────────────────
// Finger patterns, not notes: labels are fretting-hand finger numbers and
// `pos` is the fret the index finger sits on.

function fingerGroup(s: number, pos: number, fingers: number[]): Group {
  return {
    notes: fingers.map(f => ({
      stringIdx: s, fret: pos + f - 1, label: String(f), bucket: 'tone' as const,
    })),
  };
}

export function chromaticPattern(pos: number): ExercisePattern {
  const up = LOW_TO_HIGH.map(s => fingerGroup(s, pos, [1, 2, 3, 4]));
  const down = [...LOW_TO_HIGH].reverse().map(s => fingerGroup(s, pos, [4, 3, 2, 1]));
  return toPattern([...up, ...down], 4);
}

export function spiderPattern(pos: number, order: number[]): ExercisePattern {
  const up = LOW_TO_HIGH.map(s => fingerGroup(s, pos, order));
  const down = [...LOW_TO_HIGH].reverse().map(s => fingerGroup(s, pos, [...order].reverse()));
  return toPattern([...up, ...down], 4);
}

export function stringSkipPattern(pos: number): ExercisePattern {
  // Strings 6-4-5-3-4-2-3-1: skip one up, step one back.
  const order = [5, 3, 4, 2, 3, 1, 2, 0];
  const up = order.map(s => fingerGroup(s, pos, [1, 2, 3, 4]));
  const down = [...order].reverse().map(s => fingerGroup(s, pos, [4, 3, 2, 1]));
  return toPattern([...up, ...down], 4);
}

export function legatoPattern(pos: number): ExercisePattern {
  // Hammer on up one string, pull off down the next.
  const up = LOW_TO_HIGH.map((s, i) => fingerGroup(s, pos, i % 2 === 0 ? [1, 2, 3, 4] : [4, 3, 2, 1]));
  const down = [...up].reverse().map(g => ({ notes: [...g.notes].reverse() }));
  return toPattern([...up, ...down], 4);
}

// ── Intervals ────────────────────────────────────────────────────────────────

const MAJOR = [0, 2, 4, 5, 7, 9, 11];

function intervalNote(s: number, fret: number, semis: number): Note {
  const label = INTERVAL_NAMES[pc(semis)];
  return { stringIdx: s, fret, label, bucket: intervalColorBucket(label) };
}

export function octavesPattern(root: number): ExercisePattern {
  const spots: { s: number; f: number }[] = [];
  for (const s of LOW_TO_HIGH) {
    for (let f = 0; f <= EXERCISE_MAX_FRET; f++) {
      if (pc(pitchAt(s, f)) === root) spots.push({ s, f });
    }
  }
  // Low to high in pitch; the same pitch on two strings goes lower string first.
  spots.sort((a, b) => pitchAt(a.s, a.f) - pitchAt(b.s, b.f) || b.s - a.s);
  return toPattern(
    spots.map(p => ({ notes: [{ stringIdx: p.s, fret: p.f, label: 'R', bucket: 'root' as const }] })),
    4,
  );
}

/**
 * The major scale harmonized in diatonic intervals up one pair of strings:
 * degreeOffset 2 gives 3rds, 5 gives 6ths. Starts on the lowest scale tone
 * where both notes are on the neck, which is why it doesn't always open on
 * the tonic — a full octave from the tonic would run past fret 15 in most keys.
 */
export function harmonizedPairPattern(
  root: number, lowS: number, highS: number, degreeOffset: number,
): ExercisePattern {
  const build = (startFret: number): Group[] | null => {
    const groups: Group[] = [];
    for (let f = startFret; groups.length < 8; f++) {
      if (f > EXERCISE_MAX_FRET) return null;
      const d = MAJOR.indexOf(pc(pitchAt(lowS, f) - root));
      if (d < 0) continue;
      const d2 = (d + degreeOffset) % 7;
      const semis = pc(MAJOR[d2] - MAJOR[d]);
      const upFret = pitchAt(lowS, f) + semis - OPEN_MIDI[highS];
      if (upFret < 0 || upFret > EXERCISE_MAX_FRET) return null;
      const lowLabel = String(d + 1);
      const upLabel = String(d2 + 1);
      groups.push({
        name: intervalLongName(INTERVAL_NAMES[semis]),
        notes: [
          { stringIdx: lowS, fret: f, label: lowLabel, bucket: scaleDegreeColorBucket(lowLabel) },
          { stringIdx: highS, fret: upFret, label: upLabel, bucket: scaleDegreeColorBucket(upLabel) },
        ],
      });
    }
    return groups;
  };
  for (let start = 0; start <= EXERCISE_MAX_FRET; start++) {
    if (MAJOR.indexOf(pc(pitchAt(lowS, start) - root)) < 0) continue;
    const groups = build(start);
    if (groups) return toPattern(upAndBack(groups), 2);
  }
  return toPattern([], 2);
}

export function fourthsFifthsPattern(root: number): ExercisePattern {
  // Root on each of the five lower strings, with the 4th and 5th on the
  // string above. The shapes shift a fret when they cross from G to B.
  const groups = [5, 4, 3, 2, 1].map(s => {
    const rf = lowestFret(s, root);
    const upper = s - 1;
    const gap = OPEN_MIDI[upper] - OPEN_MIDI[s];
    const rootNote = intervalNote(s, rf, 0);
    return {
      name: `Root on the ${STRING_LABELS[s]} string`,
      notes: [
        rootNote, intervalNote(upper, rf + 5 - gap, 5),
        rootNote, intervalNote(upper, rf + 7 - gap, 7),
      ],
    };
  });
  return toPattern(groups, 4);
}

// The string whose root sits lowest on the neck (always fret 0–2 in standard
// tuning), so a full octave above it stays under fret 15.
function lowRootString(root: number): { s: number; rf: number } {
  for (const s of LOW_TO_HIGH) {
    const rf = lowestFret(s, root);
    if (rf <= 2) return { s, rf };
  }
  return { s: 5, rf: lowestFret(5, root) };
}

export function intervalLadderPattern(root: number): ExercisePattern {
  const { s, rf } = lowRootString(root);
  const groups: Group[] = [];
  for (let i = 1; i <= 12; i++) {
    groups.push({
      name: i === 12 ? 'Octave' : intervalLongName(INTERVAL_NAMES[i]),
      notes: [intervalNote(s, rf, 0), intervalNote(s, rf + i, i)],
    });
  }
  return toPattern(upAndBack(groups), 2);
}

// ── Triads ───────────────────────────────────────────────────────────────────

const INVERSION_NAMES = ['Root position', '1st inversion', '2nd inversion'];

interface Voicing { inversion: number; notes: Note[] }

/**
 * Every closed voicing of a triad on three adjacent strings (given low to
 * high), sorted up the neck.
 */
export function closedVoicings(root: number, chordKey: string, strings: number[]): Voicing[] {
  const ch = CHORDS[chordKey];
  const out: Voicing[] = [];
  for (let inv = 0; inv < 3; inv++) {
    const order = [0, 1, 2].map(i => (inv + i) % 3);
    for (let f = 0; f <= EXERCISE_MAX_FRET; f++) {
      if (pc(pitchAt(strings[0], f)) !== pc(root + ch.intervals[order[0]])) continue;
      let pitch = pitchAt(strings[0], f);
      const frets = [f];
      for (let i = 1; i < 3; i++) {
        pitch += pc(ch.intervals[order[i]] - ch.intervals[order[i - 1]]);
        frets.push(pitch - OPEN_MIDI[strings[i]]);
      }
      if (frets.some(x => x < 0 || x > EXERCISE_MAX_FRET)) continue;
      out.push({
        inversion: inv,
        notes: frets.map((fret, i) => {
          const label = ch.intervalNames[order[i]];
          return { stringIdx: strings[i], fret, label, bucket: intervalColorBucket(label) };
        }),
      });
    }
  }
  return out.sort((a, b) => a.notes[0].fret - b.notes[0].fret);
}

export function triadInversionsPattern(root: number, chordKey: string, strings: number[]): ExercisePattern {
  const groups = closedVoicings(root, chordKey, strings)
    .map(v => ({ name: INVERSION_NAMES[v.inversion], notes: v.notes }));
  return toPattern(upAndBack(groups), 3);
}

const DIATONIC_QUALITY = ['Major', 'Minor', 'Minor', 'Major', 'Major', 'Minor', 'Diminished'];
const ROMAN = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const TOP_STRINGS = [2, 1, 0]; // G B e

function diatonicName(keyRoot: number, degree: number): string {
  const chordRoot = pc(keyRoot + MAJOR[degree]);
  const quality = DIATONIC_QUALITY[degree];
  return `${ROMAN[degree]} · ${chordSymbol(chordRoot, quality, diatonicChordRootName(keyRoot, degree, chordRoot))}`;
}

/** The seven triads of the key in one inversion, walked up the top three strings. */
export function harmonizedTriadsPattern(root: number, inversion: number): ExercisePattern {
  const all: (Group & { bass: number })[] = [];
  for (let d = 0; d < 7; d++) {
    for (const v of closedVoicings(pc(root + MAJOR[d]), DIATONIC_QUALITY[d], TOP_STRINGS)) {
      if (v.inversion !== inversion) continue;
      all.push({ name: diatonicName(root, d), notes: v.notes, bass: v.notes[0].fret });
    }
  }
  all.sort((a, b) => a.bass - b.bass);
  return toPattern(upAndBack(all.slice(0, 8)), 3);
}

/** I–IV–I–V on the top three strings, each change taking the nearest shape. */
export function oneFourFivePattern(root: number, position: number): ExercisePattern {
  const tonics = closedVoicings(root, 'Major', TOP_STRINGS);
  const tonic = tonics[Math.min(position, tonics.length - 1)];
  const nearest = (chordRoot: number): Voicing => {
    const dist = (v: Voicing) =>
      v.notes.reduce((sum, n, i) => sum + Math.abs(n.fret - tonic.notes[i].fret), 0);
    return closedVoicings(chordRoot, 'Major', TOP_STRINGS)
      .reduce((best, v) => (dist(v) < dist(best) ? v : best));
  };
  const one = { name: diatonicName(root, 0), notes: tonic.notes };
  return toPattern([
    one,
    { name: diatonicName(root, 3), notes: nearest(pc(root + 5)).notes },
    one,
    { name: diatonicName(root, 4), notes: nearest(pc(root + 7)).notes },
  ], 3);
}

// ── Scale sequences ──────────────────────────────────────────────────────────

/**
 * Two octaves of a scale in one hand position, root to root, low to high.
 *
 * The position is the 5-fret window starting one fret below the root on the
 * low E string. Five frets on strings a 4th apart cover every pitch exactly
 * once, so the window always holds the whole scale, and anchoring it a fret
 * under the root lands on the fingerings players already know — the E-shape
 * major scale, the natural minor position, pentatonic box 1.
 */
export function positionNotes(root: number, scaleKey: string): Note[] {
  const sc = SCALES[scaleKey];
  const pcs = getScaleNotes(root, scaleKey);
  const rootFret = lowestFret(5, root, 1);
  const lo = rootFret - 1;
  const seen = new Set<number>();
  const notes: (Note & { pitch: number })[] = [];
  for (const s of LOW_TO_HIGH) {
    for (let f = lo; f <= lo + 4; f++) {
      const pitch = pitchAt(s, f);
      const i = pcs.indexOf(pc(pitch));
      // G-string fret lo+4 and B-string fret lo are the same pitch; the
      // lower string is visited first and keeps it.
      if (i < 0 || seen.has(pitch)) continue;
      seen.add(pitch);
      const label = sc.degrees[i];
      notes.push({ stringIdx: s, fret: f, label, bucket: scaleDegreeColorBucket(label), pitch });
    }
  }
  const bottom = pitchAt(5, rootFret);
  return notes
    .filter(n => n.pitch >= bottom && n.pitch <= bottom + 24)
    .sort((a, b) => a.pitch - b.pitch)
    .map(({ pitch, ...n }) => n);
}

export function scaleUpDownPattern(root: number, scaleKey: string): ExercisePattern {
  const run = upAndBack(positionNotes(root, scaleKey));
  // One group per stretch on a single string, so the string being played lights up.
  const groups: Group[] = [];
  for (const n of run) {
    const last = groups[groups.length - 1];
    if (last && last.notes[0].stringIdx === n.stringIdx) last.notes.push(n);
    else groups.push({ notes: [n] });
  }
  return toPattern(groups, 4);
}

/** Cells of `size` consecutive scale notes, stepping up one note at a time, then back down. */
export function scaleCellsPattern(root: number, scaleKey: string, size: number): ExercisePattern {
  const n = positionNotes(root, scaleKey);
  const groups: Group[] = [];
  for (let i = 0; i + size <= n.length; i++) groups.push({ notes: n.slice(i, i + size) });
  for (let i = n.length - 1; i - size + 1 >= 0; i--) {
    groups.push({ notes: n.slice(i - size + 1, i + 1).reverse() });
  }
  return toPattern(groups, size);
}

/** Every other scale note: 1-3, 2-4, 3-5 … up, then back down. */
export function scaleThirdsPattern(root: number, scaleKey: string): ExercisePattern {
  const n = positionNotes(root, scaleKey);
  const groups: Group[] = [];
  for (let i = 0; i + 2 < n.length; i++) groups.push({ notes: [n[i], n[i + 2]] });
  for (let i = n.length - 1; i - 2 >= 0; i--) groups.push({ notes: [n[i], n[i - 2]] });
  return toPattern(groups, 2);
}

export function oneStringScalePattern(root: number, scaleKey: string): ExercisePattern {
  const sc = SCALES[scaleKey];
  const { s, rf } = lowRootString(root);
  const notes: Note[] = [];
  let fret = rf;
  for (let i = 0; i <= sc.steps.length; i++) {
    const label = sc.degrees[i % sc.degrees.length];
    notes.push({ stringIdx: s, fret, label, bucket: scaleDegreeColorBucket(label) });
    fret += sc.steps[i % sc.steps.length];
  }
  return toPattern([{ notes: upAndBack(notes) }], 4);
}
