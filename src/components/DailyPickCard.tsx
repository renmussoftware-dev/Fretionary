import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, RADIUS, SPACE } from '../constants/theme';
import { useStore } from '../store/useStore';
import { getDailyPick } from '../utils/dailyPick';
import { useProGate } from '../hooks/useProGate';
import { isChordFree, isScaleFree } from '../constants/subscription';

/**
 * Small accent card at the top of the Fretboard controls scroll. Reads the
 * deterministic daily pick — alternates scale/chord, rotates root and item
 * by date — and applies it to the fretboard on tap.
 *
 * Lives only on the Fretboard tab (the natural landing surface). Other tabs
 * don't get the card since their layouts are more constrained and the daily
 * pick is just one of several entry points.
 *
 * Gating: the rotation pulls from every scale/chord in the library — both
 * free and Pro. We don't filter the pick itself (every user sees the same
 * pick of the day) but the tap routes through requirePro when the item is
 * Pro-only. That turns the card into a paywall surface on those days
 * rather than a backdoor around the chord/scale picker gates.
 */
export default function DailyPickCard() {
  const pick = useMemo(() => getDailyPick(), []);
  const setRoot = useStore(s => s.setRoot);
  const setScaleKey = useStore(s => s.setScaleKey);
  const setChordKey = useStore(s => s.setChordKey);
  const setMode = useStore(s => s.setMode);
  const currentStreak = useStore(s => s.currentStreak);
  const { isPro, requirePro } = useProGate();

  const locked = !isPro && (
    pick.type === 'scale' ? !isScaleFree(pick.itemKey) : !isChordFree(pick.itemKey)
  );

  function applyPick() {
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
