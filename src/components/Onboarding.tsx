import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  useWindowDimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { COLORS, SPACE, RADIUS } from '../constants/theme';

interface Props {
  onDone: () => void;
}

const GOLD = '#E8D44D';
const RED  = '#E24B4A';
const GREEN = '#1D9E75';
const BLUE  = '#378ADD';
const PURPLE = '#534AB7';

// ── Mini fretboard illustration ──────────────────────────────────────────────
function MiniFretboard({ dots }: { dots: { s: number; f: number; color: string; label: string }[] }) {
  const W = 280, H = 100;
  const L = 20, T = 14, FW = 38, SH = 14, NW = 4, FRETS = 6, STRS = 6;
  function fx(f: number) { return L + NW + f * FW - FW / 2; }
  function sy(s: number) { return T + s * SH; }
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* Fret lines */}
      {Array.from({ length: FRETS + 1 }).map((_, f) => (
        <Line key={f} x1={L + NW + f * FW} y1={T - 6} x2={L + NW + f * FW} y2={T + (STRS - 1) * SH + 6}
          stroke="#2E2E38" strokeWidth={f === 0 ? 3 : 1} />
      ))}
      {/* String lines */}
      {Array.from({ length: STRS }).map((_, s) => (
        <Line key={s} x1={L} y1={sy(s)} x2={L + NW + FRETS * FW} y2={sy(s)}
          stroke="#3A3A46" strokeWidth={1.5 - s * 0.15} />
      ))}
      {/* Note dots */}
      {dots.map((d, i) => (
        <React.Fragment key={i}>
          <Circle cx={fx(d.f)} cy={sy(d.s)} r={9} fill={d.color} />
          <SvgText x={fx(d.f)} y={sy(d.s) + 4} textAnchor="middle"
            fontSize={8} fontWeight="700" fill="#fff">{d.label}</SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

// ── Chord box illustration ────────────────────────────────────────────────────
function MiniChordBox() {
  const W = 120, H = 110;
  const L = 20, T = 20, FW = 16, SH = 16, FRETS = 4, STRS = 6;
  // G major chord shape
  const dots = [
    { s: 0, f: 2, color: GOLD },   // low E fret 3
    { s: 1, f: 2, color: GREEN },  // A fret 2
    { s: 2, f: 0, color: GREEN },  // D open
    { s: 3, f: 0, color: GREEN },  // G open
    { s: 4, f: 0, color: GREEN },  // B open
    { s: 5, f: 3, color: GOLD },   // high e fret 3
  ];
  function fx(f: number) { return L + f * FW; }
  function sy(s: number) { return T + s * SH; }
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {Array.from({ length: FRETS + 1 }).map((_, f) => (
        <Line key={f} x1={fx(f)} y1={T} x2={fx(f)} y2={T + (STRS - 1) * SH}
          stroke="#2E2E38" strokeWidth={f === 0 ? 3 : 1} />
      ))}
      {Array.from({ length: STRS }).map((_, s) => (
        <Line key={s} x1={fx(0)} y1={sy(s)} x2={fx(FRETS)} y2={sy(s)}
          stroke="#3A3A46" strokeWidth={1} />
      ))}
      {dots.map((d, i) => (
        d.f > 0 ? (
          <Circle key={i} cx={fx(d.f) - FW / 2} cy={sy(d.s)} r={6} fill={d.color} />
        ) : (
          <Circle key={i} cx={fx(0) - 10} cy={sy(d.s)} r={4} fill="none" stroke={d.color} strokeWidth={1.5} />
        )
      ))}
      <SvgText x={fx(0) - 18} y={T - 8} fontSize={7} fill="#7a7870">G</SvgText>
    </Svg>
  );
}

// ── CAGED illustration ────────────────────────────────────────────────────────
function MiniCaged() {
  const shapes = [
    { label: 'C', color: PURPLE, x: 0 },
    { label: 'A', color: '#D85A30', x: 40 },
    { label: 'G', color: GREEN, x: 80 },
    { label: 'E', color: BLUE, x: 120 },
    { label: 'D', color: '#BA7517', x: 160 },
  ];
  return (
    <Svg width={200} height={52} viewBox="0 0 200 52">
      {shapes.map((s, i) => (
        <React.Fragment key={i}>
          <Rect x={s.x} y={4} width={32} height={44} rx={6}
            fill={s.color} fillOpacity={0.15} stroke={s.color} strokeWidth={1.5} />
          <SvgText x={s.x + 16} y={32} textAnchor="middle"
            fontSize={18} fontWeight="700" fill={s.color}>{s.label}</SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

// ── Progress bar illustration ─────────────────────────────────────────────────
function MiniProgressions() {
  const chords = ['I', 'IV', 'V', 'I'];
  const colors = [GOLD, BLUE, GREEN, GOLD];
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      {chords.map((c, i) => (
        <View key={i} style={{
          width: 52, height: 52, borderRadius: 10,
          backgroundColor: i === 0 ? colors[i] + '22' : '#1A1A1F',
          borderWidth: i === 0 ? 2 : 1,
          borderColor: i === 0 ? colors[i] : '#2E2E38',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: colors[i], fontSize: 18, fontWeight: '700' }}>{c}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Slides ────────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    emoji: '🎸',
    title: 'Welcome to\nFretionary',
    subtitle: 'Your complete guitar theory companion — all on an interactive fretboard.',
    illustration: null,
    accent: GOLD,
  },
  {
    emoji: null,
    title: 'The Fretboard',
    subtitle: 'See any scale or chord mapped across the entire neck, in every key. Tap a note to hear it.',
    illustration: 'fretboard',
    accent: GREEN,
  },
  {
    emoji: null,
    title: 'Chord Library',
    subtitle: '25 chord types with real fingering shapes and audio. Tap any chord to play it.',
    illustration: 'chord',
    accent: GOLD,
  },
  {
    emoji: null,
    title: 'CAGED System',
    subtitle: 'See how the 5 shapes connect across the entire neck and unlock the fretboard.',
    illustration: 'caged',
    accent: PURPLE,
  },
  {
    emoji: null,
    title: 'Progressions',
    subtitle: 'Play through 22 essential chord progressions with real guitar audio at any BPM.',
    illustration: 'progressions',
    accent: BLUE,
  },
];

export default function Onboarding({ onDone }: Props) {
  const { width } = useWindowDimensions();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function goTo(index: number) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setCurrent(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: false });
  }

  function next() {
    if (current < SLIDES.length - 1) goTo(current + 1);
    else onDone();
  }

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Skip */}
      {!isLast && (
        <TouchableOpacity style={styles.skip} onPress={onDone}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Illustration */}
        <View style={styles.illustrationWrap}>
          {slide.emoji ? (
            <Text style={styles.emoji}>{slide.emoji}</Text>
          ) : slide.illustration === 'fretboard' ? (
            <View style={styles.illustrationBox}>
              <MiniFretboard dots={[
                { s: 1, f: 2, color: GOLD, label: 'A' },
                { s: 1, f: 4, color: RED, label: 'C' },
                { s: 2, f: 2, color: GOLD, label: 'A' },
                { s: 2, f: 3, color: GREEN, label: 'G' },
                { s: 3, f: 2, color: GREEN, label: 'D' },
                { s: 4, f: 2, color: GOLD, label: 'A' },
                { s: 5, f: 1, color: BLUE, label: 'E' },
              ]} />
            </View>
          ) : slide.illustration === 'chord' ? (
            <View style={styles.illustrationBox}>
              <MiniChordBox />
              <View style={{ marginLeft: 24 }}>
                <Text style={[styles.chordName, { color: slide.accent }]}>G Major</Text>
                <Text style={styles.chordIntervals}>R · 3 · 5</Text>
                <Text style={styles.chordDesc}>Bright and stable.</Text>
              </View>
            </View>
          ) : slide.illustration === 'caged' ? (
            <View style={styles.illustrationBox}>
              <MiniCaged />
            </View>
          ) : slide.illustration === 'progressions' ? (
            <View style={styles.illustrationBox}>
              <MiniProgressions />
            </View>
          ) : null}
        </View>

        {/* Text */}
        <View style={styles.textWrap}>
          <View style={[styles.accentLine, { backgroundColor: slide.accent }]} />
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
        </View>
      </Animated.View>

      {/* Bottom: dots + button */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={[
                styles.dot,
                i === current && { backgroundColor: slide.accent, width: 20 },
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: slide.accent }]}
          onPress={next}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: current === 0 ? '#1a1400' : '#fff' }]}>
            {isLast ? 'Start Playing' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.bg },
  skip:             { position: 'absolute', top: 56, right: 24, zIndex: 10, padding: 8 },
  skipText:         { color: COLORS.textMuted, fontSize: 14 },

  content:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  illustrationWrap: { height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.xl },
  illustrationBox:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACE.lg, borderWidth: 1, borderColor: COLORS.border },
  emoji:            { fontSize: 80 },

  chordName:        { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  chordIntervals:   { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
  chordDesc:        { fontSize: 13, color: COLORS.textMuted },

  textWrap:         { alignItems: 'flex-start', width: '100%' },
  accentLine:       { width: 36, height: 3, borderRadius: 2, marginBottom: SPACE.md },
  title:            { fontSize: 32, fontWeight: '700', color: COLORS.text, lineHeight: 40, marginBottom: SPACE.md },
  subtitle:         { fontSize: 16, color: COLORS.textMuted, lineHeight: 24 },

  bottom:           { paddingHorizontal: 32, paddingBottom: 32, gap: SPACE.xl },
  dots:             { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot:              { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },

  btn:              { borderRadius: RADIUS.full, paddingVertical: 16, alignItems: 'center' },
  btnText:          { fontSize: 16, fontWeight: '700' },
});
