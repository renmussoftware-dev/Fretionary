// Curated chord voicings — real shapes used by guitarists
// frets[0] = low E string, frets[5] = high e string
// null = muted, 0 = open, 1+ = fret number (relative to capo/barre)
// baseFret = the actual fret on the neck (0 = nut)
// rootFret = fret where root note sits (for the position marker label)

export interface CuratedVoicing {
  frets: (number | null)[];  // 6 strings, low E to high e
  baseFret: number;           // lowest fret shown in diagram (0 = open)
  rootFret: number;           // fret where root note sits
  label: string;              // display name
  position: string;           // 'open' | 'low' | 'mid' | 'high'
}

// Each entry: array of voicings for that chord type.
// Voicings are stored as semitone offsets FROM root = 0.
// The engine transposes them to any key.
// rootString: 0=low E, 1=A, 2=D, 3=G, 4=B, 5=high e
export interface VoicingTemplate {
  frets: (number | null)[];  // fret offsets from rootFret
  rootString: number;         // which string the root sits on (0=lowE)
  strings: number;            // how many strings used
  span: number;               // fret span
  label: string;
  position: 'open' | 'low' | 'mid' | 'high';
  requiresOpenStrings?: boolean; // if true, only valid in certain keys
}

// Open C shape voicings keyed by interval set (sorted intervals as string)
// This maps chord types to their standard templates
// Templates are in "shape space" — rootFret=0, all frets relative to root

