import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACE } from '../constants/theme';
import { NOTES, NOTE_DISPLAY } from '../constants/music';
import { useStore, type AppMode } from '../store/useStore';

const MODES: { label: string; value: AppMode }[] = [
  { label: 'Scales', value: 'scales' },
  { label: 'Chords', value: 'chords' },
  { label: 'CAGED', value: 'caged' },
];

export default function TopBar() {
  const { root, setRoot, mode, setMode } = useStore();

  return (
    <View style={styles.wrap}>
      {/* Mode tabs */}
      <View style={styles.tabs}>
        {MODES.map(m => (
          <TouchableOpacity
            key={m.value}
            onPress={() => setMode(m.value)}
            style={[styles.tab, mode === m.value && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, mode === m.value && styles.tabTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Root note selector */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: SPACE.sm,
    paddingBottom: SPACE.md,
    gap: SPACE.sm,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: SPACE.lg,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.surfaceHigh,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.text,
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
  notePillActive: {
    backgroundColor: '#E8D44D',
    borderColor: '#C4A800',
  },
  noteText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  noteTextActive: {
    color: '#5C4400',
  },
});
