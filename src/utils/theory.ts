import {
  NOTES, OPEN_STRINGS, SCALES, CHORDS, CAGED_SHAPES, CAGED_ORDER,
  type CagedLetter,
} from '../constants/music';

export function getScaleNotes(root: number, scaleKey: string): number[] {
  const sc = SCALES[scaleKey];
  if (!sc) return [root];
  const notes = [root];
  let cur = root;
  for (let i = 0; i < sc.steps.length - 1; i++) {
    cur = (cur + sc.steps[i]) % 12;
    notes.push(cur);
  }
  return notes;
}

export function getChordNotes(root: number, chordKey: string): number[] {
  const ch = CHORDS[chordKey];
  if (!ch) return [root];
  return ch.intervals.map(iv => (root + iv) % 12);
}

export function getScalePositions(
  root: number,
  scaleKey: string,
  noteClasses: readonly number[] = OPEN_STRINGS,
) {
  const notes = getScaleNotes(root, scaleKey);
  const positions: { start: number; end: number }[] = [];
  for (let startFret = 0; startFret <= 20; startFret++) {
    let maxF = 0, minF = 99, count = 0;
    for (let s = 0; s < 6; s++) {
      for (let f = startFret; f <= startFret + 4; f++) {
        const n = (noteClasses[s] + f) % 12;
        if (notes.includes(n)) {
          if (f > maxF) maxF = f;
          if (f < minF) minF = f;
          count++;
        }
      }
    }
    if (count >= 4 && maxF - startFret <= 4) {
      positions.push({ start: startFret, end: Math.min(startFret + 4, 24) });
    }
  }
  const merged: { start: number; end: number }[] = [];
  for (const p of positions) {
    if (!merged.length || p.start > merged[merged.length - 1].start + 2) {
      merged.push(p);
    }
  }
  return merged.slice(0, 5);
}

export function getCagedCaretFret(root: number, shape: CagedLetter): number {
  const shapeInfo = CAGED_SHAPES[shape];
  for (let f = 0; f <= 12; f++) {
    const stringNote = (OPEN_STRINGS[shapeInfo.rootString] + f) % 12;
    if (stringNote === root) return f;
  }
  return 0;
}

export function getCagedFretRange(root: number, shape: CagedLetter) {
  const cf = getCagedCaretFret(root, shape);
  const [lo, hi] = CAGED_SHAPES[shape].fretSpan;
  return { start: Math.max(0, cf + lo), end: cf + hi, caretFret: cf };
}

export function noteLabel(
  noteIdx: number,
  root: number,
  labelMode: string,
  scaleKey: string,
  chordKey: string,
  mode: string,
): string {
  if (labelMode === 'none') return '';
  if (labelMode === 'name') return NOTES[noteIdx];
  const intv = (noteIdx - root + 12) % 12;
  if (labelMode === 'interval') {
    const names = ['R','♭2','2','♭3','3','4','♭5','5','♭6','6','♭7','7'];
    return names[intv];
  }
  if (labelMode === 'degree') {
    if (mode === 'chords') {
      const ch = CHORDS[chordKey];
      const pos = ch?.intervals.map(i => i % 12).indexOf(intv) ?? -1;
      return pos >= 0 ? ch.intervalNames[pos] : NOTES[noteIdx];
    }
    if (mode === 'custom') {
      // No scale/chord context — fall through to interval names
      const names = ['R','♭2','2','♭3','3','4','♭5','5','♭6','6','♭7','7'];
      return names[intv];
    }
    const sc = SCALES[scaleKey];
    const scNotes = getScaleNotes(root, scaleKey);
    const pos = scNotes.indexOf(noteIdx);
    return pos >= 0 && sc ? sc.degrees[pos] : NOTES[noteIdx];
  }
  return NOTES[noteIdx];
}

import { VOICING_TEMPLATES } from '../constants/voicings';

export interface ChordVoicing {
  frets: (number | null)[];
  baseFret: number;
  rootFret: number;
  label: string;
  position: string;
}

// Find which fret a given note falls on a given string at or above minFret
function findNoteFret(stringIdx: number, noteClass: number, minFret: number): number | null {
  // stringIdx 0=low E, 5=high e; OPEN_STRINGS index 5=low E, 0=high e
  const openNote = OPEN_STRINGS[5 - stringIdx];
  for (let f = minFret; f <= minFret + 12; f++) {
    if ((openNote + f) % 12 === noteClass) return f;
  }
  return null;
}

