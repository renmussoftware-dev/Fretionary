import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Fretboard from '../../src/components/Fretboard';
import TopBar from '../../src/components/TopBar';
import InfoPanel from '../../src/components/InfoPanel';
import PillSelector from '../../src/components/PillSelector';
import { COLORS, SPACE, RADIUS } from '../../src/constants/theme';
import { SCALES, CHORDS, CAGED_ORDER, CAGED_COLORS, CAGED_SHAPES, POSITION_COLORS } from '../../src/constants/music';
import { useStore } from '../../src/store/useStore';
import { getScalePositions } from '../../src/utils/theory';

const LABEL_OPTIONS = [
  { label: 'Note', value: 'name' },
  { label: 'Degree', value: 'degree' },
  { label: 'Interval', value: 'interval' },
  { label: 'None', value: 'none' },
];

export default function FretboardScreen() {
  const {
    mode, root, scaleKey, setScaleKey,
    chordKey, setChordKey, labelMode, setLabelMode,
    activePosition, setActivePosition,
    activeCaged, setActiveCaged,
  } = useStore();

  const positions = mode === 'scales' ? getScalePositions(root, scaleKey) : [];

  const scaleOptions = Object.keys(SCALES).map(k => ({
    label: k, value: k,
  }));

  const chordOptions = Object.keys(CHORDS).map(k => ({
    label: k, value: k,
  }));

  const posOptions = [
    { label: 'All', value: 'all' },
    ...positions.map((p, i) => ({
      label: `Pos ${i + 1}`,
      value: String(i),
      dotColor: POSITION_COLORS[i]?.fill,
      color: POSITION_COLORS[i]?.fill,
    })),
  ];

  const cagedOptions = [
    { label: 'All', value: 'all' },
    ...CAGED_ORDER.map(shape => ({
      label: `${shape} shape`,
      value: shape,
      dotColor: CAGED_COLORS[shape]?.fill,
      color: CAGED_COLORS[shape]?.fill,
    })),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar />

      {/* Fretboard */}
      <View style={styles.fbWrap}>
        <Fretboard />
      </View>

      {/* Controls scroll area */}
      <ScrollView style={styles.controls} showsVerticalScrollIndicator={false}>

        {/* Scale / Chord selector */}
        {mode === 'scales' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Scale</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}>
              {scaleOptions.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setScaleKey(opt.value)}
                  style={[styles.pill, scaleKey === opt.value && styles.pillActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, scaleKey === opt.value && styles.pillTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {mode === 'chords' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Chord type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}>
              {chordOptions.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setChordKey(opt.value)}
                  style={[styles.pill, chordKey === opt.value && styles.pillActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, chordKey === opt.value && styles.pillTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Position selector (scales / caged) */}
        {mode === 'scales' && positions.length > 0 && (
          <View style={styles.section}>
            <PillSelector
              label="Position"
              options={posOptions}
              value={activePosition === null ? 'all' : String(activePosition)}
              onChange={v => setActivePosition(v === null || v === 'all' ? null : Number(v))}
              allowDeselect={false}
            />
          </View>
        )}

        {mode === 'caged' && (
          <View style={styles.section}>
            <PillSelector
              label="CAGED shape"
              options={cagedOptions}
              value={activeCaged ?? 'all'}
              onChange={v => setActiveCaged(v === 'all' ? null : v)}
              allowDeselect={false}
            />
            {activeCaged && (
              <View style={styles.cagedInfo}>
                <Text style={styles.cagedInfoText}>
                  {CAGED_SHAPES[activeCaged]?.name} — {CAGED_SHAPES[activeCaged]?.description}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Label selector */}
        <View style={styles.section}>
          <PillSelector
            label="Note labels"
            options={LABEL_OPTIONS}
            value={labelMode}
            onChange={v => v && setLabelMode(v as any)}
            allowDeselect={false}
          />
        </View>

        <View style={{ height: SPACE.xxl }} />
      </ScrollView>

      <InfoPanel />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  fbWrap: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACE.md,
  },
  controls: { flex: 1 },
  section: { marginTop: SPACE.lg },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: SPACE.xs,
    paddingHorizontal: SPACE.lg,
  },
  pillRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACE.lg,
    gap: 6,
    flexWrap: 'nowrap',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  pillActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  pillTextActive: {
    color: '#fff',
  },
  cagedInfo: {
    marginTop: SPACE.sm,
    marginHorizontal: SPACE.lg,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cagedInfoText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
