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
    if (stringNote === root) {
      // Shapes that reach below their caret can't be played at the lowest
      // root — the fingering would cross the nut. The A shape is anchored on
      // the G string and extends 2 frets down, so for root G (open G string,
      // caret 0) it wants frets -2..0; the real voicing is the octave up at
      // 10..12. Same for the C shape on low roots and the G shape at E/F/F#.
      return f + shapeInfo.fretSpan[0] < 0 ? f + 12 : f;
    }
  }
  return 0;
}

export function getCagedFretRange(root: number, shape: CagedLetter) {
  const cf = getCagedCaretFret(root, shape);
  const [lo, hi] = CAGED_SHAPES[shape].fretSpan;
  return { start: Math.max(0, cf + lo), end: cf + hi, caretFret: cf };
}

// ── Enharmonic spelling ─────────────────────────────────────────────────────
// The NOTES constant is sharps-only, which is fine for pitch-class math but
// wrong for displaying scales/chords: in C Dorian the ♭7 is B♭, never A♯,
// because a diatonic scale should use each letter A–G exactly once. This
// section spells notes based on their SCALE OR CHORD DEGREE — a proper
// music-theory display.

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const LETTER_PITCH: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NATURAL_LETTER: Record<number, string> = { 0:'C', 2:'D', 4:'E', 5:'F', 7:'G', 9:'A', 11:'B' };

// Fallback root letter when there's no scale/chord context to choose with.
// Mirrors the app's sharps-only NOTES display: a black key takes the letter
// one step BELOW its pitch class (C# → C, F# → F).
function rootLetterOf(rootPitch: number): string {
  return NATURAL_LETTER[rootPitch] ?? NATURAL_LETTER[(rootPitch - 1 + 12) % 12];
}

// Spell a note based on its degree within the current scale/chord. degreeIdx
// is 0-based (0 = root, 1 = 2nd/9th, 2 = 3rd, 3 = 4th/11th, 4 = 5th, 5 =
// 6th/13th, 6 = 7th) and wraps at 7 for chord extensions. The target letter
// is degreeIdx letters up from the root letter; the accidental is chosen so
// the letter's pitch aligns with notePitch.
//
// rootLetter lets the caller override which letter the root itself uses —
// that's how a flat key gets spelled (root 3 as 'E' → E♭ Dorian rather than
// 'D' → D# Dorian). Omit it to fall back to the sharp-biased default.
export function spellNoteAt(
  rootPitch: number,
  degreeIdx: number,
  notePitch: number,
  rootLetter?: string,
): string {
  const rl = rootLetter ?? rootLetterOf(rootPitch);
  const rootLetterIdx = LETTERS.indexOf(rl as typeof LETTERS[number]);
  const targetLetter = LETTERS[(rootLetterIdx + degreeIdx) % 7];
  const naturalPitch = LETTER_PITCH[targetLetter];
  // Signed distance from the letter's natural pitch to the target pitch,
  // normalized to -6..+5 so we pick the shortest sharp/flat direction.
  let diff = (notePitch - naturalPitch + 12) % 12;
  if (diff > 6) diff -= 12;
  if (diff === 0)  return targetLetter;
  if (diff === 1)  return targetLetter + '#';
  if (diff === -1) return targetLetter + '♭';
  if (diff === 2)  return targetLetter + '##';
  if (diff === -2) return targetLetter + '♭♭';
  return NOTES[notePitch]; // extreme case: our degree logic is off
}

// Parse a scale or chord degree symbol (R / 1 / ♭3 / ♯4 / 9 / ♭♭7 / etc.)
// into its 0-6 letter offset from the root. 9 → 1 (same letter class as 2),
// 11 → 3, 13 → 5. Accidentals don't move the letter, only the pitch.
export function symbolToDegreeIdx(symbol: string): number {
  if (symbol === 'R' || symbol === '1') return 0;
  const num = parseInt(symbol.replace(/[^0-9]/g, ''), 10);
  if (isNaN(num) || num === 0) return 0;
  return (num - 1) % 7;
}

