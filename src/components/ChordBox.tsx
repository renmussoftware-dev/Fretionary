import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Rect } from 'react-native-svg';
import { COLORS, RADIUS, SPACE } from '../constants/theme';
import { NOTES, CHORDS, OPEN_STRINGS } from '../constants/music';
import { getChordVoicings, type ChordVoicing } from '../utils/theory';

interface Props {
  root: number;
  chordKey: string;
  compact?: boolean; // smaller size for use in progression mini boxes
}

// Full-size box dimensions
const PAD_L = 32;
const PAD_T = 36;
const FRET_H = 28;
const STR_GAP = 24;
const DOT_R = 10;
const FRETS_SHOWN = 5;
const STRINGS = 6;

// Compact dimensions (progressions mini boxes)
const C_PAD_L = 18;
const C_PAD_T = 22;
const C_FRET_H = 18;
const C_STR_GAP = 15;
const C_DOT_R = 6;

export default function ChordBox({ root, chordKey, compact = false }: Props) {
  const [voicingIdx, setVoicingIdx] = useState(0);
  const voicings = getChordVoicings(root, chordKey);

  if (voicings.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No voicing found</Text>
      </View>
    );
  }

  // Reset to 0 if root/chord changes and idx is out of range
  const safeIdx = Math.min(voicingIdx, voicings.length - 1);
  const voicing = voicings[safeIdx];

  const pl = compact ? C_PAD_L : PAD_L;
  const pt = compact ? C_PAD_T : PAD_T;
  const fh = compact ? C_FRET_H : FRET_H;
  const sg = compact ? C_STR_GAP : STR_GAP;
  const dr = compact ? C_DOT_R : DOT_R;

  const svgW = pl + (STRINGS - 1) * sg + (compact ? 16 : 20);
  const svgH = pt + FRETS_SHOWN * fh + (compact ? 12 : 16);

  function sx(s: number) { return pl + s * sg; }
  function fy(f: number) { return pt + f * fh; }

  const ch = CHORDS[chordKey];

  return (
    <View style={compact ? styles.compactWrap : styles.wrap}>
      <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        {/* Root fret indicator — centered in the fret cell where the root sits */}
        {voicing.baseFret > 1 && (() => {
          // rootFret row: fretRow = rootFret - baseFret + 1
          const rootRow = voicing.rootFret - voicing.baseFret + 1;
          const markerY = fy(rootRow) - fh / 2; // center of that fret cell
          return (
            <SvgText
              x={pl - (compact ? 10 : 14)}
              y={markerY + (compact ? 2.5 : 3.5)}
              fontSize={compact ? 7 : 9}
              fill={COLORS.textMuted}
              textAnchor="middle"
            >
              {voicing.rootFret}fr
            </SvgText>
          );
        })()}

        {/* Nut or top border */}
        <Line
          x1={sx(0)} y1={fy(0)}
          x2={sx(STRINGS - 1)} y2={fy(0)}
          stroke={voicing.baseFret <= 1 ? '#888680' : '#3A3A46'}
          strokeWidth={voicing.baseFret <= 1 ? (compact ? 4 : 5) : 1.5}
        />

        {/* Fret lines */}
        {Array.from({ length: FRETS_SHOWN }, (_, i) => (
          <Line key={i}
            x1={sx(0)} y1={fy(i + 1)}
            x2={sx(STRINGS - 1)} y2={fy(i + 1)}
            stroke="#2E2E38" strokeWidth={1}
          />
        ))}

        {/* String lines */}
        {Array.from({ length: STRINGS }, (_, s) => (
          <Line key={s}
            x1={sx(s)} y1={fy(0)}
            x2={sx(s)} y2={fy(FRETS_SHOWN)}
            stroke="#3A3A46"
            strokeWidth={compact ? 0.7 + (5 - s) * 0.12 : 1 + (5 - s) * 0.2}
          />
        ))}

        {/* Dots + open/muted markers — s=0=low E (frets[0]), s=5=high e (frets[5]) */}
        {voicing.frets.map((f, s) => {
          if (f === null) {
            return (
              <SvgText key={s}
                x={sx(s)} y={fy(0) - (compact ? 5 : 7)}
                textAnchor="middle"
                fontSize={compact ? 8 : 10}
                fill={COLORS.textMuted}
              >
                x
              </SvgText>
            );
          }
          if (f === 0) {
            return (
              <Circle key={s}
                cx={sx(s)} cy={fy(0) - (compact ? 6 : 8)}
                r={compact ? 4 : 5}
                fill="none"
                stroke={COLORS.textMuted}
                strokeWidth={1.5}
              />
            );
          }

          const fretRow = f - voicing.baseFret + 1;
          if (fretRow < 1 || fretRow > FRETS_SHOWN) return null;

          const cy = fy(fretRow) - fh / 2;
          const ni = (OPEN_STRINGS[5 - s] + f) % 12;
          const isRoot = ni === root;
          const intv = (ni - root + 12) % 12;
          const chIv = ch?.intervals.map((i: number) => i % 12) ?? [];
          const ivPos = chIv.indexOf(intv);

          let fill = '#3A3A46';
          let stroke = '#52525F';
          let textColor = '#C0BEB8';

          if (isRoot) {
            fill = '#E8D44D'; stroke = '#C4A800'; textColor = '#5C4400';
          } else if (ivPos === 1) {
            fill = '#E24B4A'; stroke = '#A32D2D'; textColor = '#fff';
          } else if (ivPos === 2) {
            fill = '#1D9E75'; stroke = '#0F6E56'; textColor = '#fff';
          } else if (ivPos >= 3) {
            fill = '#378ADD'; stroke = '#185FA5'; textColor = '#fff';
          }

          return (
            <G key={s}>
              <Circle cx={sx(s)} cy={cy} r={dr} fill={fill} stroke={stroke} strokeWidth={1.5} />
              {!compact && (
                <SvgText x={sx(s)} y={cy + 4} textAnchor="middle" fontSize={8} fontWeight="600" fill={textColor}>
                  {NOTES[ni]}
                </SvgText>
              )}
              {compact && (
                <SvgText x={sx(s)} y={cy + 2.5} textAnchor="middle" fontSize={5.5} fontWeight="600" fill={textColor}>
                  {NOTES[ni]}
                </SvgText>
              )}
            </G>
          );
        })}

        {/* String name labels at bottom */}
        {!compact && ['E', 'A', 'D', 'G', 'B', 'e'].map((name, s) => (
          <SvgText key={s}
            x={sx(s)} y={svgH - 3}
            textAnchor="middle" fontSize={9} fill={COLORS.textFaint}
          >
            {name}
          </SvgText>
        ))}
      </Svg>

      {/* Voicing navigator */}
      {voicings.length > 1 && (
        <View style={compact ? styles.compactNav : styles.nav}>
          <TouchableOpacity
            onPress={() => setVoicingIdx(i => (i - 1 + voicings.length) % voicings.length)}
            style={[styles.navBtn, compact && styles.navBtnCompact]}
            activeOpacity={0.7}
          >
            <Text style={[styles.navArrow, compact && styles.navArrowCompact]}>{'‹'}</Text>
          </TouchableOpacity>

          {compact ? (
            // Compact: just dots
            <View style={styles.compactDots}>
              {voicings.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setVoicingIdx(i)} activeOpacity={0.7}>
                  <View style={[styles.dot, i === safeIdx && styles.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            // Full: label + position badge + dots
            <View style={styles.navCenter}>
              <Text style={styles.voicingLabel} numberOfLines={1}>{voicing.label}</Text>
              <View style={styles.dotRow}>
                {voicings.map((v, i) => (
                  <TouchableOpacity key={i} onPress={() => setVoicingIdx(i)} activeOpacity={0.7}>
                    <View style={[styles.dot, i === safeIdx && styles.dotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={() => setVoicingIdx(i => (i + 1) % voicings.length)}
            style={[styles.navBtn, compact && styles.navBtnCompact]}
            activeOpacity={0.7}
          >
            <Text style={[styles.navArrow, compact && styles.navArrowCompact]}>{'›'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Neck position pills — full size only */}
      {!compact && voicings.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}>
          {voicings.map((v, i) => (
            <TouchableOpacity key={i} onPress={() => setVoicingIdx(i)} activeOpacity={0.7}
              style={[styles.pill, i === safeIdx && styles.pillActive]}>
              <Text style={[styles.pillText, i === safeIdx && styles.pillTextActive]}>
                {v.position}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:           { alignItems: 'center' },
  compactWrap:    { alignItems: 'center' },
  empty:          { padding: SPACE.lg, alignItems: 'center' },
  emptyText:      { fontSize: 11, color: COLORS.textFaint },

  nav:            { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, width: '100%', justifyContent: 'center' },
  compactNav:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  navBtn:         { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceHigh },
  navBtnCompact:  { width: 18, height: 18, borderRadius: 9 },
  navArrow:       { fontSize: 18, color: COLORS.text, lineHeight: 22 },
  navArrowCompact:{ fontSize: 13, color: COLORS.textMuted, lineHeight: 17 },

  navCenter:      { flex: 1, alignItems: 'center', gap: 4 },
  voicingLabel:   { fontSize: 11, fontWeight: '500', color: COLORS.textMuted },

  dotRow:         { flexDirection: 'row', gap: 5 },
  compactDots:    { flexDirection: 'row', gap: 3 },
  dot:            { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border },
  dotActive:      { backgroundColor: COLORS.accent, borderColor: COLORS.accent },

  pillRow:        { flexDirection: 'row', gap: 5, paddingHorizontal: 4, marginTop: 6 },
  pill:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceHigh },
  pillActive:     { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  pillText:       { fontSize: 11, fontWeight: '500', color: COLORS.textMuted },
  pillTextActive: { color: '#fff' },
});
