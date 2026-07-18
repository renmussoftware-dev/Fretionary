import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Fretboard from '../../src/components/Fretboard';
import TopBar from '../../src/components/TopBar';
import InfoPanel from '../../src/components/InfoPanel';
import PillSelector from '../../src/components/PillSelector';
import DailyPickCard from '../../src/components/DailyPickCard';
import ChordBox from '../../src/components/ChordBox';

// Canonical pitch-class root for each CAGED letter — the note where the
// shape sits in its open position. We render the open-position major chord
// at this root in the CAGED detail card so the user can SEE what the shape
// looks like (the prototype). The Fretboard above already shows where the
// shape lives for the user's actually-selected root; the diagram answers
// "what does this shape itself look like?" which the support email user
// pointed out was missing.
const CAGED_PROTOTYPE_ROOT: Record<string, number> = {
  C: 0, A: 9, G: 7, E: 4, D: 2,
};
import { COLORS, SPACE, RADIUS, FONT_FAMILY } from '../../src/constants/theme';
import {
  NOTES, NOTE_DISPLAY,
  SCALES, CHORDS, CAGED_ORDER, CAGED_COLORS, CAGED_SHAPES,
  CAGED_SHAPE_TIPS, POSITION_COLORS,
} from '../../src/constants/music';
import { useStore, SCALE_SPEED_MS, ScalePlaybackSpeed } from '../../src/store/useStore';
import { getScalePositions, getCagedCaretFret, identifyCustomSelection } from '../../src/utils/theory';
import { useProGate } from '../../src/hooks/useProGate';
import { useAudioEngine } from '../../src/hooks/useAudioEngine';
import { isScaleFree, isChordFree } from '../../src/constants/subscription';

const LABEL_OPTIONS = [
  { label: 'Note', value: 'name' },
  { label: 'Degree', value: 'degree' },
  { label: 'Interval', value: 'interval' },
  { label: 'None', value: 'none' },
];

const LABEL_SIZE_OPTIONS = [
  { label: 'Sm', value: 'sm' },
  { label: 'Md', value: 'md' },
  { label: 'Lg', value: 'lg' },
];

