import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, RADIUS, SPACE } from '../constants/theme';
import { NOTES, SCALES, CHORDS } from '../constants/music';
import { useStore } from '../store/useStore';
import { getScaleNotes, getChordNotes } from '../utils/theory';

export default function InfoPanel() {
  const { root, scaleKey, chordKey, mode, activePosition, activeCaged } = useStore();

  const notes = mode === 'chords'
    ? getChordNotes(root, chordKey)
    : getScaleNotes(root, scaleKey);

  const notesStr = notes.map(n => NOTES[n]).join('  ·  ');

  let formula = '—';
  let degrees = '—';
  let description = '';

  if (mode === 'scales') {
    const sc = SCALES[scaleKey];
    formula = sc?.formula || '—';
    degrees = sc?.degrees.join('  ') || '—';
    description = sc?.description || '';
  } else if (mode === 'chords') {
    const ch = CHORDS[chordKey];
    formula = ch?.intervalNames.join('  ') || '—';
    degrees = ch?.description || '—';
    description = '';
  } else if (mode === 'caged') {
    formula = SCALES['Major']?.formula || '—';
    degrees = SCALES['Major']?.degrees.join('  ') || '—';
    description = activeCaged
      ? `${activeCaged} shape — root on ${['e','B','G','D','A','E'][0]} string`
      : 'Select a CAGED shape above';
  }

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Notes</Text>
          <Text style={styles.cardValue} numberOfLines={1}>{notesStr}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{mode === 'chords' ? 'Intervals' : 'Formula'}</Text>
          <Text style={styles.cardValue} numberOfLines={1}>{formula}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{mode === 'chords' ? 'Description' : 'Degrees'}</Text>
          <Text style={styles.cardValue} numberOfLines={1}>{degrees}</Text>
        </View>
      </ScrollView>
      {description ? (
        <Text style={styles.desc}>{description}</Text>
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
    gap: SPACE.sm,
  },
  cards: {
    flexDirection: 'row',
    paddingHorizontal: SPACE.lg,
    gap: 10,
  },
  card: {
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 120,
    maxWidth: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  cardValue: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
  },
  desc: {
    fontSize: 12,
    color: COLORS.textMuted,
    paddingHorizontal: SPACE.lg,
    lineHeight: 18,
  },
});
