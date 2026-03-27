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

export function getScalePositions(root: number, scaleKey: string) {
  const notes = getScaleNotes(root, scaleKey);
  const positions: { start: number; end: number }[] = [];
  for (let startFret = 0; startFret <= 15; startFret++) {
    let maxF = 0, minF = 99, count = 0;
    for (let s = 0; s < 6; s++) {
      for (let f = startFret; f <= startFret + 4; f++) {
        const n = (OPEN_STRINGS[s] + f) % 12;
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
    const sc = SCALES[scaleKey];
    const scNotes = getScaleNotes(root, scaleKey);
    const pos = scNotes.indexOf(noteIdx);
    return pos >= 0 && sc ? sc.degrees[pos] : NOTES[noteIdx];
  }
  return NOTES[noteIdx];
}

// Build chord voicings for box diagram (standard cowboy/barre shapes)
export interface ChordVoicing {
  frets: (number | null)[]; // null = muted, 0 = open, 1+ = fret number
  fingers: (number | null)[];
  baseFret: number;
  barre?: { fret: number; fromString: number; toString: number };
  name: string;
}

export function getChordVoicings(root: number, chordKey: string): ChordVoicing[] {
  const chordNotes = getChordNotes(root, chordKey);
  const voicings: ChordVoicing[] = [];

  // Search for voicings in first 14 frets
  const fretRange = 4;
  for (let baseFret = 0; baseFret <= 10; baseFret++) {
    const fretAssignments: (number | null)[] = new Array(6).fill(null);
    let valid = true;
    let rootFound = false;
    let notesCovered = new Set<number>();

    for (let s = 5; s >= 0; s--) {
      let bestFret: number | null = null;
      for (let f = baseFret === 0 ? 0 : baseFret; f <= baseFret + fretRange; f++) {
        const n = (OPEN_STRINGS[s] + f) % 12;
        if (chordNotes.includes(n)) {
          if (bestFret === null) bestFret = f;
          if (n === root && !rootFound) { bestFret = f; rootFound = true; break; }
        }
      }
      fretAssignments[s] = bestFret;
      if (bestFret !== null) {
        notesCovered.add((OPEN_STRINGS[s] + bestFret) % 12);
      }
    }

    const chordSet = new Set(chordNotes);
    const coveredAll = [...chordSet].every(n => notesCovered.has(n));
    const usedStrings = fretAssignments.filter(f => f !== null).length;

    if (coveredAll && usedStrings >= Math.min(4, chordNotes.length) && rootFound) {
      const nonNullFrets = fretAssignments.filter(f => f !== null && f > 0) as number[];
      const minFret = nonNullFrets.length ? Math.min(...nonNullFrets) : 0;
      const maxFret = nonNullFrets.length ? Math.max(...nonNullFrets) : 0;
      if (maxFret - minFret <= fretRange) {
        voicings.push({
          frets: fretAssignments,
          fingers: new Array(6).fill(null),
          baseFret: baseFret === 0 ? 1 : baseFret,
          name: `${NOTES[root]} ${chordKey}`,
        });
        if (voicings.length >= 3) break;
      }
    }
  }

  return voicings.slice(0, 3);
}
