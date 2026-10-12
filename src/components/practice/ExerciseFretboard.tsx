import React, { useEffect, useMemo, useRef } from 'react';
import { ScrollView, View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Line, Rect, Circle, Text as SvgText, G } from 'react-native-svg';
import { COLORS, FONT_FAMILY, SPACE } from '../../constants/theme';
import { STRING_NAMES } from '../../constants/music';
import type { ExercisePattern, StepBucket } from './exercisePatterns';

const STR_COUNT = 6;
const STR_H = 30;
const LEFT_PAD = 20;
const RIGHT_PAD = 10;
const TOP_PAD = 18;
const NUT_W = 5;
const OPEN_W = 24;        // column left of the nut for open-string notes
const MIN_FRET_W = 22;
const MAX_FRET_W = 54;
const MIN_FRETS = 5;      // never draw a window narrower than one hand span
const INLAYS = [3, 5, 7, 9, 12, 15];

const BUCKET_COLORS: Record<StepBucket, { fill: string; stroke: string; text: string }> = {
  root:  COLORS.root,
  third: COLORS.third,
  fifth: COLORS.fifth,
  ext:   COLORS.ext,
  tone:  { fill: '#3F3F47', stroke: '#666670', text: '#E5E3DC' },
};

interface Props {
  pattern: ExercisePattern;
  // Index into pattern.steps of the note sounding now; null when stopped.
  // While playing, the current group stays lit and the rest of the pattern dims.
  stepIdx: number | null;
}

/**
 * Read-only neck for the exercise player. Unlike PracticeFretboard it draws
 * only the stretch of neck the pattern uses and scales the frets to fit the
 * screen, so a shape at the 9th fret isn't a scroll away from the nut.
 */
