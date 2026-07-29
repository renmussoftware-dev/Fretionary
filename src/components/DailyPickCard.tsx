import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, RADIUS, SPACE } from '../constants/theme';
import { useStore } from '../store/useStore';
import { getDailyPick, type DailyPick } from '../utils/dailyPick';
import { useProGate } from '../hooks/useProGate';
import { isChordFree, isScaleFree } from '../constants/subscription';

interface Props {
  // Filter render by pick type. Fretboard/Scales passes 'scale' so the
  // card only appears on scale days; Chords tab passes 'chord' so the
  // card only appears on chord days. Omit for the older behavior (always
  // renders regardless of type).
  showType?: 'scale' | 'chord';
  // Override the tap behavior. The default apply targets the Fretboard
  // tab (sets root + scale/chord key + mode via the store). Callers whose
  // context is the Chord library (which manages its own selectedChord
  // state) pass their own onTap so the pick applies to that context
  // without jumping the user out to the Fretboard tab. Called only after
  // the Pro gate resolves (equivalent to the default apply's Pro check).
  onTap?: (pick: DailyPick) => void;
}

/**
 * Small accent card that reads the deterministic daily pick and applies
 * it on tap. Two usage sites today:
 *
 *   - Fretboard tab (Scales mode): showType="scale". Default onTap sets
 *     root + scaleKey + mode='scales' via the store.
 *   - Chords tab: showType="chord" + custom onTap that sets the Chords
 *     tab's local selectedChord state (rather than the store's chordKey
 *     which the chord library doesn't read).
 *
 * Gating: the rotation pulls from every scale/chord in the library —
 * both free and Pro. On Pro-day picks the tap routes through requirePro,
 * turning the card into a paywall surface rather than a backdoor around
 * the chord/scale picker gates.
 */
export default function DailyPickCard({ showType, onTap }: Props = {}) {
  const pick = useMemo(() => getDailyPick(), []);
  const setRoot = useStore(s => s.setRoot);
  const setScaleKey = useStore(s => s.setScaleKey);
  const setChordKey = useStore(s => s.setChordKey);
  const setMode = useStore(s => s.setMode);
  const currentStreak = useStore(s => s.currentStreak);
  const { isPro, requirePro } = useProGate();

  // Type filter — early-return if the caller only wants a specific pick
  // type and today's pick doesn't match.
  if (showType && pick.type !== showType) return null;

  const locked = !isPro && (
    pick.type === 'scale' ? !isScaleFree(pick.itemKey) : !isChordFree(pick.itemKey)
  );

  function applyPick() {
    if (onTap) {
      onTap(pick);
      return;
    }
    // Default: Fretboard-tab behavior — set root + item key + switch mode.
    setRoot(pick.root);
    if (pick.type === 'scale') {
      setScaleKey(pick.itemKey);
      setMode('scales');
    } else {
      setChordKey(pick.itemKey);
      setMode('chords');
    }
  }

  function handlePress() {
    if (locked) {
      requirePro(applyPick);
      return;
    }
    applyPick();
  }

  const eyebrow = pick.type === 'scale' ? "TODAY'S SCALE" : "TODAY'S CHORD";

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          {/* Streak chip — relocated here from TopBar so it surfaces at the
              "today's content" moment, which is where it conceptually belongs
              (the daily pick card is the streak-counting surface). Only
              renders once the user has actually opened the app at least one
              day. */}
          {currentStreak > 0 && (
            <Text style={styles.streakText}>
              🔥 {currentStreak} day streak!
            </Text>
          )}
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {locked ? '🔒  ' : ''}{pick.fullName}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>{pick.description}</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACE.lg,
    marginTop: SPACE.lg,
    padding: SPACE.lg,
    gap: SPACE.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(232,212,77,0.32)',
    backgroundColor: 'rgba(232,212,77,0.05)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.sm,
    marginBottom: 6,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E8D44D',
    letterSpacing: 1.5,
    fontFamily: FONT_FAMILY.mono,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E8D44D',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  arrow: {
    fontSize: 22,
    fontWeight: '700',
    color: '#E8D44D',
  },
});
