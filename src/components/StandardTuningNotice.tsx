import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACE, makeStyles } from '../constants/theme';
import { useStore } from '../store/useStore';
import { getTuning } from '../constants/tunings';

interface Props {
  /** Where this is showing — used to phrase the notice. */
  context: 'chord library' | 'progressions' | 'CAGED';
}

export default function StandardTuningNotice({ context }: Props) {
  const styles = useStyles();
  const tuningId = useStore(s => s.tuningId);
  if (tuningId === 'standard') return null;
  const t = getTuning(tuningId);
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>
        <Text style={styles.icon}>♪ </Text>
        Your tuning is <Text style={styles.bold}>{t.name}</Text>, but {context} always uses standard.
      </Text>
    </View>
  );
}

const useStyles = makeStyles(COLORS => ({
  wrap: {
    alignSelf: 'stretch',
    marginHorizontal: SPACE.lg,
    marginTop: SPACE.sm,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  icon: { color: COLORS.accent, fontWeight: '700' },
  bold: { fontWeight: '700', color: COLORS.text },
}));
