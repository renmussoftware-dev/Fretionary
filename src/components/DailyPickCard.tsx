import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, RADIUS, SPACE } from '../constants/theme';
import { useStore } from '../store/useStore';
import { getDailyPick } from '../utils/dailyPick';

/**
 * Small accent card at the top of the Fretboard controls scroll. Reads the
 * deterministic daily pick — alternates scale/chord, rotates root and item
 * by date — and applies it to the fretboard on tap.
 *
 * Lives only on the Fretboard tab (the natural landing surface). Other tabs
 * don't get the card since their layouts are more constrained and the daily
 * pick is just one of several entry points.
 */
export default function DailyPickCard() {
  const pick = useMemo(() => getDailyPick(), []);
  const setRoot = useStore(s => s.setRoot);
  const setScaleKey = useStore(s => s.setScaleKey);
  const setChordKey = useStore(s => s.setChordKey);
  const setMode = useStore(s => s.setMode);

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

  const eyebrow = pick.type === 'scale' ? "TODAY'S SCALE" : "TODAY'S CHORD";

  return (
    <TouchableOpacity style={styles.card} onPress={applyPick} activeOpacity={0.85}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title} numberOfLines={1}>{pick.fullName}</Text>
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
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E8D44D',
    letterSpacing: 1.5,
    fontFamily: FONT_FAMILY.mono,
    marginBottom: 6,
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
