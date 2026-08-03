import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, SPACE } from '../constants/theme';
import { NOTES, SCALES, CHORDS } from '../constants/music';
import { useStore } from '../store/useStore';
import {
  getScaleNotes, getChordNotes, spellNoteAt, symbolToDegreeIdx,
  scaleDegreeIdxAt, scaleRootLetter, chordRootLetter,
} from '../utils/theory';

const INTERVAL_NAMES = ['R','♭2','2','♭3','3','4','♭5','5','♭6','6','♭7','7'];

export default function InfoPanel() {
  const { root, scaleKey, chordKey, mode, activeCaged, customNotes } = useStore();

  // CAGED overlays the MAJOR scale on the neck — that's what noteLabel spells
  // against and what the Formula/Degrees columns below already report. This
  // used to read the active scaleKey in CAGED mode, so the Notes column listed
  // a different set of notes than the dots on the neck AND than its own
  // Formula column right beside it.
  const scaleForNotes = mode === 'caged' ? 'Major' : scaleKey;

  let notes: number[];
  if (mode === 'chords') notes = getChordNotes(root, chordKey);
  else if (mode === 'custom') notes = customNotes;
  else notes = getScaleNotes(root, scaleForNotes);

  // Spell by degree so this list matches the neck: C Dorian reads
  // "C D E♭ F G A B♭", not "C D D# F G A A#". The dots went through
  // noteLabel and got this right; this strip built its own string off raw
  // sharps-only NOTES, so the two disagreed on the same screen.
  //
  // Spaces (instead of dots/multi-spaces) keep values short — important since
  // we now show all three columns side-by-side in a single panel row.
  let notesStr = '—';
  if (notes.length > 0) {
    if (mode === 'custom') {
      // No scale/chord frame → no degree to spell against. Sharps, which is
      // also what the neck shows in this mode.
      notesStr = notes.map(n => NOTES[n]).join(' ');
    } else if (mode === 'chords') {
      const ch = CHORDS[chordKey];
      // getChordNotes maps ch.intervals in order, so index i ↔ intervalNames[i].
      const rl = chordRootLetter(root, chordKey);
      notesStr = ch
        ? notes.map((n, i) => spellNoteAt(root, symbolToDegreeIdx(ch.intervalNames[i]), n, rl)).join(' ')
        : notes.map(n => NOTES[n]).join(' ');
    } else {
      // scales + caged. The degree comes from the scale's degree symbols, not
      // the array index — pentatonic/blues/whole-tone skip letters, so index
      // and degree diverge (Pentatonic Minor's 2nd note is its ♭3).
      const rl = scaleRootLetter(root, scaleForNotes);
      notesStr = notes
        .map((n, i) => spellNoteAt(root, scaleDegreeIdxAt(scaleForNotes, i), n, rl))
        .join(' ');
    }
  }

  let formula = '—';
  let degrees = '—';
  let description = '';
  let formulaLabel = 'Formula';
  let degreesLabel = 'Degrees';

  if (mode === 'scales') {
    const sc = SCALES[scaleKey];
    formula = sc?.formula || '—';
    degrees = sc?.degrees.join(' ') || '—';
    description = sc?.description || '';
  } else if (mode === 'chords') {
    const ch = CHORDS[chordKey];
    formula = ch?.intervalNames.join(' ') || '—';
    degrees = ch?.description || '—';
    formulaLabel = 'Intervals';
    degreesLabel = 'About';
  } else if (mode === 'caged') {
    formula = SCALES['Major']?.formula || '—';
    degrees = SCALES['Major']?.degrees.join(' ') || '—';
    description = activeCaged
      ? `${activeCaged} shape highlighted on the neck`
      : 'Select a CAGED shape above';
  } else if (mode === 'custom') {
    formula = customNotes.length > 0
      ? customNotes.map(n => INTERVAL_NAMES[(n - root + 12) % 12]).join(' ')
      : '—';
    degrees = `${customNotes.length} note${customNotes.length === 1 ? '' : 's'}`;
    formulaLabel = 'Intervals';
    degreesLabel = 'Count';
    description = customNotes.length === 0
      ? 'Tap notes below to build your own scale or chord shape.'
      : `Custom selection in ${NOTES[root]}`;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.col, { flex: 1.25 }]}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.value} numberOfLines={2}>{notesStr}</Text>
        </View>
        <View style={[styles.col, styles.colDivider]}>
          <Text style={styles.label}>{formulaLabel}</Text>
          <Text style={styles.value} numberOfLines={2}>{formula}</Text>
        </View>
        <View style={[styles.col, styles.colDivider]}>
          <Text style={styles.label}>{degreesLabel}</Text>
          <Text style={styles.value} numberOfLines={2}>{degrees}</Text>
        </View>
      </View>
      {description ? (
        <Text style={styles.desc} numberOfLines={2}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.lg,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
    paddingHorizontal: 8,
  },
  colDivider: {
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textFaint,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: FONT_FAMILY.mono,
  },
  value: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.text,
    fontFamily: FONT_FAMILY.mono,
    letterSpacing: 0,
    lineHeight: 15,
  },
  desc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
