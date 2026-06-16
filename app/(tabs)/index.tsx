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
import { useStore, SCALE_SPEED_MS, ScalePlaybackSpeed, PlaybackHighlightMode } from '../../src/store/useStore';
import { getScalePositions, getCagedCaretFret } from '../../src/utils/theory';
import { useProGate } from '../../src/hooks/useProGate';
import { useAudioEngine } from '../../src/hooks/useAudioEngine';
import { isScaleFree, isChordFree } from '../../src/constants/subscription';
import { getTuning } from '../../src/constants/tunings';

// Pick the single fretboard position for a MIDI note in single-line trail
// mode. Rule: lowest fret across all strings; on a tie, prefer the higher
// string (closer to high e) so an ascending scale tends to climb one string.
// Returns null when the note is off the visible neck — caller should clear
// the highlight that step. Row uses Fretboard render order (0 = high e).
const TOTAL_FRETS = 15;
function pickTrailPosition(
  midi: number,
  tuningMidi: number[],     // low→high (idx 0 = low E)
): { row: number; fret: number } | null {
  let best: { row: number; fret: number } | null = null;
  for (let lowString = 0; lowString < tuningMidi.length; lowString++) {
    const fret = midi - tuningMidi[lowString];
    if (fret < 0 || fret > TOTAL_FRETS) continue;
    const row = tuningMidi.length - 1 - lowString;  // low→high → high→low render order
    if (!best || fret < best.fret || (fret === best.fret && row < best.row)) {
      best = { row, fret };
    }
  }
  return best;
}

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
  const setPlaybackHighlightPos = useStore(s => s.setPlaybackHighlightPos);
  const scalePlaybackSpeed = useStore(s => s.scalePlaybackSpeed);
  const setScalePlaybackSpeed = useStore(s => s.setScalePlaybackSpeed);
  const playbackHighlightMode = useStore(s => s.playbackHighlightMode);
  const setPlaybackHighlightMode = useStore(s => s.setPlaybackHighlightMode);
  const tuningId = useStore(s => s.tuningId);

  // True when playback should be locked behind the paywall. Playback is free
  // for the scales the free tier can already select — locking it there too
  // would be punishing the user twice for the same paywall.
  const scalePlaybackLocked = !isPro && !isScaleFree(scaleKey);

  // Build a MIDI sequence for the active scale and play the classic
  // practice-room pattern: two octaves ascending, then back down to the
  // root. Crossing octaves makes the visual highlight pay off — the same
  // pitch class lights up at multiple positions on the neck. Only the
  // Pro-only scales are gated; free scales play freely.
  // Tap-again-to-stop pattern.
  function handlePlayScale() {
    if (playingScale) {
      stopProgression();
      setPlayingScale(false);
      setPlaybackHighlight(null);
      setPlaybackHighlightPos(null);
      return;
    }
    const apply = () => {
      const sc = SCALES[scaleKey];
      if (!sc) return;
      // 60 = C4 (middle C). Transpose to the active root so any key starts
      // in the same comfortable octave. 'All' mode plays two octaves so the
      // pitch-class highlight gets to show off across the neck; 'single' mode
      // plays one octave because the trail position runs off the visible
      // fretboard somewhere in the upper octave for most roots.
      const startMidi = 60 + root;
      const octaveCount = playbackHighlightMode === 'single' ? 1 : 2;
      const ascending: number[] = [startMidi];
      let cur = startMidi;
      for (let octave = 0; octave < octaveCount; octave++) {
        for (const step of sc.steps) {
          cur += step;
          ascending.push(cur);
        }
      }
      // Descend back to the start. Drop the top note so it doesn't double-hit
      // at the turnaround — the ascent already played it.
      const descending = ascending.slice(0, -1).reverse();
      const notes = [...ascending, ...descending];

      // For 'single' mode, pre-compute the position trail once so the per-step
      // callback is a cheap array lookup. Notes above fret 15 (common in the
      // upper octave for high roots) resolve to null — the highlight just
      // disappears for that step, signaling "off the visible neck."
      const tuningMidi = getTuning(tuningId).midi;
      const trail = playbackHighlightMode === 'single'
        ? notes.map(m => pickTrailPosition(m, tuningMidi))
        : null;

      setPlayingScale(true);
      playScale(
        notes,
        SCALE_SPEED_MS[scalePlaybackSpeed],
        // Per-step: in 'all' mode light up every position matching the pitch
        // class; in 'single' mode light just the trail position chosen above.
        (idx) => {
          if (trail) {
            setPlaybackHighlight(null);
            setPlaybackHighlightPos(trail[idx]);
          } else {
            setPlaybackHighlightPos(null);
            setPlaybackHighlight(notes[idx] % 12);
          }
        },
        // Finish: clear both highlights and reset the button state.
        () => {
          setPlaybackHighlight(null);
          setPlaybackHighlightPos(null);
          setPlayingScale(false);
        },
      );
    };
    if (scalePlaybackLocked) { requirePro(apply); return; }
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
            {/* Speed selector — paired with the Play button below. Lets
                learners slow the playback enough to track each highlighted
                note across the neck before the next one fires. */}
            <View style={styles.speedRow}>
              <Text style={styles.speedLabel}>Speed</Text>
              {(['slow', 'normal', 'fast'] as ScalePlaybackSpeed[]).map(s => {
                const active = scalePlaybackSpeed === s;
                return (
                  <TouchableOpacity key={s}
                    onPress={() => setScalePlaybackSpeed(s)}
                    style={[styles.speedPill, active && styles.speedPillActive]}
                    activeOpacity={0.7}>
                    <Text style={[styles.speedPillText, active && styles.speedPillTextActive]}>
                      {s === 'slow' ? 'Slow' : s === 'normal' ? 'Normal' : 'Fast'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* Highlight mode — All lights every matching pitch class on the
                neck; Single lights just one dot at a time. Quieter for
                beginners learning their first scale shapes. */}
            <View style={[styles.speedRow, styles.speedRowTight]}>
              <Text style={styles.speedLabel}>Highlight</Text>
              {(['all', 'single'] as PlaybackHighlightMode[]).map(m => {
                const active = playbackHighlightMode === m;
                return (
                  <TouchableOpacity key={m}
                    onPress={() => setPlaybackHighlightMode(m)}
                    style={[styles.speedPill, active && styles.speedPillActive]}
                    activeOpacity={0.7}>
                    <Text style={[styles.speedPillText, active && styles.speedPillTextActive]}>
                      {m === 'all' ? 'All' : 'Single'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* Play scale button — Pro feature. Plays the current scale across
                two octaves ascending then descending, at the chosen speed. */}
            <TouchableOpacity onPress={handlePlayScale} style={styles.playScaleBtn} activeOpacity={0.85}>
              <Text style={styles.playScaleBtnText}>
                {scalePlaybackLocked ? '🔒  ' : ''}{playingScale ? '⏸  Stop' : '▶  Hear scale'}
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
    marginTop: SPACE.sm,
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
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACE.md,
    paddingHorizontal: SPACE.lg,
  },
  // Stacked sibling rows (e.g. Highlight under Speed) — tighter top gap so
  // they read as a single grouped controls block.
  speedRowTight: {
    marginTop: SPACE.xs,
  },
  speedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginRight: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  speedPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  speedPillActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accent,
  },
  speedPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  speedPillTextActive: {
    color: COLORS.text,
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