// ── Root spelling ───────────────────────────────────────────────────────────
// A root is stored as a bare pitch class, and the display default is the
// sharp name. That's wrong for flat keys: root 3 spelled 'D' gives
// D# Dorian → D# E# F# G# A# B# C#, when a player would write
// E♭ Dorian → E♭ F G♭ A♭ B♭ C D♭.
//
// Rather than add a "preferred name" to the store (which would need
// migration and a choice at every call site that sets a root), we derive it:
// spell the whole scale/chord BOTH ways and keep whichever needs fewer
// accidentals. That's the same criterion a musician uses, and it
// automatically adapts to the scale — F# Lydian needs 7 sharps so it comes
// out G♭ Lydian, while F# Major (6 sharps vs 6 flats) stays F#.

// How many accidentals it costs to call `notePitch` by `letter`. 1 for a
// single sharp/flat, 2 for a double. Anything beyond that is unspellable and
// gets a large penalty so the other candidate always wins.
function accidentalCost(letter: string, notePitch: number): number {
  let diff = (notePitch - LETTER_PITCH[letter] + 12) % 12;
  if (diff > 6) diff -= 12;
  const n = Math.abs(diff);
  return n <= 2 ? n : 99;
}

// Some pitch classes tie: D# minor and E♭ minor are both real keys, 6 sharps
// against 6 flats, and the count can't separate them. Both are defensible
// theory, so the tiebreak is usage — which one a player would actually write.
// E♭/A♭/B♭ dominate their sharp twins in practice; C#/F# dominate theirs.
// This ONLY applies on an exact tie; any real difference in accidental count
// decides on its own (that's why F# Lydian still comes out G♭ Lydian).
const TIE_PREFERS_FLAT: Record<number, boolean> = {
  1:  false, // C# over D♭
  3:  true,  // E♭ over D#
  6:  false, // F# over G♭
  8:  true,  // A♭ over G#
  10: true,  // B♭ over A#
};

// The letters a pitch class can legitimately be named by. Naturals have
// exactly one; a black key has two — the letter below it with a sharp, or
// the letter above it with a flat. Preferred spelling comes first, so a
// strict < in bestRootLetter keeps it on a tie.
function rootLetterCandidates(rootPitch: number): string[] {
  const natural = NATURAL_LETTER[rootPitch];
  if (natural) return [natural];
  const sharpLetter = NATURAL_LETTER[(rootPitch - 1 + 12) % 12];
  const sharpIdx = LETTERS.indexOf(sharpLetter as typeof LETTERS[number]);
  const flatLetter = LETTERS[(sharpIdx + 1) % 7];
  return TIE_PREFERS_FLAT[rootPitch]
    ? [flatLetter, sharpLetter]
    : [sharpLetter, flatLetter];
}

// Pick the root letter that spells this whole (degree, pitch) set with the
// fewest accidentals.
function bestRootLetter(
  rootPitch: number,
  pairs: { degreeIdx: number; pitch: number }[],
): string {
  const candidates = rootLetterCandidates(rootPitch);
  if (candidates.length === 1) return candidates[0];
  let best = candidates[0];
  let bestCost = Infinity;
  for (const cand of candidates) {
    const ri = LETTERS.indexOf(cand as typeof LETTERS[number]);
    let cost = 0;
    for (const p of pairs) {
      cost += accidentalCost(LETTERS[(ri + p.degreeIdx) % 7], p.pitch);
    }
    // Strict < keeps the first (sharp) candidate on a tie.
    if (cost < bestCost) { bestCost = cost; best = cand; }
  }
  return best;
}

// noteLabel runs once per fretboard dot (up to ~150 on a 24-fret neck), and
// each call would otherwise re-spell the entire scale twice to pick a letter.
// The answer only depends on root + scale/chord, so cache it.
const rootLetterCache = new Map<string, string>();