export default function ExerciseFretboard({ pattern, stepIdx }: Props) {
  const { width: screenW } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const availW = screenW - SPACE.lg * 2;

  const layout = useMemo(() => {
    const frets = pattern.steps.map(s => s.fret);
    const lo = Math.min(...frets);
    const hi = Math.max(...frets);
    // Near the nut, draw from the nut. Further up, start one fret below the
    // pattern for context and drop the nut.
    const hasNut = lo <= 2;
    const first = hasNut ? 1 : lo - 1;
    const last = Math.max(hi, first + MIN_FRETS - 1);
    const count = last - first + 1;
    const openW = hasNut ? OPEN_W + NUT_W : 0;
    const fretW = Math.max(
      MIN_FRET_W,
      Math.min(MAX_FRET_W, (availW - LEFT_PAD - RIGHT_PAD - openW) / count),
    );
    return { first, last, count, hasNut, openW, fretW, width: LEFT_PAD + openW + count * fretW + RIGHT_PAD };
  }, [pattern, availW]);

  const { first, last, count, hasNut, openW, fretW, width } = layout;
  const height = TOP_PAD + (STR_COUNT - 1) * STR_H + 30;
  const boardX = LEFT_PAD + openW;
  const dotR = Math.min(12, fretW / 2 - 1.5);
  const fontSize = dotR >= 11 ? 10 : 9;

  const fretX = (f: number) =>
    f === 0 ? LEFT_PAD + OPEN_W / 2 : boardX + (f - first + 0.5) * fretW;
  const strY = (s: number) => TOP_PAD + s * STR_H;

  // One dot per position — sequences revisit the same notes many times.
  const dots = useMemo(() => {
    const byPos = new Map<string, { stringIdx: number; fret: number; label: string; bucket: StepBucket; groups: Set<number> }>();
    for (const s of pattern.steps) {
      const key = `${s.stringIdx}:${s.fret}`;
      const dot = byPos.get(key);
      if (dot) dot.groups.add(s.group);
      else byPos.set(key, { ...s, groups: new Set([s.group]) });
    }
    return Array.from(byPos.values());
  }, [pattern]);

  const active = stepIdx === null ? null : pattern.steps[stepIdx] ?? null;
  const activeGroup = active?.group ?? null;

  // When the neck is wider than the screen, keep the shape being played in view.
  useEffect(() => {
    if (activeGroup === null || width <= availW) return;
    const xs = pattern.steps.filter(s => s.group === activeGroup).map(s => fretX(s.fret));
    const center = (Math.min(...xs) + Math.max(...xs)) / 2;
    scrollRef.current?.scrollTo({ x: Math.max(0, center - availW / 2), animated: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fretX derives from layout
  }, [activeGroup, pattern, width, availW]);

  if (pattern.steps.length === 0) return null;

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEnabled={width > availW}
      style={styles.scroll}
    >
      <View style={{ width, height }}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Inlay dots */}
          {INLAYS.filter(f => f >= first && f <= last).map(f => {
            const x = fretX(f);
            return f === 12 ? (
              <G key={f}>
                <Circle cx={x} cy={strY(1.5)} r={3} fill="#252528" />
                <Circle cx={x} cy={strY(3.5)} r={3} fill="#252528" />
              </G>
            ) : (
              <Circle key={f} cx={x} cy={strY(2.5)} r={3} fill="#252528" />
            );
          })}

          {/* Strings */}
          {Array.from({ length: STR_COUNT }, (_, s) => (
            <G key={s}>
              <SvgText
                x={LEFT_PAD - 8} y={strY(s) + 3.5}
                textAnchor="middle" fontSize={10}
                fill={COLORS.textFaint} fontFamily={FONT_FAMILY.mono}
              >
                {STRING_NAMES[s]}
              </SvgText>
              <Line
                x1={LEFT_PAD} y1={strY(s)}
                x2={boardX + count * fretW} y2={strY(s)}
                stroke="#3A3A46"
                strokeWidth={0.6 + (s / STR_COUNT) * 2}
              />
            </G>
          ))}

          {/* Nut */}
          {hasNut && (
            <Rect
              x={boardX - NUT_W} y={strY(0) - 10}
              width={NUT_W} height={(STR_COUNT - 1) * STR_H + 20}
              rx={2.5} fill="#888680"
            />
          )}

          {/* Frets — away from the nut, the window's left edge gets a line too */}
          {Array.from({ length: count + (hasNut ? 0 : 1) }, (_, i) => i + (hasNut ? 1 : 0)).map(i => (
            <Line
              key={i}
              x1={boardX + i * fretW} y1={strY(0) - 8}
              x2={boardX + i * fretW} y2={strY(5) + 8}
              stroke="#2E2E38" strokeWidth={1}
            />
          ))}

          {/* Fret numbers — inlay frets, plus the first fret of a shifted window */}
          {Array.from({ length: count }, (_, i) => first + i)
            .filter(f => INLAYS.includes(f) || f === 1 || (!hasNut && f === first))
            .map(f => (
              <SvgText
                key={f}
                x={fretX(f)} y={height - 5}
                textAnchor="middle" fontSize={10}
                fill={COLORS.textFaint} fontFamily={FONT_FAMILY.mono}
              >
                {f}
              </SvgText>
            ))}

          {/* Pattern dots */}
          {dots.map(d => {
            const c = BUCKET_COLORS[d.bucket];
            const lit = activeGroup === null || d.groups.has(activeGroup);
            const sounding = active !== null
              && active.stringIdx === d.stringIdx && active.fret === d.fret;
            const x = fretX(d.fret);
            const y = strY(d.stringIdx);
            return (
              <G key={`${d.stringIdx}:${d.fret}`} opacity={lit ? 1 : 0.28}>
                {sounding && (
                  <Circle cx={x} cy={y} r={dotR + 3} fill="none" stroke={COLORS.text} strokeWidth={2} />
                )}
                <Circle cx={x} cy={y} r={dotR} fill={c.fill} stroke={c.stroke} strokeWidth={1.5} />
                <SvgText
                  x={x} y={y + fontSize * 0.36}
                  textAnchor="middle" fontSize={fontSize} fontWeight="700"
                  fill={c.text}
                >
                  {d.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
});