export function getChordVoicings(root: number, chordKey: string): ChordVoicing[] {
  const templates = VOICING_TEMPLATES[chordKey];
  if (!templates || templates.length === 0) return [];

  const results: ChordVoicing[] = [];

  for (const tmpl of templates) {
    const rootStringOpen = OPEN_STRINGS[5 - tmpl.rootString];
    let rootFret: number | null = null;

    // Find root fret on the template's root string
    for (let rf = 0; rf <= 12; rf++) {
      if ((rootStringOpen + rf) % 12 === root) {
        rootFret = rf;
        break;
      }
    }

    if (rootFret === null) continue;

    // Build absolute fret positions — offsets can be negative (strings tuned
    // above the root string may need frets below rootFret to voice the chord)
    const frets: (number | null)[] = tmpl.frets.map(f => {
      if (f === null) return null;
      const abs = rootFret! + f;
      return abs < 0 ? null : abs; // mute if goes below nut
    });

    // Skip a template when it can't actually be voiced for this root — i.e.
    // any non-null offset would land below fret 0 and get force-muted, leaving
    // a broken chord (e.g. a C-shape barre played at A would have most strings
    // muted). Counts the would-be-muted strings; if >1 string is lost this way,
    // the shape isn't usable for this root.
    const lostToNegative = tmpl.frets.filter(f =>
      f !== null && (rootFret! + f) < 0,
    ).length;
    if (lostToNegative > 1) continue;

    const pressed = frets.filter(f => f !== null && f > 0) as number[];
    const hasOpenString = frets.some(f => f === 0);
    // If any string rings open, we have to show the nut — pinning baseFret to
    // 1 keeps fret 2 (and the open-string markers) where they belong.
    // Otherwise, slide the diagram down to start at the lowest pressed fret.
    const displayBase = hasOpenString
      ? 1
      : pressed.length > 0
        ? Math.min(...pressed)
        : rootFret;

    // Skip shapes that go above fret 12
    if (pressed.length > 0 && Math.max(...pressed) > 12) continue;

    results.push({
      frets,
      baseFret: displayBase,
      rootFret,
      label: rootFret === 0 ? tmpl.label : `${tmpl.label} (${rootFret}fr)`,
      position: tmpl.position,
    });
  }

  return results;
}

// ── Custom-tab note identifier ──────────────────────────────────────────────
// Given a set of selected pitch classes and the user's chosen root, return
// what those notes are *called*: a chord name, an interval, a single note, or
// "no exact match." Lets a beginner reverse-engineer what they've stumbled
// into on the fretboard.

// Friendly long-form interval names, indexed by semitone distance (0-11).
// Used for the 2-note "interval" identification path — beginners read
// "Perfect 5th" faster than the symbolic "5".
export const FRIENDLY_INTERVALS = [
  'Root',         // 0
  'Minor 2nd',    // 1
  'Major 2nd',    // 2
  'Minor 3rd',    // 3
  'Major 3rd',    // 4
  'Perfect 4th',  // 5
  'Tritone',      // 6
  'Perfect 5th',  // 7
  'Minor 6th',    // 8
  'Major 6th',    // 9
  'Minor 7th',    // 10
  'Major 7th',    // 11
];

export type Identification =
  | { kind: 'none' }
  | { kind: 'note';     idx: number }
  | { kind: 'interval'; rootIdx: number; otherIdx: number; semitones: number; name: string }
  // omitted5 / omittedRoot = true when the match required dropping that
  // note from the chord's full interval set to fit the user's selection.
  // Common on guitar: drop-5 for extended chords (grip space), drop-root
  // for jazz "rootless" voicings (bass player has the root), both for
  // upper-structure voicings. The UI surfaces these as small "no 5" /
  // "no root" tags so the chord name reads honestly against what's shown.
  | {
      kind: 'chord';
      rootIdx: number;
      chordKey: string;
      noteRoles: { note: number; symbol: string }[];
      omitted5?: boolean;
      omittedRoot?: boolean;
    }
  | { kind: 'noMatch';  notes: number[] };

// The interval symbols in CHORDS that represent the 5th and the root —
// used by the omit-tolerant matcher below to filter both the CANDIDATE
// target set (before compare) and the DISPLAYED noteRoles (after match).
// Root symbols: 'R' or '1'. Fifth symbols: '5', '♭5', '♯5'.
const ROOT_SYMBOLS = new Set(['R', '1']);
const FIFTH_SYMBOLS = new Set(['5', '♭5', '♯5']);

/**
 * Try to match noteSet against every chord in CHORDS, optionally dropping
 * the root and/or 5th from each chord's target pitch-class set before
 * comparing. Extracted as a helper so the three fallback passes (no-5,
 * no-root, no-root+no-5) stay short and readable.
 *
 * Filters:
 *   - The chord must have enough intervals to leave a ≥3-note shape after
 *     the omissions (a triad after dropping is still identifiable; a dyad
 *     isn't meaningful as "chord X with some notes missing").
 *   - The chord must actually CONTAIN the pitches we're planning to omit,
 *     otherwise it doesn't really match with "root/5th removed" — it's
 *     just a chord that never had them (e.g. Sus2 doesn't have a 3rd, but
 *     that's the chord's identity, not a partial voicing of something else).
 */
