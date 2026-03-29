import React, { useMemo } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import Svg, {
  Rect, Circle, Line, Text as SvgText, G, Defs, Pattern,
} from 'react-native-svg';
import {
  OPEN_STRINGS, STRING_NAMES, NOTES, SCALES, CHORDS,
  CAGED_COLORS, POSITION_COLORS, COLORS as MUSIC_COLORS,
} from '../constants/music';
import { COLORS, SCREEN_W } from '../constants/theme';
import {
  getScaleNotes, getChordNotes, getScalePositions,
  getCagedFretRange, noteLabel,
} from '../utils/theory';
import { useStore } from '../store/useStore';

const TOTAL_FRETS = 15;
const STR_COUNT = 6;
const LEFT_PAD = 28;
const TOP_PAD = 24;
const FRET_W = 52;
const STR_H = 34;
const NUT_W = 6;
const DOT_R = 13;
const INLAY_FRETS = [3, 5, 7, 9, 12, 15];

const SVG_W = LEFT_PAD + NUT_W + TOTAL_FRETS * FRET_W + 16;
const SVG_H = TOP_PAD + (STR_COUNT - 1) * STR_H + 36;

function fretX(f: number) {
  if (f === 0) return LEFT_PAD + NUT_W / 2;
  return LEFT_PAD + NUT_W + f * FRET_W - FRET_W / 2;
}
function strY(s: number) { return TOP_PAD + s * STR_H; }

