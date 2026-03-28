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

export interface ChordVoicing {
  frets: (number | null)[];
  baseFret: number;
  rootFret: number;    // actual fret where the root note sits
  label: string;
  position: string;
}

export function getChordVoicings(root: number, chordKey: string): ChordVoicing[] {
  const ch = CHORDS[chordKey];
  if (!ch) return [];
  const chordNotes = ch.intervals.map((iv: number) => (root + iv) % 12);
  const chordSet = new Set(chordNotes);
  const results: ChordVoicing[] = [];
  const windows = [0, 2, 4, 5, 7, 9, 10, 12];

  for (const startFret of windows) {
    const endFret = startFret === 0 ? 4 : startFret + 4;
    const frets: (number | null)[] = [];
    let rootFound = false;
    let rootFret = 1;
    const covered = new Set<number>();

    for (let s = 5; s >= 0; s--) {
      let best: number | null = null;
      for (let f = startFret === 0 ? 0 : startFret; f <= endFret; f++) {
        const n = (OPEN_STRINGS[s] + f) % 12;
        if (chordSet.has(n)) {
          if (best === null) best = f;
          if (n === root && !rootFound && s >= 3) { best = f; rootFound = true; rootFret = f; break; }
        }
      }
      frets.push(best);
      if (best !== null) covered.add((OPEN_STRINGS[s] + best) % 12);
    }

    if (![...chordSet].every(n => covered.has(n))) continue;
    const usedStrings = frets.filter(f => f !== null).length;
    if (usedStrings < Math.min(4, chordNotes.length)) continue;
    if (!rootFound && chordNotes.length > 1) continue;

    const pressed = frets.filter(f => f !== null && f > 0) as number[];
    if (pressed.length > 0 && Math.max(...pressed) - Math.min(...pressed) > 4) continue;

    // ── Playability pass: mute strings that break contiguous fingering ──
    // frets[0]=low E, frets[5]=high e
    // Rule 1: find the lowest played string (root side), then mute any
    //   string that has a gap (null) between it and the root string.
    // Rule 2: working from highest string downward, mute strings that
    //   are duplicate chord tones, keeping playability tight.
    const playable = [...frets] as (number | null)[];

    // Find root string index (lowest string with root note)
    let rootStringIdx = -1;
    for (let i = 0; i < 6; i++) {
      const f = playable[i];
      if (f !== null && (OPEN_STRINGS[5 - i] + f) % 12 === root) {
        rootStringIdx = i; break;
      }
    }

    // Mute strings below rootStringIdx (they can\'t be played cleanly)
    if (rootStringIdx > 0) {
      for (let i = 0; i < rootStringIdx; i++) playable[i] = null;
    }

    // Find the contiguous block from rootStringIdx upward
    // Mute any string that has a gap after it in the played block
    if (rootStringIdx >= 0) {
      let lastPlayed = rootStringIdx;
      for (let i = rootStringIdx + 1; i < 6; i++) {
        if (playable[i] !== null) {
          // Check for gap — if previous string (i-1) was null and i>lastPlayed+1, mute this too
          if (i > lastPlayed + 1) { playable[i] = null; }
          else { lastPlayed = i; }
        }
      }
    }

    // Verify all chord tones still covered after muting
    const playableCovered = new Set<number>();
    playable.forEach((f, i) => {
      if (f !== null) playableCovered.add((OPEN_STRINGS[5 - i] + f) % 12);
    });
    if (![...chordSet].every(n => playableCovered.has(n))) continue;

    const baseFret = pressed.length > 0 ? Math.min(...pressed) : 1;
    const displayBase = startFret === 0 ? 1 : baseFret;

    if (results.some(v => Math.abs(v.baseFret - displayBase) <= 1)) continue;

    const isOpen = startFret === 0 && frets.some(f => f === 0);
    const label = isOpen ? 'Open position' : `${displayBase}${displayBase === 1 ? 'st' : displayBase === 2 ? 'nd' : displayBase === 3 ? 'rd' : 'th'} fret`;
    const position = isOpen ? 'Open' : displayBase <= 3 ? 'Low' : displayBase <= 7 ? 'Mid' : 'High';

    results.push({ frets: playable, baseFret: displayBase, rootFret, label, position });
    if (results.length >= 5) break;
  }

  return results;
}
