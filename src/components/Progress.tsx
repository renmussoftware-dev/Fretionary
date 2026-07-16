import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { COLORS, FONT_FAMILY, RADIUS, SPACE } from '../constants/theme';
import { useStore } from '../store/useStore';
import { SCALES, CHORDS, NOTES } from '../constants/music';
import { PROGRESSIONS } from '../constants/progressions';

/**
 * Practice progress screen — a Tools sub-mode that surfaces engagement
 * metrics as a habit-loop hook.
 *
 * What counts:
 *  - Scales:        played via the "Hear scale" button (recordScaleExplored)
 *  - Chords:        played via any chord-library trigger (recordChordLearned)
 *  - Progressions:  named progressions played via the ▶ button; custom
 *                   sequences and diatonic doodles don't count since there's
 *                   no fixed set to check off against.
 *
 * Design goal: the numbers going up should feel earned. All three counters
 * gate on actual audio playback, not just tapping the item in a picker.
 */
export default function Progress() {
  const currentStreak = useStore(s => s.currentStreak);
  const longestStreak = useStore(s => s.longestStreak);
  const scalesExplored = useStore(s => s.scalesExplored);
  const chordsLearned = useStore(s => s.chordsLearned);
  const progressionsPlayed = useStore(s => s.progressionsPlayed);
  const recents = useStore(s => s.recents);

  const totals = useMemo(() => ({
    scales:       { done: scalesExplored.length,      total: Object.keys(SCALES).length },
    chords:       { done: chordsLearned.length,       total: Object.keys(CHORDS).length },
    progressions: { done: progressionsPlayed.length,  total: PROGRESSIONS.length },
  }), [scalesExplored, chordsLearned, progressionsPlayed]);

  // Encouraging next-step line. Tries scales → chords → progressions in
  // order so the message stays actionable even after the user finishes one
  // category. Falls through to a "you've done it all" message.
  const nextUp = useMemo(() => {
    const scaleLeft = Object.keys(SCALES).filter(k => !scalesExplored.includes(k));
    if (scaleLeft.length > 0) return { label: 'scale', name: scaleLeft[0] };
    const chordLeft = Object.keys(CHORDS).filter(k => !chordsLearned.includes(k));
    if (chordLeft.length > 0) return { label: 'chord', name: chordLeft[0] };
    const progLeft = PROGRESSIONS.map(p => p.name).filter(n => !progressionsPlayed.includes(n));
    if (progLeft.length > 0) return { label: 'progression', name: progLeft[0] };
    return null;
  }, [scalesExplored, chordsLearned, progressionsPlayed]);

  const recentSlice = recents.slice(0, 5);

  return (
    <View style={styles.wrap}>
      {/* Streak hero */}
      <View style={styles.streakCard}>
        <Text style={styles.streakEyebrow}>CURRENT STREAK</Text>
        <View style={styles.streakRow}>
          <Text style={styles.streakBig}>{currentStreak}</Text>
          <View style={{ flex: 1, marginLeft: SPACE.md }}>
            <Text style={styles.streakUnit}>
              {currentStreak === 1 ? 'day' : 'days'}
            </Text>
            <Text style={styles.streakSub}>
              {longestStreak > currentStreak
                ? `Longest: ${longestStreak} days`
                : longestStreak > 0
                  ? `New personal best 🎸`
                  : 'Come back tomorrow to keep it going'}
            </Text>
          </View>
        </View>
      </View>

      {/* Category progress bars */}
      <ProgressBar
        title="Scales explored"
        done={totals.scales.done}
        total={totals.scales.total}
        hint="Tap ▶ Hear scale on the Fretboard tab to count a scale."
      />
      <ProgressBar
        title="Chords learned"
        done={totals.chords.done}
        total={totals.chords.total}
        hint="Play any chord in the Chord library to count it."
      />
      <ProgressBar
        title="Progressions played"
        done={totals.progressions.done}
        total={totals.progressions.total}
        hint="Play a named progression via ▶ on the Progressions tab."
      />

      {/* Next-up suggestion */}
      {nextUp && (
        <View style={styles.nextCard}>
          <Text style={styles.nextEyebrow}>UP NEXT</Text>
          <Text style={styles.nextText}>
            Try the <Text style={styles.nextName}>{nextUp.name}</Text> {nextUp.label} to keep the streak going.
          </Text>
        </View>
      )}

      {/* Recently practiced */}
      {recentSlice.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionLabel}>RECENTLY PRACTICED</Text>
          {recentSlice.map((r, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              style={styles.recentRow}
              onPress={() => {
                if (r.kind === 'chord') router.push('/(tabs)/chords');
                else if (r.kind === 'progression') router.push('/(tabs)/progressions');
                else router.push('/(tabs)');
              }}
            >
              <Text style={styles.recentKind}>{r.kind === 'scale' ? '♪' : r.kind === 'chord' ? '♫' : '↝'}</Text>
              <Text style={styles.recentText} numberOfLines={1}>
                {NOTES[r.root]}{' '}
                {r.kind === 'scale' ? r.scaleKey :
                 r.kind === 'chord' ? r.chordKey :
                 r.progName}
              </Text>
              <Text style={styles.recentChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function ProgressBar({ title, done, total, hint }: { title: string; done: number; total: number; hint: string }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <View style={styles.barCard}>
      <View style={styles.barTitleRow}>
        <Text style={styles.barTitle}>{title}</Text>
        <Text style={styles.barCount}>{done} / {total}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.barHint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, paddingBottom: SPACE.xl },

  // Streak hero
  streakCard: {
    padding: SPACE.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(232,200,77,0.32)',
    backgroundColor: 'rgba(232,200,77,0.06)',
    marginBottom: SPACE.lg,
  },
  streakEyebrow: {
    fontSize: 10, fontWeight: '700',
    color: '#E8C84D', letterSpacing: 1.5,
    fontFamily: FONT_FAMILY.mono,
    marginBottom: 6,
  },
  streakRow: { flexDirection: 'row', alignItems: 'center' },
  streakBig: {
    fontSize: 56, fontWeight: '800',
    color: COLORS.text, letterSpacing: -2,
    fontFamily: FONT_FAMILY.mono,
    lineHeight: 58,
  },
  streakUnit: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  streakSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  // Progress bars
  barCard: {
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginBottom: SPACE.md,
  },
  barTitleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  barTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  barCount: {
    fontSize: 13, fontWeight: '700', color: COLORS.accent,
    fontFamily: FONT_FAMILY.mono, letterSpacing: 0.3,
  },
  barTrack: {
    height: 6, borderRadius: 3,
    backgroundColor: COLORS.surfaceHigh,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 3 },
  barHint: {
    fontSize: 11, color: COLORS.textFaint,
    marginTop: 8, lineHeight: 16,
  },

  // Next-up
  nextCard: {
    marginTop: SPACE.md,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSoft,
  },
  nextEyebrow: {
    fontSize: 10, fontWeight: '700',
    color: COLORS.accent, letterSpacing: 1.2,
    marginBottom: 4,
  },
  nextText: { fontSize: 13, color: COLORS.text, lineHeight: 19 },
  nextName: { fontWeight: '700', color: COLORS.accent },

  // Recently practiced
  recentSection: { marginTop: SPACE.lg },
  sectionLabel: {
    fontSize: 10, fontWeight: '700',
    color: COLORS.textFaint, letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: SPACE.sm,
  },
  recentRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: SPACE.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 6,
    gap: SPACE.sm,
  },
  recentKind: { fontSize: 16, color: COLORS.accent, width: 20, textAlign: 'center' },
  recentText: { flex: 1, fontSize: 13, color: COLORS.text },
  recentChevron: { fontSize: 18, color: COLORS.textFaint, lineHeight: 20 },
});