export const VOICING_TEMPLATES: Record<string, VoicingTemplate[]> = {

  // ── Major ────────────────────────────────────────────────────────────
  'Major': [
    // E shape barre: low E root, full 6-string
    { frets: [0, 2, 2, 1, 0, 0], rootString: 0, strings: 6, span: 2, label: 'E shape', position: 'low' },
    // A shape barre: A string root, 5 strings
    { frets: [null, 0, 2, 2, 2, 0], rootString: 1, strings: 5, span: 2, label: 'A shape', position: 'mid' },
    // D shape: D string root, 4 strings
    { frets: [null, null, 0, 2, 3, 2], rootString: 2, strings: 4, span: 3, label: 'D shape', position: 'high' },
  ],

  // ── Minor ────────────────────────────────────────────────────────────
  'Minor': [
    // Em shape barre: low E root
    { frets: [0, 2, 2, 0, 0, 0], rootString: 0, strings: 6, span: 2, label: 'Em shape', position: 'low' },
    // Am shape barre: A string root
    { frets: [null, 0, 2, 2, 1, 0], rootString: 1, strings: 5, span: 2, label: 'Am shape', position: 'mid' },
    // Dm shape: D string root, 4 strings
    { frets: [null, null, 0, 2, 3, 1], rootString: 2, strings: 4, span: 3, label: 'Dm shape', position: 'high' },
  ],

  // ── Diminished ───────────────────────────────────────────────────────
  'Diminished': [
    // 3-string dim triad, high strings
    { frets: [null, null, null, 0, 2, 1], rootString: 3, strings: 3, span: 2, label: 'Dim triad', position: 'low' },
    // 4-string dim, A root
    { frets: [null, 0, 1, 2, 1, null], rootString: 1, strings: 4, span: 2, label: 'Dim (A root)', position: 'mid' },
  ],

  // ── Augmented ────────────────────────────────────────────────────────
  'Augmented': [
    { frets: [null, 0, 3, 2, 2, null], rootString: 1, strings: 4, span: 3, label: 'Aug shape', position: 'mid' },
    { frets: [null, null, 0, 3, 3, 2], rootString: 2, strings: 4, span: 3, label: 'Aug (D root)', position: 'high' },
  ],

  // ── Sus2 ─────────────────────────────────────────────────────────────
  'Sus2': [
    { frets: [null, 0, 2, 2, 0, 0], rootString: 1, strings: 5, span: 2, label: 'Sus2 (A root)', position: 'mid' },
    { frets: [null, null, 0, 2, 3, 0], rootString: 2, strings: 4, span: 3, label: 'Sus2 (D root)', position: 'high' },
  ],

  // ── Sus4 ─────────────────────────────────────────────────────────────
  'Sus4': [
    { frets: [null, 0, 2, 2, 3, 0], rootString: 1, strings: 5, span: 3, label: 'Sus4 (A root)', position: 'mid' },
    { frets: [null, null, 0, 2, 3, 3], rootString: 2, strings: 4, span: 3, label: 'Sus4 (D root)', position: 'high' },
  ],

  // ── Power (5th) ──────────────────────────────────────────────────────
  'Power (5)': [
    { frets: [0, 2, 2, null, null, null], rootString: 0, strings: 3, span: 2, label: 'Power (E root)', position: 'low' },
    { frets: [null, 0, 2, 2, null, null], rootString: 1, strings: 3, span: 2, label: 'Power (A root)', position: 'mid' },
  ],

  // ── Dominant 7 ───────────────────────────────────────────────────────
  'Dominant 7': [
    // E7 shape barre
    { frets: [0, 2, 0, 1, 0, 0], rootString: 0, strings: 6, span: 2, label: 'E7 shape', position: 'low' },
    // A7 shape barre
    { frets: [null, 0, 2, 0, 2, 0], rootString: 1, strings: 5, span: 2, label: 'A7 shape', position: 'mid' },
    // Jazz dom7: D string root, 4 strings
    { frets: [null, null, 0, 2, 1, 2], rootString: 2, strings: 4, span: 2, label: 'Jazz dom7', position: 'high' },
  ],

  // ── Major 7 ──────────────────────────────────────────────────────────
  'Major 7': [
    // Emaj7 shape barre
    { frets: [0, 2, 1, 1, 0, 0], rootString: 0, strings: 6, span: 2, label: 'Emaj7 shape', position: 'low' },
    // Jazz maj7: A root, 4 strings
    { frets: [null, 0, 2, 1, 2, null], rootString: 1, strings: 4, span: 2, label: 'Jazz maj7', position: 'mid' },
    // High jazz maj7: D root
    { frets: [null, null, 0, 2, 2, 2], rootString: 2, strings: 4, span: 2, label: 'Jazz maj7 (D)', position: 'high' },
  ],

  // ── Minor 7 ──────────────────────────────────────────────────────────
  'Minor 7': [
    // Em7 shape barre
    { frets: [0, 2, 0, 0, 0, 0], rootString: 0, strings: 6, span: 2, label: 'Em7 shape', position: 'low' },
    // Am7 shape barre
    { frets: [null, 0, 2, 0, 1, 0], rootString: 1, strings: 5, span: 2, label: 'Am7 shape', position: 'mid' },
    // Jazz min7: D root
    { frets: [null, null, 0, 2, 1, 1], rootString: 2, strings: 4, span: 2, label: 'Jazz min7 (D)', position: 'high' },
  ],

  // ── Minor Major 7 ────────────────────────────────────────────────────
  'Minor Maj7': [
    { frets: [null, 0, 2, 1, 1, 0], rootString: 1, strings: 5, span: 2, label: 'mMaj7 (A root)', position: 'mid' },
    { frets: [null, null, 0, 2, 2, 1], rootString: 2, strings: 4, span: 2, label: 'mMaj7 (D root)', position: 'high' },
  ],

  // ── Diminished 7 ─────────────────────────────────────────────────────
  'Dim 7': [
    // Symmetrical dim7: repeats every 3 frets
    { frets: [null, 0, 1, 2, 1, null], rootString: 1, strings: 4, span: 2, label: 'Dim7 (A root)', position: 'low' },
    { frets: [null, null, 0, 1, 0, 1], rootString: 2, strings: 4, span: 1, label: 'Dim7 (D root)', position: 'mid' },
  ],

  // ── Half-Diminished 7 ────────────────────────────────────────────────
  'Half-Dim 7': [
    { frets: [null, 0, 1, 2, 2, null], rootString: 1, strings: 4, span: 2, label: 'ø7 (A root)', position: 'low' },
    { frets: [null, null, 0, 1, 1, 1], rootString: 2, strings: 4, span: 1, label: 'ø7 (D root)', position: 'mid' },
  ],

  // ── Augmented 7 ──────────────────────────────────────────────────────
  'Aug 7': [
    { frets: [null, 0, 2, 0, 2, null], rootString: 1, strings: 4, span: 2, label: 'Aug7 (A root)', position: 'mid' },
    { frets: [null, null, 0, 3, 2, 2], rootString: 2, strings: 4, span: 3, label: 'Aug7 (D root)', position: 'high' },
  ],

  // ── Major 6 ──────────────────────────────────────────────────────────
  'Major 6': [
    { frets: [null, 0, 2, 2, 2, 2], rootString: 1, strings: 5, span: 2, label: 'Maj6 (A root)', position: 'mid' },
    { frets: [null, null, 0, 2, 2, 2], rootString: 2, strings: 4, span: 2, label: 'Maj6 (D root)', position: 'high' },
  ],

  // ── Minor 6 ──────────────────────────────────────────────────────────
  'Minor 6': [
    { frets: [null, 0, 2, 2, 1, 2], rootString: 1, strings: 5, span: 2, label: 'Min6 (A root)', position: 'mid' },
    { frets: [null, null, 0, 2, 0, 1], rootString: 2, strings: 4, span: 2, label: 'Min6 (D root)', position: 'high' },
  ],

  // ── Dominant 9 ───────────────────────────────────────────────────────
  'Dominant 9': [
    // Classic jazz dom9, A root
    { frets: [null, 0, 2, 1, 2, 2], rootString: 1, strings: 5, span: 2, label: 'Dom9 (A root)', position: 'mid' },
    // Dom9, E root
    { frets: [0, 2, 0, 1, 0, 2], rootString: 0, strings: 6, span: 2, label: 'Dom9 (E root)', position: 'low' },
  ],

  // ── Major 9 ──────────────────────────────────────────────────────────
  'Major 9': [
    { frets: [null, 0, 2, 1, 2, 0], rootString: 1, strings: 5, span: 2, label: 'Maj9 (A root)', position: 'mid' },
    { frets: [null, null, 0, 2, 2, 4], rootString: 2, strings: 4, span: 4, label: 'Maj9 (D root)', position: 'high' },
  ],

  // ── Minor 9 ──────────────────────────────────────────────────────────
  'Minor 9': [
    { frets: [null, 0, 2, 0, 1, 0], rootString: 1, strings: 5, span: 2, label: 'Min9 (A root)', position: 'mid' },
    { frets: [null, null, 0, 2, 1, 3], rootString: 2, strings: 4, span: 3, label: 'Min9 (D root)', position: 'high' },
  ],

  // ── Add9 ─────────────────────────────────────────────────────────────
  'Add9': [
    { frets: [null, 0, 2, 2, 2, 2], rootString: 1, strings: 5, span: 2, label: 'Add9 (A root)', position: 'mid' },
    { frets: [null, null, 0, 2, 3, 2], rootString: 2, strings: 4, span: 3, label: 'Add9 (D root)', position: 'high' },
  ],

  // ── Dominant 11 ──────────────────────────────────────────────────────
  'Dominant 11': [
    // Practical 4-string dom11
    { frets: [null, 0, 0, 0, 2, null], rootString: 1, strings: 4, span: 2, label: 'Dom11 (A root)', position: 'mid' },
    { frets: [null, null, 0, 0, 1, 1], rootString: 2, strings: 4, span: 1, label: 'Dom11 (D root)', position: 'high' },
  ],

  // ── Major 11 ─────────────────────────────────────────────────────────
  'Major 11': [
    { frets: [null, 0, 0, 0, 0, null], rootString: 1, strings: 4, span: 0, label: 'Maj11 (A root)', position: 'mid' },
    { frets: [null, null, 0, 0, 0, 0], rootString: 2, strings: 4, span: 0, label: 'Maj11 (D root)', position: 'high' },
  ],

  // ── Minor 11 ─────────────────────────────────────────────────────────
  'Minor 11': [
    { frets: [null, 0, 0, 0, 1, null], rootString: 1, strings: 4, span: 1, label: 'Min11 (A root)', position: 'mid' },
    { frets: [null, null, 0, 0, 1, 1], rootString: 2, strings: 4, span: 1, label: 'Min11 (D root)', position: 'high' },
  ],

  // ── Dominant 13 ──────────────────────────────────────────────────────
  'Dominant 13': [
    // Classic jazz dom13 voicing
    { frets: [null, 0, 2, 1, 2, 2], rootString: 1, strings: 5, span: 2, label: 'Dom13 (A root)', position: 'mid' },
    { frets: [0, 2, 0, 1, 2, null], rootString: 0, strings: 5, span: 2, label: 'Dom13 (E root)', position: 'low' },
  ],

  // ── Major 13 ─────────────────────────────────────────────────────────
  'Major 13': [
    { frets: [null, 0, 2, 1, 2, 2], rootString: 1, strings: 5, span: 2, label: 'Maj13 (A root)', position: 'mid' },
    { frets: [null, null, 0, 2, 2, 4], rootString: 2, strings: 4, span: 4, label: 'Maj13 (D root)', position: 'high' },
  ],
};
