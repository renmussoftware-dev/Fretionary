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
  for (let startFret = 0; startFret <= 15; startFret++) {
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
      positions.push({ start: startFret, end: Math.min(startFret + 4, 22) });
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
