import React, { useMemo } from 'react';
import { ScrollView, View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, {
  Rect, Circle, Line, Text as SvgText, G, Defs, LinearGradient, RadialGradient, Stop,
} from 'react-native-svg';
import {
  NOTES, SCALES, CHORDS,
  CAGED_COLORS, CAGED_ORDER, POSITION_COLORS, COLORS as MUSIC_COLORS,
  intervalColorBucket,
} from '../constants/music';
import { COLORS, FONT_FAMILY } from '../constants/theme';
import {
  getScaleNotes, getChordNotes, getScalePositions,
  getCagedFretRange, noteLabel,
} from '../utils/theory';
import { useStore } from '../store/useStore';
import { getTuning, tuningNoteClasses, STANDARD_TUNING } from '../constants/tunings';

const TOTAL_FRETS = 15;
const STR_COUNT = 6;
const INLAY_FRETS = [3, 5, 7, 9, 12, 15];

// Visual treatment for in-position vs out-of-position notes.
// Per the Obsidian redesign: in-position notes pop, out-of-position notes
// shrink to 86% scale and drop to 32% opacity (vs the prior equal-weight 18%).
const IN_RANGE_OPACITY = 1;
const OUT_OF_RANGE_OPACITY = 0.32;
const OUT_OF_RANGE_SCALE = 0.86;

export default function Fretboard() {
  const { width: screenW } = useWindowDimensions();
  const isTablet = screenW >= 768;

  // Scale fretboard dimensions based on screen width
  const LEFT_PAD = isTablet ? 36 : 30;
  const TOP_PAD = isTablet ? 32 : 28;
  const FRET_W = isTablet ? Math.floor((screenW - 100) / TOTAL_FRETS) : 56;
  const STR_H = isTablet ? 44 : 36;
  const NUT_W = 8;
  const DOT_R = isTablet ? 17 : 14;
  const SVG_W = LEFT_PAD + NUT_W + TOTAL_FRETS * FRET_W + 18;
  const SVG_H = TOP_PAD + (STR_COUNT - 1) * STR_H + 40;

  function fretX(f: number) {
    if (f === 0) return LEFT_PAD + NUT_W / 2;
    return LEFT_PAD + NUT_W + f * FRET_W - FRET_W / 2;
  }
  function strY(s: number) { return TOP_PAD + s * STR_H; }

  const { root, scaleKey, chordKey, mode, labelMode, activePosition, activeCaged, tuningId, customNotes } = useStore();

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
      const sc = SCALES[scaleKey];
      const intv = (noteIdx - root + 12) % 12;
      if (sc) {
        let cum = 0;
        const semitones = [0];
        for (const s of sc.steps) { cum += s; semitones.push(cum % 12); }
        const pos = semitones.indexOf(intv);
        if (pos === 2) return { ...MUSIC_COLORS.third,     opacity, scale, isRoot: false };
        if (pos === 4) return { ...MUSIC_COLORS.fifth,     opacity, scale, isRoot: false };
        if (pos >= 6) return { ...MUSIC_COLORS.extension, opacity, scale, isRoot: false };
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
        </Defs>

        {/* Inlay dots */}
        {INLAY_FRETS.map(f => {
          const x = LEFT_PAD + NUT_W + f * FRET_W - FRET_W / 2;
          if (f === 12) return (
            <G key={f}>
              <Circle cx={x} cy={strY(1.5)} r={3.5} fill={inlayColor} />
              <Circle cx={x} cy={strY(3.5)} r={3.5} fill={inlayColor} />
            </G>
          );
          return <Circle key={f} cx={x} cy={strY(2.5)} r={3.5} fill={inlayColor} />;
        })}

        {/* Position highlight — soft gradient, no harsh outline */}
        {mode === 'scales' && activePosition !== null && positions[activePosition] && (() => {
          const pos = positions[activePosition];
          const x1 = pos.start === 0 ? LEFT_PAD : LEFT_PAD + NUT_W + pos.start * FRET_W - FRET_W / 2;
          const x2 = LEFT_PAD + NUT_W + (pos.end + 1) * FRET_W - FRET_W / 2;
          return (
            <Rect x={x1} y={strY(0) - 14} width={x2 - x1} height={(STR_COUNT - 1) * STR_H + 28}
              rx={10} fill="url(#posHL)" />
          );
        })()}

        {/* CAGED highlight — same gradient treatment with a caret line */}
        {mode === 'caged' && cagedRange && activeCaged && (() => {
          const col = CAGED_COLORS[activeCaged];
          const x1 = cagedRange.start === 0 ? LEFT_PAD : LEFT_PAD + NUT_W + cagedRange.start * FRET_W - FRET_W / 2;
          const x2 = LEFT_PAD + NUT_W + (cagedRange.end + 1) * FRET_W - FRET_W / 2;
          return (
            <G>
              <Rect x={x1} y={strY(0) - 14} width={x2 - x1} height={(STR_COUNT - 1) * STR_H + 28}
                rx={10} fill={col.light} />
              <Line
                x1={LEFT_PAD + NUT_W + cagedRange.caretFret * FRET_W - FRET_W / 2}
                y1={strY(0) - 16}
                x2={LEFT_PAD + NUT_W + cagedRange.caretFret * FRET_W - FRET_W / 2}
                y2={strY(5) + 16}
                stroke={col.fill} strokeWidth={1.5} strokeDasharray="5,4" strokeOpacity={0.6}
              />
            </G>
          );
        })()}

        {/* Frets */}
        {Array.from({ length: TOTAL_FRETS }, (_, i) => i + 1).map(f => (
          <Line key={f}
            x1={LEFT_PAD + NUT_W + f * FRET_W} y1={strY(0) - 10}
            x2={LEFT_PAD + NUT_W + f * FRET_W} y2={strY(5) + 10}
            stroke={f === 12 ? fretColorHL : fretColor} strokeWidth={1}
          />
        ))}

        {/* Strings — hairline with thickness gradient */}
        {Array.from({ length: STR_COUNT }, (_, s) => (
          <G key={s}>
            <Line
              x1={LEFT_PAD} y1={strY(s)}
              x2={LEFT_PAD + NUT_W + TOTAL_FRETS * FRET_W} y2={strY(s)}
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

        {/* Nut — refined */}
        <Rect
          x={LEFT_PAD} y={strY(0) - 12}
          width={NUT_W} height={(STR_COUNT - 1) * STR_H + 24}
          rx={2} fill={nutColor} opacity={0.85}
        />

        {/* Fret numbers — monospace, tabular */}
        {[1,3,5,7,9,12,15].map(f => (
          <SvgText key={f}
            x={LEFT_PAD + NUT_W + f * FRET_W - FRET_W / 2}
            y={SVG_H - 6}
            textAnchor="middle" fontSize={9} fill={COLORS.textFaint}
            fontFamily={FONT_FAMILY.mono}
          >
            {f}
          </SvgText>
        ))}

        {/* Note dots */}
        {Array.from({ length: STR_COUNT }, (_, s) =>
          Array.from({ length: TOTAL_FRETS + 1 }, (_, f) => {
            const ni = (noteClasses[s] + f) % 12;
            const col = getNoteColor(ni, f);
            if (!col) return null;
            const x = fretX(f);
            const y = strY(s);
            const label = noteLabel(ni, root, labelMode, scaleKey, chordKey, mode);
            const fs = label.length > 2 ? 7 : 9;
            const r = DOT_R * col.scale;
            return (
              <G key={`${s}-${f}`} opacity={col.opacity}>
                {col.isRoot && col.opacity === 1 && (
                  <Circle cx={x} cy={y} r={DOT_R + 6} fill="url(#rootGlow)" />
                )}
                <Circle
                  cx={x} cy={y} r={r}
                  fill={col.fill} stroke={col.stroke} strokeWidth={1}
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
