/**
 * Fretionary — Subscription Gate Configuration
 *
 * FREE tier includes enough to demonstrate value.
 * PRO tier unlocks everything.
 */

// ── FREE SCALES (4 of 14) ────────────────────────────────────────────────────
export const FREE_SCALES = new Set([
  'Major',
  'Natural Minor',
  'Pentatonic Minor',
  'Blues',
]);

// ── FREE CHORDS (8 of 36) ────────────────────────────────────────────────────
export const FREE_CHORDS = new Set([
  'Major',
  'Minor',
  'Dominant 7',
  'Major 7',
  'Minor 7',
  'Sus2',
  'Sus4',
  'Power (5)',
]);

// ── FREE PROGRESSIONS (4 of 22) ──────────────────────────────────────────────
export const FREE_PROGRESSIONS = new Set([
  'I – IV – V',
  'I – V – vi – IV',
  'ii – V – I',
  '12-Bar Blues',
]);

// ── FREE TUNINGS (2 of 9) ────────────────────────────────────────────────────
export const FREE_TUNINGS = new Set([
  'standard',
  'drop-d',
]);

// ── FEATURE GATES ────────────────────────────────────────────────────────────
// These features are entirely locked behind Pro
export const PRO_FEATURES = {
  cagedPositions: true,      // Pos 1-5 on fretboard tab (All positions is free)
  progressionAudio: true,    // Play button in progressions tab
  allPositions: false,       // Show all positions is free; individual positions are pro
};

export function isScaleFree(scaleKey: string): boolean {
  return FREE_SCALES.has(scaleKey);
}

export function isChordFree(chordKey: string): boolean {
  return FREE_CHORDS.has(chordKey);
}

export function isProgressionFree(progressionName: string): boolean {
  return FREE_PROGRESSIONS.has(progressionName);
}

export function isTuningFree(tuningId: string): boolean {
  return FREE_TUNINGS.has(tuningId);
}

// ── PRACTICE ─────────────────────────────────────────────────────────────────
// Free: only "Name the note" mode at beginner difficulty.
// Pro:  other modes, all difficulties above beginner, stats history.
export type PracticeMode = 'name' | 'find' | 'string';
export type PracticeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export function isPracticeFree(mode: PracticeMode, difficulty: PracticeDifficulty): boolean {
  return mode === 'name' && difficulty === 'beginner';
}