export function scaleRootLetter(root: number, scaleKey: string): string {
  const cacheKey = `s${root}|${scaleKey}`;
  const hit = rootLetterCache.get(cacheKey);
  if (hit !== undefined) return hit;
  const sc = SCALES[scaleKey];
  const notes = getScaleNotes(root, scaleKey);
  // Non-7-note scales (pentatonic, blues, whole tone, diminished) skip or
  // double up letters, so the degree symbols — not the array index — say
  // which letter each note takes.
  const letter = sc
    ? bestRootLetter(root, notes.map((pitch, i) => ({
        degreeIdx: symbolToDegreeIdx(sc.degrees[i] ?? String(i + 1)),
        pitch,
      })))
    : rootLetterOf(root);
  rootLetterCache.set(cacheKey, letter);
  return letter;
}

export function chordRootLetter(root: number, chordKey: string): string {
  const cacheKey = `c${root}|${chordKey}`;
  const hit = rootLetterCache.get(cacheKey);
  if (hit !== undefined) return hit;
  const ch = CHORDS[chordKey];
  const letter = ch
    ? bestRootLetter(root, ch.intervals.map((iv, i) => ({
        degreeIdx: symbolToDegreeIdx(ch.intervalNames[i]),
        pitch: (root + iv) % 12,
      })))
    : rootLetterOf(root);
  rootLetterCache.set(cacheKey, letter);
  return letter;
}

// Which letter offset each note of a scale takes. Pulled out because both
// noteLabel and InfoPanel need it and getting it from the array index is
// only correct for 7-note scales.
export function scaleDegreeIdxAt(scaleKey: string, i: number): number {
  const sc = SCALES[scaleKey];
  return symbolToDegreeIdx(sc?.degrees[i] ?? String(i + 1));
}

// Display name of a root in the context it's being used in — "E♭" rather
// than "D#" for a flat key. These are what titles and headers should render.
export function scaleRootName(root: number, scaleKey: string): string {
  return spellNoteAt(root, 0, root, scaleRootLetter(root, scaleKey));
}

export function chordRootName(root: number, chordKey: string): string {
  return spellNoteAt(root, 0, root, chordRootLetter(root, chordKey));
}

// Name a chord sitting on a degree of a key. Spelling a chord in isolation
// isn't always enough inside a progression: chordRootName(6, 'Major') is
// F# on its own, but the IV of D♭ major is G♭. degreeIdx is the chord's
// 0-based position in the key's scale (I = 0, ii = 1, ... vii = 6).
export function diatonicChordRootName(
  keyRoot: number,
  degreeIdx: number,
  chordRoot: number,
): string {
  return spellNoteAt(keyRoot, degreeIdx, chordRoot, scaleRootLetter(keyRoot, 'Major'));
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
  if (labelMode === 'name') {
    // Context-aware spelling: pick the letter+accidental that makes each
    // scale degree use a unique letter (C Dorian → B♭, not A♯). Falls back
    // to sharps-only NOTES when there's no scale/chord context to key off.
    if (mode === 'scales' || mode === 'caged') {
      // CAGED overlays major-scale notes; scales mode uses the active scale.
      const key = mode === 'caged' ? 'Major' : scaleKey;
      const sc = SCALES[key];
      if (sc) {
        const scNotes = getScaleNotes(root, key);
        const pos = scNotes.indexOf(noteIdx);
        // scaleDegreeIdxAt reads the scale's degree symbols rather than the
        // array position — pentatonic and blues skip letters, so position
        // isn't the degree (Pentatonic Minor's 2nd note is the ♭3, not the 2nd).
        if (pos >= 0) {
          return spellNoteAt(root, scaleDegreeIdxAt(key, pos), noteIdx, scaleRootLetter(root, key));
        }
      }
      return NOTES[noteIdx];
    }
    if (mode === 'chords') {
      const ch = CHORDS[chordKey];
      if (ch) {
        const intv = (noteIdx - root + 12) % 12;
        const pos = ch.intervals.map(i => i % 12).indexOf(intv);
        if (pos >= 0) {
          return spellNoteAt(
            root, symbolToDegreeIdx(ch.intervalNames[pos]), noteIdx,
            chordRootLetter(root, chordKey),
          );
        }
      }
      return NOTES[noteIdx];
    }
    // custom / identify mode — no scale-or-chord context, fall back to sharps
    return NOTES[noteIdx];
  }
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
