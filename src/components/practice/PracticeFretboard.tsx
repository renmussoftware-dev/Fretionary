import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Line, Rect, Circle, Text as SvgText, G } from 'react-native-svg';
import { COLORS } from '../../constants/theme';
import { OPEN_STRINGS, NOTES } from '../../constants/music';

const STR_COUNT = 6;

export interface Highlight {
  stringIdx: number;            // 0 = high e, 5 = low E (matches OPEN_STRINGS)
  fret: number;
  kind: 'target' | 'correct' | 'wrong' | 'pending';
  label?: string;
}

interface Props {
  maxFret: number;              // inclusive (5, 12, 15)
  noteClasses?: number[];       // high→low; defaults to standard OPEN_STRINGS
  highlights?: Highlight[];
  onPress?: (stringIdx: number, fret: number) => void;
  showAllNotes?: boolean;       // render note name behind every position
  disabled?: boolean;
}

const KIND_COLORS = {
  target:  { fill: '#6E60D9', stroke: '#4F3FBA', text: '#fff' },
  correct: { fill: '#1D9E75', stroke: '#0F6E56', text: '#fff' },
  wrong:   { fill: '#E24B4A', stroke: '#A32D2D', text: '#fff' },
  pending: { fill: '#3A3A46', stroke: '#52525F', text: '#fff' },
};

export default function PracticeFretboard({
  maxFret,
  noteClasses = [...OPEN_STRINGS],
  highlights = [],
  onPress,
  showAllNotes = false,
  disabled = false,
}: Props) {
  const FRET_W = 50;
  const STR_H = 32;
  const LEFT_PAD = 28;
  const TOP_PAD = 22;
  const NUT_W = 6;
  const DOT_R = 13;
  const TAP_R = 18; // larger than the dot so tapping near the position works
  const SVG_W = LEFT_PAD + NUT_W + maxFret * FRET_W + 16;
  const SVG_H = TOP_PAD + (STR_COUNT - 1) * STR_H + 30;
  const INLAY_FRETS = [3, 5, 7, 9, 12, 15].filter(f => f <= maxFret);

  function fretX(f: number) {
    if (f === 0) return LEFT_PAD + NUT_W / 2;
    return LEFT_PAD + NUT_W + f * FRET_W - FRET_W / 2;
  }
  function strY(s: number) { return TOP_PAD + s * STR_H; }
  const highlightAt = (s: number, f: number) =>
    highlights.find(h => h.stringIdx === s && h.fret === f);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: 4 }}
    >
      <View style={{ width: SVG_W, height: SVG_H }}>
        <Svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
          {/* Inlay dots */}
          {INLAY_FRETS.map(f => {
            const x = fretX(f);
            return f === 12 ? (
              <G key={f}>
                <Circle cx={x} cy={strY(1.5)} r={3.5} fill="#252528" />
                <Circle cx={x} cy={strY(3.5)} r={3.5} fill="#252528" />
              </G>
            ) : (
              <Circle key={f} cx={x} cy={strY(2.5)} r={3.5} fill="#252528" />
            );
          })}

          {/* Strings */}
          {Array.from({ length: STR_COUNT }, (_, s) => (
            <Line
              key={s}
              x1={LEFT_PAD} y1={strY(s)}
              x2={LEFT_PAD + NUT_W + maxFret * FRET_W} y2={strY(s)}
              stroke="#3A3A46"
              strokeWidth={0.6 + (s / STR_COUNT) * 2}
            />
          ))}

          {/* Nut */}
          <Rect
            x={LEFT_PAD} y={strY(0) - 10}
            width={NUT_W} height={(STR_COUNT - 1) * STR_H + 20}
            rx={3} fill="#888680"
          />

          {/* Frets */}
          {Array.from({ length: maxFret }, (_, i) => i + 1).map(f => (
            <Line
              key={f}
              x1={LEFT_PAD + NUT_W + f * FRET_W} y1={strY(0) - 8}
              x2={LEFT_PAD + NUT_W + f * FRET_W} y2={strY(5) + 8}
              stroke="#2E2E38" strokeWidth={1}
            />
          ))}

          {/* Fret numbers */}
          {[1, 3, 5, 7, 9, 12, 15].filter(f => f <= maxFret).map(f => (
            <SvgText
              key={f}
              x={fretX(f)}
              y={SVG_H - 4}
              textAnchor="middle"
              fontSize={9}
              fill={COLORS.textFaint}
            >
              {f}
            </SvgText>
          ))}

          {/* Background note labels (showAllNotes mode) */}
          {showAllNotes &&
            Array.from({ length: STR_COUNT }, (_, s) =>
              Array.from({ length: maxFret + 1 }, (_, f) => {
                if (highlightAt(s, f)) return null;
                const ni = (noteClasses[s] + f) % 12;
                return (
                  <SvgText
                    key={`bg-${s}-${f}`}
                    x={fretX(f)}
                    y={strY(s) + 3}
                    textAnchor="middle"
                    fontSize={9}
                    fill={COLORS.textFaint}
                  >
                    {NOTES[ni]}
                  </SvgText>
                );
              })
            )}

          {/* Highlight dots */}
          {highlights.map((h, i) => {
            const c = KIND_COLORS[h.kind];
            return (
              <G key={`hl-${h.stringIdx}-${h.fret}-${i}`}>
                <Circle
                  cx={fretX(h.fret)}
                  cy={strY(h.stringIdx)}
                  r={DOT_R}
                  fill={c.fill}
                  stroke={c.stroke}
                  strokeWidth={1.5}
                />
                {h.label && (
                  <SvgText
                    x={fretX(h.fret)}
                    y={strY(h.stringIdx) + 4}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight="700"
                    fill={c.text}
                  >
                    {h.label}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>

        {/* Tap overlays sized larger than dots so adjacent positions don't collide */}
        {!disabled && onPress &&
          Array.from({ length: STR_COUNT }, (_, s) =>
            Array.from({ length: maxFret + 1 }, (_, f) => (
              <TouchableOpacity
                key={`tap-${s}-${f}`}
                onPress={() => onPress(s, f)}
                activeOpacity={0.4}
                style={[
                  styles.tap,
                  {
                    left: fretX(f) - TAP_R,
                    top: strY(s) - TAP_R,
                    width: TAP_R * 2,
                    height: TAP_R * 2,
                  },
                ]}
              />
            ))
          )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  tap: { position: 'absolute', borderRadius: 999 },
});