function findChordMatches(
  candidateRoots: number[],
  noteSet: Set<number>,
  omit: { root?: boolean; fifth?: boolean } = {},
): { rootIdx: number; chordKey: string; size: number }[] {
  const omitPitches: number[] = [];
  if (omit.root)  omitPitches.push(0);
  if (omit.fifth) omitPitches.push(7);
  const minIntervals = 3 + omitPitches.length;

  const found: { rootIdx: number; chordKey: string; size: number }[] = [];
  for (const candidateRoot of candidateRoots) {
    for (const [chordKey, def] of Object.entries(CHORDS)) {
      if (def.intervals.length < minIntervals) continue;
      // Chord must contain every pitch we plan to omit.
      let containsAll = true;
      for (const p of omitPitches) {
        if (!def.intervals.some(i => (i % 12) === p)) { containsAll = false; break; }
      }
      if (!containsAll) continue;

      const target = new Set(
        def.intervals
          .filter(i => !omitPitches.includes(i % 12))
          .map(i => (candidateRoot + i) % 12),
      );
      if (target.size !== noteSet.size) continue;
      let match = true;
      for (const n of noteSet) if (!target.has(n)) { match = false; break; }
      if (match) found.push({ rootIdx: candidateRoot, chordKey, size: def.intervals.length });
    }
  }
  return found;
}

export function identifyCustomSelection(
  notes: number[],
  preferredRoot: number,
): Identification {
  if (notes.length === 0) return { kind: 'none' };
  if (notes.length === 1) return { kind: 'note', idx: notes[0] };

  if (notes.length === 2) {
    // Use preferred root if it's one of the two; otherwise the lower pitch class.
    const rootIdx = notes.includes(preferredRoot) ? preferredRoot : Math.min(...notes);
    const otherIdx = notes.find(n => n !== rootIdx)!;
    const semitones = (otherIdx - rootIdx + 12) % 12;
    return {
      kind: 'interval', rootIdx, otherIdx, semitones,
      name: FRIENDLY_INTERVALS[semitones],
    };
  }

  // 3+ notes: search the chord dictionary in tiers, most specific first.
  // Each tier only runs if the previous one found nothing, so exact matches
  // always win over any partial-voicing interpretation.
  //
  //   Tier 1: exact set match at any selected note as root
  //   Tier 2: exact match with the 5th dropped (guitar-shell voicings)
  //   Tier 3: exact match with the root dropped, ONLY at preferredRoot when
  //           the user's root isn't in the selection (jazz rootless voicings —
  //           user says "root is C", plays E-G-B-D → C Major 9 rootless)
  //   Tier 4: exact match with both root AND 5th dropped, same restriction
  //           (upper-structure voicings, e.g., E-G-D over an implied C root)
  const noteSet = new Set(notes.map(n => n % 12));
  let omitted5 = false;
  let omittedRoot = false;

  let matches = findChordMatches(notes, noteSet);
  if (matches.length === 0) {
    matches = findChordMatches(notes, noteSet, { fifth: true });
    if (matches.length > 0) omitted5 = true;
  }
  // Root-drop passes: only when preferredRoot is NOT in the user's notes.
  // If it IS in their notes, an earlier pass would already have caught any
  // valid rooted interpretation.
  if (matches.length === 0 && !notes.includes(preferredRoot)) {
    matches = findChordMatches([preferredRoot], noteSet, { root: true });
    if (matches.length > 0) omittedRoot = true;
  }
  if (matches.length === 0 && !notes.includes(preferredRoot)) {
    matches = findChordMatches([preferredRoot], noteSet, { root: true, fifth: true });
    if (matches.length > 0) { omittedRoot = true; omitted5 = true; }
  }

  if (matches.length === 0) return { kind: 'noMatch', notes };

  // Prefer the user's selected root if it produced a match; otherwise prefer
  // the simpler chord definition (fewer intervals → less ambiguous reading).
  matches.sort((a, b) => {
    if (a.rootIdx === preferredRoot && b.rootIdx !== preferredRoot) return -1;
    if (b.rootIdx === preferredRoot && a.rootIdx !== preferredRoot) return 1;
    return a.size - b.size;
  });

  const best = matches[0];
  const def = CHORDS[best.chordKey];
  // Filter the displayed roles to match what the user actually selected —
  // drop the omitted 5/root symbols so "C (R) · E (3) · B (7) · D (9)"
  // reads honestly against the notes on screen for a Cmaj9-no-5 match.
  const noteRoles = def.intervals
    .map((iv, i) => ({ note: (best.rootIdx + iv) % 12, symbol: def.intervalNames[i] }))
    .filter(r =>
      !(omitted5   && FIFTH_SYMBOLS.has(r.symbol)) &&
      !(omittedRoot && ROOT_SYMBOLS.has(r.symbol)),
    );
  return {
    kind: 'chord',
    rootIdx: best.rootIdx,
    chordKey: best.chordKey,
    noteRoles,
    ...(omitted5    ? { omitted5:    true } : {}),
    ...(omittedRoot ? { omittedRoot: true } : {}),
  };
}
