import React, { useMemo } from 'react';
import { ScrollView, View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, {
  Rect, Circle, Line, Text as SvgText, G, Defs, LinearGradient, RadialGradient, Stop,
} from 'react-native-svg';
import {
  NOTES, SCALES, CHORDS,
  CAGED_COLORS, CAGED_ORDER, POSITION_COLORS, COLORS as MUSIC_COLORS,
  intervalColorBucket, scaleDegreeColorBucket,
} from '../constants/music';
import { COLORS, FONT_FAMILY } from '../constants/theme';
import {
  getScaleNotes, getChordNotes, getScalePositions,
  getCagedFretRange, noteLabel,
} from '../utils/theory';
import { useStore, FRET_RANGES, type LabelSize } from '../store/useStore';
import { getTuning, tuningNoteClasses, STANDARD_TUNING } from '../constants/tunings';

const TOTAL_FRETS = 24;
const STR_COUNT = 6;
// Inlay dot positions — standard 24-fret layout. The 12 and 24 positions
// are doubles (rendered as two dots) since they mark the octave and
// double-octave respectively.
const INLAY_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

// Per-size font sizes for note labels inside the dots. 'sm' matches the
// long-shipped default that a support email called out as hard to read;
// 'md' (the new default) bumps both sizes by +2pt for everyone, and 'lg'
// adds another +2 for users with vision needs. Dot radius isn't scaled —
// keeping it constant makes the bigger font fill more of the circle,
// which is what actually improves readability.
const LABEL_FONT_SHORT: Record<LabelSize, number> = { sm: 9,  md: 11, lg: 13 };
const LABEL_FONT_LONG:  Record<LabelSize, number> = { sm: 7,  md: 9,  lg: 11 };

// Visual treatment for in-position vs out-of-position notes.
// Per the Obsidian redesign: in-position notes pop, out-of-position notes
// shrink to 86% scale and drop to 32% opacity (vs the prior equal-weight 18%).
const IN_RANGE_OPACITY = 1;
const OUT_OF_RANGE_OPACITY = 0.32;
const OUT_OF_RANGE_SCALE = 0.86;

export default function Fretboard() {
  const { width: screenW } = useWindowDimensions();
  const isTablet = screenW >= 768;

  const { root, scaleKey, chordKey, mode, labelMode, activePosition, activeCaged, tuningId, customNotes, labelSize, fretRange } = useStore();
  const playbackHighlight = useStore(s => s.playbackHighlight);
  // Only used in Custom mode — every fret position becomes a tap target
  // that toggles the note class at that position on/off.
  const toggleCustomNote = useStore(s => s.toggleCustomNote);
  // Custom mode is Pro; non-Pro users see the Fretboard in read-only shape
  // (no tap-to-edit, no ghost dots) so the interactive tap-to-add doesn't
  // leak the feature outside the paywall. The Identify preview panel in
  // the controls area handles the upsell.
  const isPro = useStore(s => s.isPro);

  // Fret-range window. When the user picks a narrower range than 'all', we
  // hide everything outside [winStart, winEnd] AND grow FRET_W so the
  // remaining range fills the available width — the point of "focus on
  // first 5 frets" is to actually see them larger, not just clip the rest.
  const range = FRET_RANGES[fretRange];
  const winStart = range.start;
  const winEnd = range.end;
  const showNut = winStart === 0;
  const cellCount = showNut ? winEnd : winEnd - winStart + 1;

  // Scale fretboard dimensions based on screen width
  const LEFT_PAD = isTablet ? 36 : 30;
  const TOP_PAD = isTablet ? 32 : 28;
  const NUT_W = 8;
  const STR_H = isTablet ? 44 : 36;
  const DOT_R = isTablet ? 17 : 14;

  // FRET_W: for the full neck on phone, keep the original fixed 56px (lets
  // the existing horizontal scroll work). For narrower ranges, or on tablet
  // at any range, fit the range to the available width so the zoom-in is
  // actually visible.
  const isFullRangePhone = fretRange === 'all' && !isTablet;
  const availableW = screenW - (isTablet ? 100 : 60);
  const FRET_W = isFullRangePhone
    ? 56
    : Math.floor((availableW - (showNut ? NUT_W : 0)) / cellCount);

  const SVG_W = LEFT_PAD + (showNut ? NUT_W : 0) + cellCount * FRET_W + 18;
  const SVG_H = TOP_PAD + (STR_COUNT - 1) * STR_H + 40;

  function fretX(f: number) {
    // Open string (fret 0) sits at the nut. Only meaningful when the window
    // includes the open position.
    if (showNut && f === 0) return LEFT_PAD + NUT_W / 2;
    // Offset within the rendered cell grid. cellIdx 0 = leftmost fretted
    // cell. For windowed ranges (winStart > 0) the leftmost cell holds the
    // winStart fret itself.
    const cellIdx = f - (showNut ? 1 : winStart);
    return LEFT_PAD + (showNut ? NUT_W : 0) + cellIdx * FRET_W + FRET_W / 2;
  }
  // X-coordinate of the metal fret line at the END (high-fret side) of the
  // cell holding fret f. Used for drawing fret bars and the bounding box of
  // position/CAGED highlight rectangles.
  function fretLineX(f: number) {
    const offsetFromLeftmostCell = f - (showNut ? 1 : winStart) + 1;
    return LEFT_PAD + (showNut ? NUT_W : 0) + offsetFromLeftmostCell * FRET_W;
  }
  function strY(s: number) { return TOP_PAD + s * STR_H; }

  // CAGED is defined by standard-tuning open shapes — force standard for that mode.
  const activeTuning = mode === 'caged' ? STANDARD_TUNING : getTuning(tuningId);
  const noteClasses = useMemo(() => tuningNoteClasses(activeTuning), [activeTuning]);
  const stringNames = activeTuning.stringNames;

  const activeNotes = useMemo(() => {
    if (mode === 'chords') return getChordNotes(root, chordKey);
    if (mode === 'custom') return customNotes;
    return getScaleNotes(root, scaleKey);
  }, [root, scaleKey, chordKey, mode, customNotes]);

  const positions = useMemo(() =>
    mode === 'scales' ? getScalePositions(root, scaleKey, noteClasses) : [],
    [root, scaleKey, mode, noteClasses],
  );

  const cagedRange = useMemo(() =>
    (mode === 'caged' && activeCaged)
      ? getCagedFretRange(root, activeCaged as any)
      : null,
    [root, activeCaged, mode],
  );

  const cagedNotes = useMemo(() =>
    mode === 'caged' ? getScaleNotes(root, 'Major') : [],
    [root, mode],
  );

  function isInRange(fret: number): boolean {
    if (mode === 'scales' && activePosition !== null) {
      const pos = positions[activePosition];
      return !!pos && fret >= pos.start && fret <= pos.end;
    }
    if (mode === 'caged' && cagedRange) {
      return fret >= cagedRange.start && fret <= cagedRange.end;
    }
    return true;
  }

  function getNoteColor(noteIdx: number, fret: number) {
    const notes = mode === 'caged' ? cagedNotes : activeNotes;
    if (!notes.includes(noteIdx)) return null;
    const inRange = isInRange(fret);
    const opacity = inRange ? IN_RANGE_OPACITY : OUT_OF_RANGE_OPACITY;
    const scale = inRange ? 1 : OUT_OF_RANGE_SCALE;

    if (noteIdx === root) return { ...MUSIC_COLORS.root, opacity, scale, isRoot: true };

    if (mode === 'chords') {
      // Color by the note's INTERVAL ROLE in the chord (matches the symbol-
      // based pills shown beneath the chord in the chord library), not by
      // its index in the intervals[] array. Previously a Sus4's 4th and a
      // Power 5's 5th both got the "third" color because they were at
      // intervals[1] — visually mismatching the pills.
      const ch = CHORDS[chordKey];
      const intv = (noteIdx - root + 12) % 12;
      const ci = ch.intervals.map(i => i % 12);
      const pos = ci.indexOf(intv);
      const symbol = pos >= 0 ? ch.intervalNames[pos] : undefined;
      if (symbol) {
        const bucket = intervalColorBucket(symbol);
        if (bucket === 'third') return { ...MUSIC_COLORS.third,     opacity, scale, isRoot: false };
        if (bucket === 'fifth') return { ...MUSIC_COLORS.fifth,     opacity, scale, isRoot: false };
        if (bucket === 'ext')   return { ...MUSIC_COLORS.extension, opacity, scale, isRoot: false };
      }
    }

    if (mode === 'scales') {
      // Color by the degree's INTERVAL ROLE (via scaleDegreeColorBucket),
      // not by its position in the scale's degree list. The position-based
      // rule worked for heptatonic scales (Major's degree[2] is always a
      // 3rd, degree[4] is always a 5th) but mis-painted non-heptatonic
      // scales: Pentatonic Minor's ♭3 sat at position 1 and went uncolored,
      // its 4 sat at position 2 and was painted RED as if it were a third.
      // Now: ♭3 → third red, 4 → scaleTone gray, 5 → fifth green, ♭7 →
      // ext blue, with 2/4/6 staying gray so the 1-3-5-7 arpeggio still
      // reads through the scale.
      const sc = SCALES[scaleKey];
      const intv = (noteIdx - root + 12) % 12;
      if (sc) {
        let cum = 0;
        const semitones = [0];
        for (const s of sc.steps) { cum += s; semitones.push(cum % 12); }
        const pos = semitones.indexOf(intv);
        if (pos >= 0) {
          const bucket = scaleDegreeColorBucket(sc.degrees[pos]);
          if (bucket === 'third') return { ...MUSIC_COLORS.third,     opacity, scale, isRoot: false };
          if (bucket === 'fifth') return { ...MUSIC_COLORS.fifth,     opacity, scale, isRoot: false };
          if (bucket === 'ext')   return { ...MUSIC_COLORS.extension, opacity, scale, isRoot: false };
          // 'tone' (2/4/6) intentionally falls through to scaleTone gray.
        }
      }
    }

    if (mode === 'custom') {
      // Color by interval relative to root — no scale context
      const intv = (noteIdx - root + 12) % 12;
      if (intv === 3 || intv === 4)   return { ...MUSIC_COLORS.third,     opacity, scale, isRoot: false }; // 3rd
      if (intv === 7)                 return { ...MUSIC_COLORS.fifth,     opacity, scale, isRoot: false }; // 5th
      if (intv === 10 || intv === 11) return { ...MUSIC_COLORS.extension, opacity, scale, isRoot: false }; // 7th
    }

    if (mode === 'caged' && activeCaged) {
      const col = CAGED_COLORS[activeCaged];
      return { fill: col.fill, stroke: col.stroke, text: '#fff', opacity, scale, isRoot: false };
    }

    if (mode === 'caged' && !activeCaged) {
      for (const shape of CAGED_ORDER) {
        const range = getCagedFretRange(root, shape as any);
        if (fret >= range.start && fret <= range.end) {
          const col = CAGED_COLORS[shape];
          return { fill: col.fill, stroke: col.stroke, text: '#fff', opacity: 1, scale: 1, isRoot: false };
        }
      }
    }

    return { ...MUSIC_COLORS.scaleTone, opacity, scale, isRoot: false };
  }

  const inlayColor   = 'rgba(255,255,255,0.06)';
  const fretColor    = 'rgba(255,255,255,0.08)';
  const fretColorHL  = 'rgba(255,255,255,0.16)';
  const stringColor  = 'rgba(242,241,236,0.55)';
  const nutColor     = '#D9D6CC';

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
        <Defs>
          {/* Position highlight: vertical gradient (no harsh outline) */}
          <LinearGradient id="posHL" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={COLORS.accent} stopOpacity="0.20" />
            <Stop offset="100%" stopColor={COLORS.accent} stopOpacity="0.08" />
          </LinearGradient>
          {/* Soft radial glow under the active root note */}
          <RadialGradient id="rootGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={MUSIC_COLORS.root.fill} stopOpacity="0.45" />
            <Stop offset="100%" stopColor={MUSIC_COLORS.root.fill} stopOpacity="0" />
          </RadialGradient>
          {/* White-ish glow used to mark the currently-playing note during
              scale playback. Different hue from rootGlow so it reads as
              "now playing" rather than "this is the root." */}
          <RadialGradient id="playGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Inlay dots — skipped when outside the visible window */}
        {INLAY_FRETS.filter(f => f >= winStart && f <= winEnd).map(f => {
          const x = fretX(f);
          // Octave frets (12 and 24) get double dots — the standard
          // guitar-neck convention marks the two octaves that way.
          if (f === 12 || f === 24) return (
            <G key={f}>
              <Circle cx={x} cy={strY(1.5)} r={3.5} fill={inlayColor} />
              <Circle cx={x} cy={strY(3.5)} r={3.5} fill={inlayColor} />
            </G>
          );
          return <Circle key={f} cx={x} cy={strY(2.5)} r={3.5} fill={inlayColor} />;
        })}

        {/* Position highlight — clamped to the visible window. If the
            position lies entirely outside the window, the rect collapses
            and renders nothing visible. */}
        {mode === 'scales' && activePosition !== null && positions[activePosition] && (() => {
          const pos = positions[activePosition];
          const clampedStart = Math.max(pos.start, winStart);
          const clampedEnd = Math.min(pos.end, winEnd);
          if (clampedStart > clampedEnd) return null;
          const x1 = clampedStart === 0 && showNut ? LEFT_PAD : fretX(clampedStart) - FRET_W / 2;
          const x2 = fretLineX(clampedEnd);
          return (
            <Rect x={x1} y={strY(0) - 14} width={x2 - x1} height={(STR_COUNT - 1) * STR_H + 28}
              rx={10} fill="url(#posHL)" />
          );
        })()}

        {/* CAGED highlight — same gradient treatment with a caret line.
            Caret only renders when it falls inside the window. */}
        {mode === 'caged' && cagedRange && activeCaged && (() => {
          const col = CAGED_COLORS[activeCaged];
          const clampedStart = Math.max(cagedRange.start, winStart);
          const clampedEnd = Math.min(cagedRange.end, winEnd);
          if (clampedStart > clampedEnd) return null;
          const x1 = clampedStart === 0 && showNut ? LEFT_PAD : fretX(clampedStart) - FRET_W / 2;
          const x2 = fretLineX(clampedEnd);
          const caretInWindow = cagedRange.caretFret >= winStart && cagedRange.caretFret <= winEnd;
          return (
            <G>
              <Rect x={x1} y={strY(0) - 14} width={x2 - x1} height={(STR_COUNT - 1) * STR_H + 28}
                rx={10} fill={col.light} />
              {caretInWindow && (
                <Line
                  x1={fretX(cagedRange.caretFret)}
                  y1={strY(0) - 16}
                  x2={fretX(cagedRange.caretFret)}
                  y2={strY(5) + 16}
                  stroke={col.fill} strokeWidth={1.5} strokeDasharray="5,4" strokeOpacity={0.6}
                />
              )}
            </G>
          );
        })()}

        {/* Frets — only render lines for frets in the visible window. For
            showNut ranges that's frets 1..winEnd. For mid-neck ranges
            (winStart > 0) the leftmost fret line is at the window's left
            edge (winStart) plus everything after. */}
        {Array.from({ length: cellCount }, (_, i) => (showNut ? i + 1 : winStart + i)).map(f => (
          <Line key={f}
            x1={fretLineX(f)} y1={strY(0) - 10}
            x2={fretLineX(f)} y2={strY(5) + 10}
            stroke={(f === 12 || f === 24) ? fretColorHL : fretColor} strokeWidth={1}
          />
        ))}

        {/* Strings — hairline with thickness gradient. Width follows the
            window: from the leftmost cell edge to the rightmost. */}
        {Array.from({ length: STR_COUNT }, (_, s) => (
          <G key={s}>
            <Line
              x1={LEFT_PAD} y1={strY(s)}
              x2={LEFT_PAD + (showNut ? NUT_W : 0) + cellCount * FRET_W} y2={strY(s)}
              stroke={stringColor} strokeWidth={0.5 + (s / STR_COUNT) * 1.4} strokeOpacity={0.7}
            />
            <SvgText
              x={LEFT_PAD - 10} y={strY(s) + 4}
              textAnchor="middle" fontSize={10} fill="rgba(242,241,236,0.40)"
              fontFamily={FONT_FAMILY.mono} fontWeight="500"
            >
              {stringNames[s]}
            </SvgText>
          </G>
        ))}

        {/* Nut — only when the open position is part of the window. */}
        {showNut && (
          <Rect
            x={LEFT_PAD} y={strY(0) - 12}
            width={NUT_W} height={(STR_COUNT - 1) * STR_H + 24}
            rx={2} fill={nutColor} opacity={0.85}
          />
        )}

        {/* Fret numbers — only render the ones inside the window. For
            mid-neck windows we also show the leftmost fret number so the
            user knows where on the neck they are looking. */}
        {Array.from(new Set([
          ...[1,3,5,7,9,12,15,17,19,21,24].filter(f => f >= winStart && f <= winEnd),
          // Always include the window's leftmost fret as an orientation
          // marker when we're not showing the nut.
          ...(!showNut ? [winStart] : []),
        ])).sort((a, b) => a - b).map(f => (
          <SvgText key={f}
            x={fretX(f)}
            y={SVG_H - 6}
            textAnchor="middle" fontSize={9} fill={COLORS.textFaint}
            fontFamily={FONT_FAMILY.mono}
          >
            {f}
          </SvgText>
        ))}

        {/* Note dots — skip frets outside the visible window so we don't
            paint hidden notes into negative or oversized canvas regions.
            In Custom mode, every position renders (as a tap target with a
            subtle ghost dot when unselected) so the user can pick notes
            directly on the fretboard instead of hunting the pill row. */}
        {Array.from({ length: STR_COUNT }, (_, s) =>
          Array.from({ length: TOTAL_FRETS + 1 }, (_, f) => {
            if (f < winStart || f > winEnd) return null;
            const ni = (noteClasses[s] + f) % 12;
            const col = getNoteColor(ni, f);
            // Custom mode is Pro. Non-Pro users still see the mode but the
            // fretboard falls back to non-interactive (no ghost dots, no
            // onPress) — the controls area shows a preview + upsell.
            const isCustom = mode === 'custom' && isPro;
            // Skip empty positions in non-Custom modes — the read-only
            // fretboard should stay uncluttered. In Custom mode we render
            // a ghost dot at empty positions to advertise tappability.
            if (!col && !isCustom) return null;
            const x = fretX(f);
            const y = strY(s);
            const label = col ? noteLabel(ni, root, labelMode, scaleKey, chordKey, mode) : '';
            // User-controlled font size — the support-email request was that
            // labels were hard to read. Defaults to 'md' (11pt/9pt), one tier
            // above the old 'sm' baseline (9pt/7pt).
            const fs = label.length > 2 ? LABEL_FONT_LONG[labelSize] : LABEL_FONT_SHORT[labelSize];
            // When this note's pitch class matches the currently-playing
            // scale note, scale the dot up and overlay a bright white ring +
            // outer glow so all instances of that pitch on the neck "light up"
            // simultaneously. Lets the user see where the note they're hearing
            // lives across the entire fretboard.
            const isPlaying = col && playbackHighlight !== null && ni === playbackHighlight;
            const r = col ? DOT_R * col.scale * (isPlaying ? 1.35 : 1) : DOT_R;

            const inner = (
              <>
                {/* Oversized transparent hit target for Custom mode — makes
                    the ~28px note dots comfortable to tap on. Renders behind
                    the visible dot so touches on either land on the same
                    handler. */}
                {isCustom && (
                  <Circle cx={x} cy={y} r={DOT_R * 1.5} fill="transparent" />
                )}
                {/* Ghost dot on empty Custom positions — subtle visual
                    affordance that the position is tappable. Small enough
                    not to compete with the colored dots for selected notes. */}
                {isCustom && !col && (
                  <Circle
                    cx={x} cy={y} r={DOT_R * 0.4}
                    fill="rgba(255,255,255,0.05)"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth={0.8}
                  />
                )}
                {col && (
                  <>
                    {col.isRoot && col.opacity === 1 && (
                      <Circle cx={x} cy={y} r={DOT_R + 6} fill="url(#rootGlow)" />
                    )}
                    {isPlaying && (
                      <Circle cx={x} cy={y} r={DOT_R + 10} fill="url(#playGlow)" />
                    )}
                    <Circle
                      cx={x} cy={y} r={r}
                      fill={col.fill}
                      stroke={isPlaying ? '#ffffff' : col.stroke}
                      strokeWidth={isPlaying ? 2.5 : 1}
                    />
                    {label ? (
                      <SvgText
                        x={x} y={y + fs / 2 + 1}
                        textAnchor="middle" fontSize={fs} fontWeight="600"
                        fill={col.text}
                        fontFamily={FONT_FAMILY.mono}
                      >
                        {label}
                      </SvgText>
                    ) : null}
                  </>
                )}
              </>
            );

            return isCustom ? (
              <G key={`${s}-${f}`} opacity={col?.opacity ?? 1} onPress={() => toggleCustomNote(ni)}>
                {inner}
              </G>
            ) : (
              <G key={`${s}-${f}`} opacity={col!.opacity}>
                {inner}
              </G>
            );
          })
        )}
      </Svg>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: 4 },
});
