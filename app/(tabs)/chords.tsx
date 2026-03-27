import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChordBox from '../../src/components/ChordBox';
import { COLORS, SPACE, RADIUS } from '../../src/constants/theme';
import { NOTES, NOTE_DISPLAY, CHORDS } from '../../src/constants/music';
import { useStore } from '../../src/store/useStore';

const CATEGORIES = ['All', 'Triads', 'Seventh', 'Extended', 'Sus'];
const CAT_MAP: Record<string, string> = {
  'Triads': 'triad', 'Seventh': 'seventh', 'Extended': 'extended', 'Sus': 'sus',
};

export default function ChordsScreen() {
  const { root, setRoot } = useStore();
  const [category, setCategory] = useState('All');
  const [selectedChord, setSelectedChord] = useState('Major');

  const filteredChords = Object.entries(CHORDS).filter(([, ch]) =>
    category === 'All' || ch.category === CAT_MAP[category]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chord Library</Text>
        {/* Root note row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.noteRow}>
          {NOTES.map((note, i) => (
            <TouchableOpacity
              key={note}
              onPress={() => setRoot(i)}
              style={[styles.notePill, root === i && styles.notePillActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.noteText, root === i && styles.noteTextActive]}>
                {NOTE_DISPLAY[note] || note}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.catPill, category === cat && styles.catPillActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.body}>
        {/* Chord list */}
        <View style={styles.listWrap}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredChords.map(([key, ch]) => (
              <TouchableOpacity
                key={key}
                onPress={() => setSelectedChord(key)}
                style={[styles.chordItem, selectedChord === key && styles.chordItemActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.chordName, selectedChord === key && styles.chordNameActive]}>
                  {NOTES[root]} {key}
                </Text>
                <Text style={styles.chordIntervals} numberOfLines={1}>
                  {ch.intervalNames.join(' · ')}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={{ height: SPACE.xxl }} />
          </ScrollView>
        </View>

        {/* Diagram panel */}
        <View style={styles.diagramPanel}>
          <Text style={styles.diagramTitle}>{NOTES[root]} {selectedChord}</Text>
          <Text style={styles.diagramDesc}>{CHORDS[selectedChord]?.description}</Text>

          <View style={styles.boxWrap}>
            <ChordBox root={root} chordKey={selectedChord} />
          </View>

          {/* Interval breakdown */}
          <View style={styles.intervalsWrap}>
            {CHORDS[selectedChord]?.intervalNames.map((name, i) => (
              <View key={i} style={[styles.intervalBadge, i === 0 && styles.rootBadge]}>
                <Text style={[styles.intervalText, i === 0 && styles.rootText]}>{name}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.intervalLabel}>Interval structure</Text>
        </View>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SPACE.lg,
    marginBottom: 4,
  },
  noteRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACE.lg,
    gap: 6,
  },
  notePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  notePillActive: { backgroundColor: '#E8D44D', borderColor: '#C4A800' },
  noteText: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  noteTextActive: { color: '#5C4400' },
  catRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACE.lg,
    gap: 6,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  catPillActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  catText: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  catTextActive: { color: '#fff' },

  body: { flex: 1, flexDirection: 'row' },

  listWrap: {
    width: 180,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  chordItem: {
    paddingVertical: 10,
    paddingHorizontal: SPACE.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chordItemActive: { backgroundColor: COLORS.surfaceHigh },
  chordName: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  chordNameActive: { color: COLORS.accent },
  chordIntervals: { fontSize: 10, color: COLORS.textMuted },

  diagramPanel: {
    flex: 1,
    alignItems: 'center',
    paddingTop: SPACE.xl,
    paddingHorizontal: SPACE.md,
  },
  diagramTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  diagramDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: SPACE.xl,
    textAlign: 'center',
  },
  boxWrap: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACE.lg,
    marginBottom: SPACE.xl,
  },
  intervalsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 6,
  },
  intervalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rootBadge: { backgroundColor: '#E8D44D', borderColor: '#C4A800' },
  intervalText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  rootText: { color: '#5C4400' },
  intervalLabel: { fontSize: 11, color: COLORS.textFaint, letterSpacing: 0.5 },
});
