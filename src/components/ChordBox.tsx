import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText, G } from 'react-native-svg';
import { COLORS } from '../constants/theme';
import { NOTES, CHORDS, OPEN_STRINGS, COLORS as MUSIC_C } from "../constants/music";
import { getChordNotes } from '../utils/theory';


interface Props {
  root: number;
  chordKey: string;
  voicingIndex?: number;
}

const BOX_W = 160;
const BOX_H = 180;
const PAD_LEFT = 28;
const PAD_TOP = 32;
const FRET_H = 26;
const STR_SPACING = 22;
const DOT_R = 9;
const FRETS_SHOWN = 5;
const STRINGS = 6;

export default function ChordBox({ root, chordKey, voicingIndex = 0 }: Props) {
  const chordNotes = getChordNotes(root, chordKey);
  const ch = CHORDS[chordKey];

  // Build a simple voicing by finding lowest playable fret per string
  const voicing = buildVoicing(root, chordKey);
  if (!voicing) return null;

  const { frets, baseFret } = voicing;
  const nonNullFrets = frets.filter(f => f !== null && f > 0) as number[];
  const minF = nonNullFrets.length ? Math.min(...nonNullFrets) : 1;
  const maxF = nonNullFrets.length ? Math.max(...nonNullFrets) : 5;
  const base = baseFret;

  const svgW = PAD_LEFT + (STRINGS - 1) * STR_SPACING + 24;
  const svgH = PAD_TOP + FRETS_SHOWN * FRET_H + 20;

  function sx(strIdx: number) { return PAD_LEFT + strIdx * STR_SPACING; }
  function fy(fretIdx: number) { return PAD_TOP + fretIdx * FRET_H; } // fretIdx 0 = nut line

  return (
    <View style={styles.wrap}>
      <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        {/* Base fret label */}
        {base > 1 && (
          <SvgText x={PAD_LEFT - 16} y={fy(1) + 4} fontSize={9} fill={COLORS.textMuted} textAnchor="middle">
            {base}fr
          </SvgText>
        )}

        {/* Nut or top line */}
        <Line
          x1={sx(0)} y1={fy(0)}
          x2={sx(STRINGS - 1)} y2={fy(0)}
          stroke={base <= 1 ? '#888680' : '#3A3A46'}
          strokeWidth={base <= 1 ? 5 : 1.5}
        />

        {/* Fret lines */}
        {Array.from({ length: FRETS_SHOWN }, (_, i) => (
          <Line key={i}
            x1={sx(0)} y1={fy(i + 1)}
            x2={sx(STRINGS - 1)} y2={fy(i + 1)}
            stroke="#2E2E38" strokeWidth={1}
          />
        ))}

        {/* Strings */}
        {Array.from({ length: STRINGS }, (_, s) => (
          <Line key={s}
            x1={sx(s)} y1={fy(0)}
            x2={sx(s)} y2={fy(FRETS_SHOWN)}
            stroke="#3A3A46" strokeWidth={1 + (5 - s) * 0.2}
          />
        ))}

        {/* Dots */}
        {frets.map((f, s) => {
          if (f === null) {
            return (
              <SvgText key={s} x={sx(s)} y={fy(0) - 8}
                textAnchor="middle" fontSize={10} fill={COLORS.textMuted}>✕</SvgText>
            );
          }
          if (f === 0) {
            return (
              <Circle key={s} cx={sx(s)} cy={fy(0) - 8} r={5}
                fill="none" stroke={COLORS.textMuted} strokeWidth={1.5} />
            );
          }
          const fretRow = f - base + 1;
          if (fretRow < 1 || fretRow > FRETS_SHOWN) return null;
          const cy = fy(fretRow) - FRET_H / 2;
          const ni = (OPEN_STRINGS[s] + f) % 12;
          const isRoot = ni === root;
          const intv = (ni - root + 12) % 12;
          const chIv = ch.intervals.map(i => i % 12);
          const ivPos = chIv.indexOf(intv);

          let fill = MUSIC_C.scaleTone.fill;
          let stroke = MUSIC_C.scaleTone.stroke;
          let textColor = MUSIC_C.scaleTone.text;
          if (isRoot) { fill = MUSIC_C.root.fill; stroke = MUSIC_C.root.stroke; textColor = MUSIC_C.root.text; }
          else if (ivPos === 1) { fill = MUSIC_C.third.fill; stroke = MUSIC_C.third.stroke; textColor = '#fff'; }
          else if (ivPos === 2) { fill = MUSIC_C.fifth.fill; stroke = MUSIC_C.fifth.stroke; textColor = '#fff'; }
          else if (ivPos >= 3) { fill = MUSIC_C.extension.fill; stroke = MUSIC_C.extension.stroke; textColor = '#fff'; }

          return (
            <G key={s}>
              <Circle cx={sx(s)} cy={cy} r={DOT_R}
                fill={fill} stroke={stroke} strokeWidth={1.5} />
              <SvgText x={sx(s)} y={cy + 4}
                textAnchor="middle" fontSize={8} fontWeight="600" fill={textColor}>
                {NOTES[ni]}
              </SvgText>
            </G>
          );
        })}

        {/* String name labels */}
        {['e','B','G','D','A','E'].map((name, s) => (
          <SvgText key={s} x={sx(s)} y={svgH - 4}
            textAnchor="middle" fontSize={9} fill={COLORS.textFaint}>{name}</SvgText>
        ))}
      </Svg>
    </View>
  );
}

function buildVoicing(root: number, chordKey: string) {
  const ch = CHORDS[chordKey];
  if (!ch) return null;
  const chordNotes = getChordNotes(root, chordKey);
  const chordSet = new Set(chordNotes);

  for (let base = 0; base <= 9; base++) {
    const frets: (number | null)[] = [];
    let rootFound = false;
    const covered = new Set<number>();

    for (let s = 5; s >= 0; s--) {
      let best: number | null = null;
      const searchEnd = base === 0 ? 4 : base + 4;
      for (let f = base === 0 ? 0 : base; f <= searchEnd; f++) {
        const n = (OPEN_STRINGS[s] + f) % 12;
        if (chordSet.has(n)) {
          if (best === null) best = f;
          if (n === root && !rootFound) { best = f; rootFound = true; break; }
        }
      }
      frets.push(best);
      if (best !== null) covered.add((OPEN_STRINGS[s] + best) % 12);
    }

    const coveredAll = [...chordSet].every(n => covered.has(n));
    const used = frets.filter(f => f !== null).length;
    if (coveredAll && used >= Math.min(4, chordNotes.length) && rootFound) {
      const nonNull = frets.filter(f => f !== null && f > 0) as number[];
      const minF = nonNull.length ? Math.min(...nonNull) : 0;
      const maxF = nonNull.length ? Math.max(...nonNull) : 0;
      if (maxF - minF <= 4) {
        return { frets, baseFret: base === 0 ? 1 : base, barre: undefined };
      }
    }
  }
  return null;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
});
