import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Fretboard from '../../src/components/Fretboard';
import TopBar from '../../src/components/TopBar';
import InfoPanel from '../../src/components/InfoPanel';
import PillSelector from '../../src/components/PillSelector';
import DailyPickCard from '../../src/components/DailyPickCard';
import { COLORS, SPACE, RADIUS, FONT_FAMILY } from '../../src/constants/theme';
import {
  NOTES, NOTE_DISPLAY,
  SCALES, CHORDS, CAGED_ORDER, CAGED_COLORS, CAGED_SHAPES,
  CAGED_SHAPE_TIPS, POSITION_COLORS,
} from '../../src/constants/music';
import { useStore } from '../../src/store/useStore';
import { getScalePositions, getCagedCaretFret } from '../../src/utils/theory';
import { useProGate } from '../../src/hooks/useProGate';
import { useAudioEngine } from '../../src/hooks/useAudioEngine';
import { isScaleFree, isChordFree } from '../../src/constants/subscription';

const LABEL_OPTIONS = [
  { label: 'Note', value: 'name' },
  { label: 'Degree', value: 'degree' },
  { label: 'Interval', value: 'interval' },
  { label: 'None', value: 'none' },
];

export default function FretboardScreen() {
  const { width: screenW } = useWindowDimensions();
  const isTablet = screenW >= 768;
  const { isPro, requirePro } = useProGate();
  const { playScale, stopProgression } = useAudioEngine();
  const [playingScale, setPlayingScale] = React.useState(false);

  const {
    mode, root, scaleKey, setScaleKey,
    chordKey, setChordKey, labelMode, setLabelMode,
    activePosition, setActivePosition,
    activeCaged, setActiveCaged,
    customNotes, toggleCustomNote, clearCustomNotes,
  } = useStore();
  const setPlaybackHighlight = useStore(s => s.setPlaybackHighlight);

  // Build a MIDI sequence for the active scale and play the classic
  // practice-room pattern: two octaves ascending, then back down to the
  // root. Crossing octaves makes the visual highlight pay off — the same
  // pitch class lights up at multiple positions on the neck. Pro-gated.
  // Tap-again-to-stop pattern.
  function handlePlayScale() {
    if (playingScale) {
      stopProgression();
      setPlayingScale(false);
      setPlaybackHighlight(null);
      return;
    }
    const apply = () => {
      const sc = SCALES[scaleKey];
      if (!sc) return;
      // 60 = C4 (middle C). Transpose to the active root so any key starts
      // in the same comfortable octave. Two octaves ascending takes us to
      // root+24 (max B6 for root=B, well within the loaded sample range).
      const startMidi = 60 + root;
      const ascending: number[] = [startMidi];
      let cur = startMidi;
      for (let octave = 0; octave < 2; octave++) {
        for (const step of sc.steps) {
          cur += step;
          ascending.push(cur);
        }
      }
      // Descend back to the start. Drop the top note so it doesn't double-hit
      // at the turnaround — the ascent already played it.
      const descending = ascending.slice(0, -1).reverse();
      const notes = [...ascending, ...descending];
      setPlayingScale(true);
      playScale(
        notes,
        280,
        // Per-step: light up every fretboard position whose pitch class
        // matches the note currently sounding. Fretboard reads playbackHighlight
        // from the store and renders a brighter dot + radial glow on match.
        (idx) => setPlaybackHighlight(notes[idx] % 12),
        // Finish: clear the highlight and reset the button state.
        () => {
          setPlaybackHighlight(null);
          setPlayingScale(false);
        },
      );
    };
    if (!isPro) { requirePro(apply); return; }
    apply();
  }

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

  const controlsContent = (
    <>
        {/* Daily Pick — top of the controls scroll so it's the first thing
            the user sees below the fretboard. Rotates deterministically by
            local date. Tapping it loads the pick into the fretboard. */}
        <DailyPickCard />

        {/* Scale selector */}
        {mode === 'scales' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Scale</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}>
              {scaleOptions.map(opt => {
                const locked = !isPro && !isScaleFree(opt.value);
                return (
                  <TouchableOpacity key={opt.value}
                    onPress={() => locked ? requirePro(() => setScaleKey(opt.value)) : setScaleKey(opt.value)}
                    style={[styles.pill, scaleKey === opt.value && styles.pillActive, locked && styles.pillLocked]}
                    activeOpacity={0.7}>
                    <Text style={[styles.pillText, scaleKey === opt.value && styles.pillTextActive]}>
                      {locked ? '🔒 ' : ''}{opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {/* Play scale button — Pro feature. Plays the current scale one
                octave ascending from C4 transposed to the active root. */}
            <TouchableOpacity onPress={handlePlayScale} style={styles.playScaleBtn} activeOpacity={0.85}>
              <Text style={styles.playScaleBtnText}>
                {!isPro ? '🔒  ' : ''}{playingScale ? '⏸  Stop' : '▶  Hear scale'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Chord selector */}
        {mode === 'chords' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Chord type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}>
              {chordOptions.map(opt => {
                const locked = !isPro && !isChordFree(opt.value);
                return (
                  <TouchableOpacity key={opt.value}
                    onPress={() => locked ? requirePro(() => setChordKey(opt.value)) : setChordKey(opt.value)}
                    style={[styles.pill, chordKey === opt.value && styles.pillActive, locked && styles.pillLocked]}
                    activeOpacity={0.7}>
                    <Text style={[styles.pillText, chordKey === opt.value && styles.pillTextActive]}>
                      {locked ? '🔒 ' : ''}{opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
        {/* Custom note picker */}
        {mode === 'custom' && (
          <View style={styles.section}>
            <View style={styles.customHeader}>
              <Text style={styles.sectionLabel}>Notes</Text>
              {customNotes.length > 0 && (
                <TouchableOpacity onPress={clearCustomNotes} activeOpacity={0.7} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}>
              {NOTES.map((note, i) => {
                const selected = customNotes.includes(i);
                const isRoot = i === root;
                return (
                  <TouchableOpacity key={note}
                    onPress={() => toggleCustomNote(i)}
                    style={[
                      styles.pill,
                      selected && (isRoot ? styles.pillRoot : styles.pillActive),
                    ]}
                    activeOpacity={0.7}>
                    <Text style={[
                      styles.pillText,
                      selected && (isRoot ? styles.pillTextRoot : styles.pillTextActive),
                    ]}>
                      {NOTE_DISPLAY[note] || note}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.customHint}>
              Tap notes to highlight them on the fretboard. Use the root selector above to set your key — the root note is colored differently when included.
            </Text>
          </View>
        )}
        {/* Position selector */}
        {mode === 'scales' && positions.length > 0 && (
          <View style={styles.section}>
            <PillSelector label="Position" options={posOptions}
              value={activePosition === null ? 'all' : String(activePosition)}
              onChange={v => {
                if (v !== null && v !== 'all' && !isPro) { requirePro(() => setActivePosition(Number(v))); return; }
                setActivePosition(v === null || v === 'all' ? null : Number(v));
              }}
              allowDeselect={false} />
          </View>
        )}
        {/* CAGED shape selector + detail card */}
        {mode === 'caged' && (
          <View style={styles.section}>
            <PillSelector label="CAGED shape" options={cagedOptions}
              value={activeCaged ?? 'all'}
              onChange={v => {
                if (v !== null && v !== 'all' && !isPro) { requirePro(() => setActiveCaged(v)); return; }
                setActiveCaged(v === 'all' ? null : v);
              }}
              allowDeselect={false} />
            {activeCaged && CAGED_SHAPES[activeCaged] && (() => {
              const shape = CAGED_SHAPES[activeCaged];
              const col = CAGED_COLORS[activeCaged];
              const caret = getCagedCaretFret(root, activeCaged as any);
              const tips = CAGED_SHAPE_TIPS[activeCaged as keyof typeof CAGED_SHAPE_TIPS] ?? [];
              return (
                <View style={styles.cagedDetailCard}>
                  <View style={styles.cagedDetailHeader}>
                    <View style={[styles.cagedShapeBadge, { backgroundColor: col.fill }]}>
                      <Text style={styles.cagedShapeBadgeText}>{activeCaged}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cagedShapeTitle}>{shape.name}</Text>
                      <Text style={styles.cagedShapeSub}>Caret fret · {caret || 'open'}</Text>
                    </View>
                  </View>
                  <Text style={styles.cagedShapeDesc}>{shape.description}</Text>
                  <View style={styles.cagedTipsList}>
                    {tips.map((tip, i) => (
                      <View key={i} style={styles.cagedTipRow}>
                        <View style={styles.cagedTipNumber}>
                          <Text style={styles.cagedTipNumberText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.cagedTipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })()}
          </View>
        )}
        <View style={styles.section}>
          <PillSelector label="Note labels" options={LABEL_OPTIONS} value={labelMode}
            onChange={v => v && setLabelMode(v as any)} allowDeselect={false} />
        </View>
        <View style={{ height: SPACE.xxl }} />
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar />

      {isTablet ? (
        /* ── iPad: fretboard fills top, controls in scrollable row below ── */
        <View style={styles.tabletLayout}>
          <View style={styles.tabletFbWrap}>
            <Fretboard />
          </View>
          <ScrollView style={styles.tabletControls} showsVerticalScrollIndicator={false}>
            {controlsContent}
          </ScrollView>
          <InfoPanel />
        </View>
      ) : (
        /* ── Phone: original vertical stack ── */
        <View style={{ flex: 1 }}>
          <View style={styles.fbWrap}>
            <Fretboard />
          </View>
          <ScrollView style={styles.controls} showsVerticalScrollIndicator={false}>

            {controlsContent}
          </ScrollView>
          <InfoPanel />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  fbWrap: {
    backgroundColor: COLORS.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACE.md,
  },
  controls: { flex: 1 },
  // iPad layout
  tabletLayout:    { flex: 1 },
  tabletFbWrap:    { backgroundColor: COLORS.bgElevated, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: SPACE.lg },
  tabletControls:  { flex: 1 },
  section: { marginTop: SPACE.lg },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textFaint,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    fontFamily: FONT_FAMILY.mono,
  },
  pillRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACE.lg,
    gap: 6,
    flexWrap: 'nowrap',
  },
  // Surface-fill chip (no hard border, accent ring on active state)
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accent,
  },
  pillRoot: {
    backgroundColor: '#E8D44D',
    borderColor: '#C4A800',
  },
  pillTextRoot: {
    color: '#5C4400',
  },
  pillLocked: {
    opacity: 0.5,
  },
  playScaleBtn: {
    alignSelf: 'center',
    marginTop: SPACE.md,
    marginHorizontal: SPACE.lg,
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
  },
  playScaleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1400',
    letterSpacing: 0.2,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: SPACE.lg,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  customHint: {
    fontSize: 11,
    color: COLORS.textFaint,
    paddingHorizontal: SPACE.lg,
    marginTop: SPACE.sm,
    lineHeight: 16,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
    letterSpacing: 0.1,
  },
  pillTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  // CAGED detail card (replaces the legacy cagedInfo block).
  cagedDetailCard: {
    marginTop: SPACE.md,
    marginHorizontal: SPACE.lg,
    padding: SPACE.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cagedDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACE.sm,
  },
  cagedShapeBadge: {
    width: 40, height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  cagedShapeBadgeText: {
    fontSize: 16, fontWeight: '700',
    color: '#fff',
    fontFamily: FONT_FAMILY.mono,
  },
  cagedShapeTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cagedShapeSub:   { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  cagedShapeDesc:  { fontSize: 13, color: COLORS.textMuted, lineHeight: 19, marginBottom: SPACE.md },
  cagedTipsList:   { gap: 10 },
  cagedTipRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cagedTipNumber:  {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  cagedTipNumberText: {
    fontSize: 10, fontWeight: '700',
    color: COLORS.accent,
    fontFamily: FONT_FAMILY.mono,
  },
  cagedTipText:    { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 19 },
});