export default function Fretboard() {
  const { root, scaleKey, chordKey, mode, labelMode, activePosition, activeCaged } = useStore();

  const activeNotes = useMemo(() => {
    if (mode === 'chords') return getChordNotes(root, chordKey);
    return getScaleNotes(root, scaleKey);
  }, [root, scaleKey, chordKey, mode]);

  const positions = useMemo(() =>
    mode === 'scales' ? getScalePositions(root, scaleKey) : [],
    [root, scaleKey, mode],
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
    const alpha = inRange ? 1 : 0.18;

    if (noteIdx === root) return { ...MUSIC_COLORS.root, alpha };

    if (mode === 'chords') {
      const ch = CHORDS[chordKey];
      const intv = (noteIdx - root + 12) % 12;
      const ci = ch.intervals.map(i => i % 12);
      const pos = ci.indexOf(intv);
      if (pos === 1) return { ...MUSIC_COLORS.third, alpha };
      if (pos === 2) return { ...MUSIC_COLORS.fifth, alpha };
      if (pos >= 3) return { ...MUSIC_COLORS.extension, alpha };
    }

    if (mode === 'scales') {
      // Build cumulative semitone offsets from steps
      const sc = SCALES[scaleKey];
      const intv = (noteIdx - root + 12) % 12;
      if (sc) {
        let cum = 0;
        const semitones = [0];
        for (const s of sc.steps) { cum += s; semitones.push(cum % 12); }
        const pos = semitones.indexOf(intv);
        if (pos === 2) return { ...MUSIC_COLORS.third, alpha };    // 3rd degree
        if (pos === 4) return { ...MUSIC_COLORS.fifth, alpha };    // 5th degree
        if (pos >= 6) return { ...MUSIC_COLORS.extension, alpha }; // 7th degree
      }
    }

    if (mode === 'caged' && activeCaged) {
      const col = CAGED_COLORS[activeCaged];
      return { fill: col.fill, stroke: col.stroke, text: '#fff', alpha };
    }

    return { ...MUSIC_COLORS.scaleTone, alpha };
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>

        {/* Inlay dots */}
        {INLAY_FRETS.map(f => {
          const x = LEFT_PAD + NUT_W + f * FRET_W - FRET_W / 2;
          if (f === 12) return (
            <G key={f}>
              <Circle cx={x} cy={strY(1.5)} r={4} fill="#252528" />
              <Circle cx={x} cy={strY(3.5)} r={4} fill="#252528" />
            </G>
          );
          return <Circle key={f} cx={x} cy={strY(2.5)} r={4} fill="#252528" />;
        })}

        {/* Position highlight */}
        {mode === 'scales' && activePosition !== null && positions[activePosition] && (() => {
          const pos = positions[activePosition];
          const col = POSITION_COLORS[activePosition];
          const x1 = pos.start === 0 ? LEFT_PAD : LEFT_PAD + NUT_W + pos.start * FRET_W - FRET_W / 2;
          const x2 = LEFT_PAD + NUT_W + (pos.end + 1) * FRET_W - FRET_W / 2;
          return (
            <Rect x={x1} y={strY(0) - 12} width={x2 - x1} height={(STR_COUNT - 1) * STR_H + 24}
              rx={8} fill={col.light} stroke={col.fill} strokeWidth={1.5} strokeOpacity={0.5} />
          );
        })()}

        {/* CAGED highlight */}
        {mode === 'caged' && cagedRange && activeCaged && (() => {
          const col = CAGED_COLORS[activeCaged];
          const x1 = cagedRange.start === 0 ? LEFT_PAD : LEFT_PAD + NUT_W + cagedRange.start * FRET_W - FRET_W / 2;
          const x2 = LEFT_PAD + NUT_W + (cagedRange.end + 1) * FRET_W - FRET_W / 2;
          return (
            <G>
              <Rect x={x1} y={strY(0) - 12} width={x2 - x1} height={(STR_COUNT - 1) * STR_H + 24}
                rx={8} fill={col.light} stroke={col.fill} strokeWidth={1.5} strokeOpacity={0.5} />
              <Line
                x1={LEFT_PAD + NUT_W + cagedRange.caretFret * FRET_W - FRET_W / 2}
                y1={strY(0) - 14}
                x2={LEFT_PAD + NUT_W + cagedRange.caretFret * FRET_W - FRET_W / 2}
                y2={strY(5) + 14}
                stroke={col.fill} strokeWidth={2} strokeDasharray="5,4" strokeOpacity={0.7}
              />
            </G>
          );
        })()}

        {/* Strings */}
        {Array.from({ length: STR_COUNT }, (_, s) => (
          <G key={s}>
            <Line
              x1={LEFT_PAD} y1={strY(s)}
              x2={LEFT_PAD + NUT_W + TOTAL_FRETS * FRET_W} y2={strY(s)}
              stroke="#3A3A46" strokeWidth={0.6 + (s / STR_COUNT) * 2}
            />
            <SvgText
              x={LEFT_PAD - 6} y={strY(s) + 4}
              textAnchor="middle" fontSize={10} fill={COLORS.textMuted}
              fontWeight="500"
            >
              {STRING_NAMES[s]}
            </SvgText>
          </G>
        ))}

        {/* Nut */}
        <Rect
          x={LEFT_PAD} y={strY(0) - 10}
          width={NUT_W} height={(STR_COUNT - 1) * STR_H + 20}
          rx={3} fill="#888680"
        />

        {/* Frets */}
        {Array.from({ length: TOTAL_FRETS }, (_, i) => i + 1).map(f => (
          <Line key={f}
            x1={LEFT_PAD + NUT_W + f * FRET_W} y1={strY(0) - 8}
            x2={LEFT_PAD + NUT_W + f * FRET_W} y2={strY(5) + 8}
            stroke="#2E2E38" strokeWidth={1}
          />
        ))}

        {/* Fret numbers */}
        {[1,3,5,7,9,12,15].map(f => (
          <SvgText key={f}
            x={LEFT_PAD + NUT_W + f * FRET_W - FRET_W / 2}
            y={SVG_H - 4}
            textAnchor="middle" fontSize={9} fill={COLORS.textFaint}
          >
            {f}
          </SvgText>
        ))}

        {/* Note dots */}
        {Array.from({ length: STR_COUNT }, (_, s) =>
          Array.from({ length: TOTAL_FRETS + 1 }, (_, f) => {
            const ni = (OPEN_STRINGS[s] + f) % 12;
            const col = getNoteColor(ni, f);
            if (!col) return null;
            const x = fretX(f);
            const y = strY(s);
            const label = noteLabel(ni, root, labelMode, scaleKey, chordKey, mode);
            const fs = label.length > 2 ? 7 : 9;
            return (
              <G key={`${s}-${f}`}>
                <Circle
                  cx={x} cy={y} r={DOT_R}
                  fill={col.fill} stroke={col.stroke} strokeWidth={1.5}
                  opacity={col.alpha}
                />
                {label ? (
                  <SvgText
                    x={x} y={y + fs / 2 + 1}
                    textAnchor="middle" fontSize={fs} fontWeight="600"
                    fill={col.text} opacity={col.alpha}
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
