import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { COLORS, FONT_FAMILY, RADIUS, SPACE } from '../constants/theme';
import { useMetronomeClock, BPM_MIN, BPM_MAX } from '../hooks/useMetronomeClock';

interface TimeSig { name: string; beats: number; }

const TIME_SIGS: TimeSig[] = [
  { name: '2/4', beats: 2 },
  { name: '3/4', beats: 3 },
  { name: '4/4', beats: 4 },
  { name: '5/4', beats: 5 },
  { name: '6/8', beats: 6 },
  { name: '7/8', beats: 7 },
];

const TAP_WINDOW_MS = 2500;  // taps older than this expire

export default function Metronome() {
  const tapTimesRef = useRef<number[]>([]);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const beatAnim = useRef(new Animated.Value(-1)).current;

  const [bpm, setBpm] = useState(100);
  const [sigIdx, setSigIdx] = useState(2); // default 4/4
  const [running, setRunning] = useState(false);
  const sig = TIME_SIGS[sigIdx];

  // Light the current dot (native-driven Animated.Value, no re-render) and
  // fire the scale pulse. Called at each beat's real sounding time.
  function showBeat(beat: number) {
    beatAnim.setValue(beat);
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }

  // The click engine and its scheduler live in the shared clock, which the
  // Practice exercise player also runs on.
  useMetronomeClock({ bpm, beats: sig.beats, running, onBeat: showBeat });

  useEffect(() => {
    if (!running) beatAnim.setValue(-1);
  }, [running, beatAnim]);

  function bumpBpm(delta: number) {
    setBpm(b => Math.max(BPM_MIN, Math.min(BPM_MAX, b + delta)));
  }

  function tapTempo() {
    const now = Date.now();
    const taps = tapTimesRef.current.filter(t => now - t < TAP_WINDOW_MS);
    taps.push(now);
    tapTimesRef.current = taps;
    if (taps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
      const avg = intervals.reduce((s, v) => s + v, 0) / intervals.length;
      const tappedBpm = Math.round(60_000 / avg);
      setBpm(Math.max(BPM_MIN, Math.min(BPM_MAX, tappedBpm)));
    }
  }

  return (
    <View style={styles.wrap}>
      {/* Hero BPM card — TEMPO label + giant mono number + beat dots */}
      <View style={styles.bpmCard}>
        <Text style={styles.bpmEyebrow}>Tempo</Text>
        <Text style={styles.bpmValue}>{bpm}</Text>
        <Text style={styles.bpmLabel}>BPM</Text>

        <View style={styles.beatRow}>
          {Array.from({ length: sig.beats }, (_, i) => {
            const isAccent = i === 0;
            // Lit overlay opacity is driven by how close beatAnim is to this
            // dot's index — 1 on the current beat, 0 otherwise. setValue jumps
            // between integers, so exactly one dot lights at a time. Native
            // driver keeps it off the JS thread entirely.
            const litOpacity = beatAnim.interpolate({
              inputRange: [i - 0.5, i, i + 0.5],
              outputRange: [0, 1, 0],
              extrapolate: 'clamp',
            });
            return (
              <View key={i} style={[styles.beatDot, isAccent && styles.beatDotAccent]}>
                <Animated.View
                  style={[
                    styles.beatDotFill,
                    isAccent ? styles.beatDotAccentLit : styles.beatDotLit,
                    { opacity: litOpacity },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* BPM step controls — fine-grained adjust + tap tempo */}
      <View style={styles.bpmRow}>
        <TouchableOpacity onPress={() => bumpBpm(-5)} activeOpacity={0.7} style={styles.bpmStep}>
          <Text style={styles.bpmStepTxt}>−5</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => bumpBpm(-1)} activeOpacity={0.7} style={styles.bpmStep}>
          <Text style={styles.bpmStepTxt}>−1</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={tapTempo} activeOpacity={0.7} style={styles.tapBtn}>
          <Text style={styles.tapTxt}>TAP</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => bumpBpm(1)} activeOpacity={0.7} style={styles.bpmStep}>
          <Text style={styles.bpmStepTxt}>+1</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => bumpBpm(5)} activeOpacity={0.7} style={styles.bpmStep}>
          <Text style={styles.bpmStepTxt}>+5</Text>
        </TouchableOpacity>
      </View>

      {/* Time signature */}
      <Text style={styles.secLabel}>Time signature</Text>
      <View style={styles.sigRow}>
        {TIME_SIGS.map((s, i) => (
          <TouchableOpacity
            key={s.name}
            onPress={() => setSigIdx(i)}
            activeOpacity={0.7}
            style={[styles.sigPill, i === sigIdx && styles.sigPillActive]}
          >
            <Text style={[styles.sigText, i === sigIdx && styles.sigTextActive]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Glowing accent play circle */}
      <Animated.View style={{
        transform: [{
          scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }),
        }],
      }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setRunning(v => !v)}
          style={[styles.playCircle, running && styles.playCircleOn]}
        >
          <Text style={styles.playGlyph}>{running ? '■' : '▶'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg, alignItems: 'center' },

  // Hero BPM card — large rounded panel with mono number + beat dots
  bpmCard: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACE.xl,
    paddingHorizontal: SPACE.lg,
    alignItems: 'center',
    marginBottom: SPACE.lg,
  },
  bpmEyebrow: {
    fontSize: 10, fontWeight: '600',
    color: COLORS.textFaint, letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: FONT_FAMILY.mono,
  },
  bpmValue: {
    fontSize: 88, fontWeight: '700', lineHeight: 92,
    color: COLORS.text, letterSpacing: -3,
    fontFamily: FONT_FAMILY.mono,
  },
  bpmLabel: {
    fontSize: 12, fontWeight: '600',
    color: COLORS.textMuted, letterSpacing: 0.5,
    marginTop: 4,
    fontFamily: FONT_FAMILY.mono,
  },

  // Beat dots, sit inside the BPM card
  beatRow: {
    flexDirection: 'row', gap: 10, justifyContent: 'center',
    marginTop: SPACE.lg,
  },
  beatDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1, borderColor: COLORS.border,
  },
  // Lit color sits as an absolute fill over the base dot; its opacity is
  // animated (native driver) so lighting a beat never re-renders. Negative
  // insets cover the base dot's 1px border edge-to-edge.
  beatDotFill: {
    position: 'absolute',
    top: -1, left: -1, right: -1, bottom: -1,
    borderRadius: 7,
  },
  beatDotAccent: { borderColor: COLORS.textMuted },
  beatDotLit: {
    backgroundColor: COLORS.accent, borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 8,
    elevation: 4,
  },
  beatDotAccentLit: {
    backgroundColor: '#E0CC58', borderColor: '#B49E2E',
    shadowColor: '#E0CC58',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 8,
    elevation: 4,
  },

  // BPM step controls + tap
  bpmRow: {
    flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: SPACE.lg,
  },
  bpmStep: {
    width: 44, height: 38, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  bpmStepTxt: {
    fontSize: 13, fontWeight: '700', color: COLORS.text,
    fontFamily: FONT_FAMILY.mono,
  },
  tapBtn: {
    width: 60, height: 38, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  tapTxt: {
    fontSize: 12, fontWeight: '700', color: COLORS.accent, letterSpacing: 1.2,
    fontFamily: FONT_FAMILY.mono,
  },

  // Section label (mono uppercase)
  secLabel: {
    fontSize: 10, fontWeight: '600',
    color: COLORS.textFaint, letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: SPACE.sm, marginTop: SPACE.sm,
    fontFamily: FONT_FAMILY.mono,
    alignSelf: 'flex-start',
  },

  // Time signature pills
  sigRow: {
    flexDirection: 'row', gap: 6, flexWrap: 'wrap',
    marginBottom: SPACE.lg,
    alignSelf: 'stretch', justifyContent: 'center',
  },
  sigPill: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: 'transparent',
  },
  sigPillActive: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent },
  sigText: {
    fontSize: 13, fontWeight: '600', color: COLORS.textMuted,
    fontFamily: FONT_FAMILY.mono, letterSpacing: 0.4,
  },
  sigTextActive: { color: COLORS.text },

  // Big circular accent play button at the bottom
  playCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
    marginTop: SPACE.lg,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 18,
    elevation: 10,
  },
  playCircleOn: { backgroundColor: '#D45846' },
  playGlyph: { fontSize: 32, color: '#fff', fontWeight: '700', lineHeight: 36 },
});
