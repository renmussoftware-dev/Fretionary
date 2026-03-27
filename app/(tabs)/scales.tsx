import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACE, RADIUS } from '../../src/constants/theme';
import { NOTES, NOTE_DISPLAY, SCALES } from '../../src/constants/music';
import { useStore } from '../../src/store/useStore';
import { getScaleNotes } from '../../src/utils/theory';

const CATEGORIES = ['All', 'Major', 'Minor', 'Pentatonic', 'Modes', 'Other'];
const CAT_MAP: Record<string, string> = {
  'Major': 'major', 'Minor': 'minor', 'Pentatonic': 'pentatonic',
  'Modes': 'mode', 'Other': 'other',
};

export default function ScalesScreen() {
  const { root, setRoot } = useStore();
  const [category, setCategory] = useState('All');
  const [selectedScale, setSelectedScale] = useState('Major');

  const filteredScales = Object.entries(SCALES).filter(([, sc]) =>
    category === 'All' || sc.category === CAT_MAP[category]
  );

  const scaleNotes = getScaleNotes(root, selectedScale);
  const sc = SCALES[selectedScale];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Scale Reference</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.noteRow}>
          {NOTES.map((note, i) => (
            <TouchableOpacity key={note} onPress={() => setRoot(i)}
              style={[styles.notePill, root === i && styles.notePillActive]} activeOpacity={0.7}>
              <Text style={[styles.noteText, root === i && styles.noteTextActive]}>
                {NOTE_DISPLAY[note] || note}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
              style={[styles.catPill, category === cat && styles.catPillActive]} activeOpacity={0.7}>
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.body}>
        {/* Scale list */}
        <View style={styles.listWrap}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredScales.map(([key]) => (
              <TouchableOpacity key={key} onPress={() => setSelectedScale(key)}
                style={[styles.scaleItem, selectedScale === key && styles.scaleItemActive]}
                activeOpacity={0.7}>
                <Text style={[styles.scaleName, selectedScale === key && styles.scaleNameActive]}>
                  {key}
                </Text>
                <Text style={styles.scaleCategory}>{SCALES[key].category}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ height: SPACE.xxl }} />
          </ScrollView>
        </View>

        {/* Detail panel */}
        <ScrollView style={styles.detail} showsVerticalScrollIndicator={false}>
          <Text style={styles.detailTitle}>{NOTES[root]} {selectedScale}</Text>
          <Text style={styles.detailDesc}>{sc?.description}</Text>

          {/* Note pills */}
          <Text style={styles.subLabel}>Notes</Text>
          <View style={styles.noteGrid}>
            {scaleNotes.map((ni, i) => (
              <View key={i} style={[styles.noteBadge, ni === root && styles.rootBadge]}>
                <Text style={[styles.noteBadgeNote, ni === root && styles.rootNote]}>
                  {NOTES[ni]}
                </Text>
                <Text style={[styles.noteBadgeDeg, ni === root && styles.rootDeg]}>
                  {sc?.degrees[i]}
                </Text>
              </View>
            ))}
          </View>

          {/* Formula */}
          <Text style={styles.subLabel}>Interval formula</Text>
          <View style={styles.formulaBox}>
            <Text style={styles.formulaText}>{sc?.formula}</Text>
            <Text style={styles.formulaHint}>W = whole step (2 frets) · H = half step (1 fret)</Text>
          </View>

          {/* Relative scales info */}
          <Text style={styles.subLabel}>Degrees</Text>
          <View style={styles.degreeRow}>
            {sc?.degrees.map((deg, i) => (
              <View key={i} style={styles.degreeBadge}>
                <Text style={styles.degreeText}>{deg}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: SPACE.xxl * 2 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: SPACE.md,
    paddingBottom: SPACE.md,
    gap: SPACE.sm,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text, paddingHorizontal: SPACE.lg, marginBottom: 4 },
  noteRow: { flexDirection: 'row', paddingHorizontal: SPACE.lg, gap: 6 },
  notePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  notePillActive: { backgroundColor: '#E8D44D', borderColor: '#C4A800' },
  noteText: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  noteTextActive: { color: '#5C4400' },
  catRow: { flexDirection: 'row', paddingHorizontal: SPACE.lg, gap: 6 },
  catPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  catPillActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  catText: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  catTextActive: { color: '#fff' },

  body: { flex: 1, flexDirection: 'row' },
  listWrap: { width: 160, borderRightWidth: 1, borderRightColor: COLORS.border },
  scaleItem: { paddingVertical: 10, paddingHorizontal: SPACE.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  scaleItemActive: { backgroundColor: COLORS.surfaceHigh },
  scaleName: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  scaleNameActive: { color: COLORS.accent },
  scaleCategory: { fontSize: 10, color: COLORS.textFaint, textTransform: 'capitalize' },

  detail: { flex: 1, padding: SPACE.lg },
  detailTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  detailDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19, marginBottom: SPACE.xl },
  subLabel: { fontSize: 10, fontWeight: '500', color: COLORS.textMuted, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: SPACE.sm, marginTop: SPACE.lg },

  noteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  noteBadge: { alignItems: 'center', backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border, minWidth: 44 },
  rootBadge: { backgroundColor: '#E8D44D', borderColor: '#C4A800' },
  noteBadgeNote: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  rootNote: { color: '#5C4400' },
  noteBadgeDeg: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  rootDeg: { color: '#8B6800' },

  formulaBox: { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, padding: SPACE.md, borderWidth: 1, borderColor: COLORS.border },
  formulaText: { fontSize: 15, fontWeight: '600', color: COLORS.text, letterSpacing: 2, marginBottom: 6, fontFamily: 'monospace' },
  formulaHint: { fontSize: 11, color: COLORS.textFaint },

  degreeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  degreeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border },
  degreeText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
});
