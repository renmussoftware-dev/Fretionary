import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, RADIUS, SPACE } from '../constants/theme';
import { useStore } from '../store/useStore';
import { getDailyPick } from '../utils/dailyPick';
import { useProGate } from '../hooks/useProGate';
import { isChordFree, isScaleFree } from '../constants/subscription';

/**
 * Small accent card that reads the deterministic daily pick and applies
 * it on tap.
 *
 * One usage site, and deliberately only one: the Fretboard tab in Scales
 * mode. That's the screen the app opens to, which is the whole point — the
 * daily pick only works as a habit loop if it's the first thing on screen.
 * It renders on both scale and chord days; a chord pick applies by
 * switching this tab into Chords mode rather than sending the user to the
 * Chords tab. The card is not wanted anywhere else, so resist adding a
 * second render site — that's been tried twice and reverted both times.
 *
 * Gating: the rotation pulls from every scale/chord in the library —
 * both free and Pro. On Pro-day picks the tap routes through requirePro,
 * turning the card into a paywall surface rather than a backdoor around
 * the chord/scale picker gates.
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
    // Set root + item key and switch the Fretboard tab into the matching mode.
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