// Pull friendly labels straight from FRET_RANGES so the picker and the
// renderer can't drift. Order matches All → narrow → mid → high → 24-fret
// extended. Default 'All' stays at 15 frets so scale mode doesn't feel
// cluttered on phones; 24 is opt-in for users who need the full range.
const FRET_RANGE_OPTIONS = [
  { label: 'All',  value: 'all'      },
  { label: '0–5',  value: 'open'     },
  { label: '0–7',  value: 'low'      },
  { label: '5–12', value: 'mid'      },
  { label: '12+',  value: 'high'     },
  { label: '24',   value: 'extended' },
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
    labelSize, setLabelSize, fretRange, setFretRange,
  } = useStore();
  const setPlaybackHighlight = useStore(s => s.setPlaybackHighlight);
  const scalePlaybackSpeed = useStore(s => s.scalePlaybackSpeed);
  const setScalePlaybackSpeed = useStore(s => s.setScalePlaybackSpeed);
  const recordScaleExplored = useStore(s => s.recordScaleExplored);

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
      // Progress tracking: playing the scale is the "practiced" signal.
      recordScaleExplored(scaleKey);
      playScale(
        notes,
        SCALE_SPEED_MS[scalePlaybackSpeed],
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
        {/* Custom / Identify mode — Pro feature. Non-Pro users see a preview
            panel (coded mockup + description + CTA) instead of the note
            picker so they can understand what the mode does before deciding
            whether to upgrade. */}
        {mode === 'custom' && !isPro && (
          <View style={styles.section}>
            <View style={styles.identifyPreviewCard}>
              <Text style={styles.identifyPreviewEyebrow}>PREVIEW · PRO</Text>
              <Text style={styles.identifyPreviewTitle}>Identify</Text>
              <Text style={styles.identifyPreviewSub}>
                Pick any notes on the fretboard and see what chord or interval you're playing. A reverse chord dictionary for figuring out what your fingers are doing.
              </Text>

              {/* Coded mock of the identifier card — same visual language as
                  the real one, with a static example (C Major = C E G). */}
              <View style={styles.identifyMockCard}>
                <Text style={styles.identifyLabel}>This is</Text>
                <Text style={styles.identifyName}>C Major</Text>
                <Text style={styles.identifyDetail}>C (R) · E (3) · G (5)</Text>
              </View>

              <View style={styles.identifyMockCard}>
                <Text style={styles.identifyLabel}>This is</Text>
                <Text style={styles.identifyName}>Perfect 5th</Text>
                <Text style={styles.identifyDetail}>C → G</Text>
              </View>

              <TouchableOpacity
                onPress={() => requirePro(() => {})}
                activeOpacity={0.85}
                style={styles.identifyUnlockBtn}
              >
                <Text style={styles.identifyUnlockBtnText}>Unlock Identify with Pro →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Custom note picker */}
        {mode === 'custom' && isPro && (
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

            {/* Live identification — names whatever the user has picked.
                2 notes: friendly interval name. 3+ notes: best chord match,
                with each selected note's role (R / 3 / 5 / etc.) underneath.
                Falls back to "No exact chord" so the user knows they're free-
                improvising, not that the panel broke. Hidden for 0-1 notes
                (the pills above already show that state plenty clearly). */}
            {(() => {
              const id = identifyCustomSelection(customNotes, root);
              if (id.kind === 'none' || id.kind === 'note') return null;
              return (
                <View style={styles.identifyCard}>
                  <Text style={styles.identifyLabel}>This is</Text>
                  {id.kind === 'interval' && (
                    <>
                      <Text style={styles.identifyName}>{id.name}</Text>
                      <Text style={styles.identifyDetail}>
                        {NOTES[id.rootIdx]} → {NOTES[id.otherIdx]}
                      </Text>
                    </>
                  )}
                  {id.kind === 'chord' && (
                    <>
                      <Text style={styles.identifyName}>
                        {NOTES[id.rootIdx]} {id.chordKey}
                      </Text>
                      <Text style={styles.identifyDetail}>
                        {id.noteRoles.map(r => `${NOTES[r.note]} (${r.symbol})`).join(' · ')}
                      </Text>
                    </>
                  )}
                  {id.kind === 'noMatch' && (
                    <>
                      <Text style={styles.identifyName}>No exact chord</Text>
                      <Text style={styles.identifyDetail}>
                        {id.notes.slice().sort((a, b) => a - b).map(n => NOTES[n]).join(' · ')}
                      </Text>
                    </>
                  )}
                </View>
              );
            })()}

            <Text style={styles.customHint}>
              Tap the note pills above or tap positions directly on the fretboard to add or remove them. Use the root selector above to set your key — the root note is colored differently when included.
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
              const protoRoot = CAGED_PROTOTYPE_ROOT[activeCaged];
              const protoNoteName = protoRoot !== undefined ? NOTES[protoRoot] : null;
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

                  {/* Prototype chord diagram — shows what the CAGED letter's
                      reference shape actually LOOKS like (e.g. C shape =
                      open C major). The fretboard above already shows where
                      this shape sits for the user's selected root; this
                      diagram answers "what does the shape itself look
                      like?" which a support email surfaced as a real gap
                      in the app's CAGED explanation. */}
                  {protoRoot !== undefined && (
                    <View style={styles.cagedProtoWrap}>
                      <Text style={styles.cagedProtoLabel}>
                        Reference shape · open {protoNoteName} major
                      </Text>
                      <ChordBox
                        root={protoRoot}
                        chordKey="Major"
                        compact
                        lockToLabel={`${activeCaged} shape`}
                      />
                      <Text style={styles.cagedProtoHint}>
                        {caret > 0
                          ? `Memorize this fingering — for your selected key, barre this shape at fret ${caret}. The colored region on the fretboard above shows where it lives.`
                          : `Memorize this fingering — for your selected key the shape sits in open position, exactly as shown.`}
                      </Text>
                    </View>
                  )}

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
        {/* Display section — readability controls. Both pickers apply across
            every fretboard mode and persist via the store. */}
        <View style={styles.section}>
          <PillSelector label="Label size" options={LABEL_SIZE_OPTIONS} value={labelSize}
            onChange={v => v && setLabelSize(v as any)} allowDeselect={false} />
        </View>
        <View style={styles.section}>
          <PillSelector label="Fret range" options={FRET_RANGE_OPTIONS} value={fretRange}
            onChange={v => v && setFretRange(v as any)} allowDeselect={false} />
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
  // Live identification card — sits below the note pills in Custom mode.
  identifyCard: {
    marginTop: SPACE.md,
    marginHorizontal: SPACE.lg,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  identifyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  identifyName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.accent,
  },
  identifyDetail: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
  },
  // Preview panel shown to non-Pro users when they land on the Identify
  // tab. Coded mockup of the identifier card + short explainer + upsell.
  identifyPreviewCard: {
    marginHorizontal: SPACE.lg,
    padding: SPACE.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSoft,
  },
  identifyPreviewEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  identifyPreviewTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  identifyPreviewSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
    marginBottom: SPACE.md,
  },
  identifyMockCard: {
    padding: SPACE.md,
    marginBottom: SPACE.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  identifyUnlockBtn: {
    marginTop: SPACE.md,
    paddingVertical: 12,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  identifyUnlockBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
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
  // Prototype-shape mini diagram inside the CAGED detail card.
  cagedProtoWrap: {
    alignItems: 'center',
    paddingVertical: SPACE.md,
    marginBottom: SPACE.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  cagedProtoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACE.sm,
  },
  cagedProtoHint: {
    fontSize: 11,
    color: COLORS.textFaint,
    lineHeight: 16,
    marginTop: SPACE.sm,
    paddingHorizontal: SPACE.md,
    textAlign: 'center',
  },
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
