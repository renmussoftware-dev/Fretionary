import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { ensureAudioSession } from '../utils/audioSession';
import { Sound } from 'expo-av/build/Audio';
import { COLORS, FONT_FAMILY, RADIUS, SPACE } from '../constants/theme';

interface TimeSig { name: string; beats: number; }

const TIME_SIGS: TimeSig[] = [
  { name: '2/4', beats: 2 },
  { name: '3/4', beats: 3 },
  { name: '4/4', beats: 4 },
  { name: '5/4', beats: 5 },
  { name: '6/8', beats: 6 },
  { name: '7/8', beats: 7 },
];

const ACCENT_VOLUME = 1.0;
const OFFBEAT_VOLUME = 0.55;
const CLICK_SAMPLE = require('../../assets/audio/WoodBlHi ExtraPerc V1.wav');

const BPM_MIN = 40;
const BPM_MAX = 240;
const TAP_WINDOW_MS = 2500;  // taps older than this expire

// Lookahead scheduler (audio-api path). We schedule every click due in the
// next SCHEDULE_AHEAD seconds against the audio clock, refilling on a coarse
// LOOKAHEAD_MS JS interval. The interval's own jitter is irrelevant - it only
// tops up the queue; each click still fires at its exact scheduled audio time.
const SCHEDULE_AHEAD = 0.1;  // seconds of audio scheduled in advance
const LOOKAHEAD_MS = 25;     // how often the queue is refilled

export default function Metronome() {
  // -- Audio engines --------------------------------------------------------
  // Primary: react-native-audio-api. Its Web Audio context gives a
  // sample-accurate audio clock and start(when) scheduling, so each click
  // fires on the audio thread at its exact appointed time - immune to the
  // JS-thread jitter the setTimeout scheduler could never escape.
  //
  // Fallback: the previous expo-av + setTimeout scheduler, used when the
  // audio-api native module isn't present (a dev client built before it was
  // added) or fails to init on some device. Keeps the metronome working -
  // with the old jitter - rather than going silent.
  const engineRef = useRef<'audioapi' | 'expoav' | null>(null);
  const [engineReady, setEngineReady] = useState(false);

  // audio-api refs (typed loosely - the module is lazy-required so we never
  // import its types statically, which would break older binaries at load).
  const ctxRef = useRef<any>(null);
  const clickBufRef = useRef<any>(null);
  const accentGainRef = useRef<any>(null);
  const offbeatGainRef = useRef<any>(null);
  const nextNoteTimeRef = useRef(0);              // next click, audio-clock seconds
  const visualQueueRef = useRef<{ beat: number; time: number }[]>([]);
  const lookaheadRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // expo-av fallback refs
  const accentSoundRef = useRef<Sound | null>(null);
  const offbeatSoundRef = useRef<Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTickRef = useRef<number>(0);

  // shared
  const beatRef = useRef(0);
  const tapTimesRef = useRef<number[]>([]);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const beatAnim = useRef(new Animated.Value(-1)).current;

  const [bpm, setBpm] = useState(100);
  const [sigIdx, setSigIdx] = useState(2); // default 4/4
  const [running, setRunning] = useState(false);
  const sig = TIME_SIGS[sigIdx];

  // Scheduler reads tempo/beats through refs so changing them never restarts
  // the loop (a restart used to fire an off-schedule click on every +/- tap).
  const bpmRef = useRef(bpm);
  const beatsRef = useRef(sig.beats);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { beatsRef.current = sig.beats; }, [sig.beats]);

  // One visual helper for both engines: light the current dot (native-driven
  // Animated.Value, no re-render) and fire the scale pulse. Called at each
  // beat's real sounding time.
  function showBeat(beat: number) {
    beatAnim.setValue(beat);
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }

  // expo-av fallback click.
  function playClick(accent: boolean) {
    const sound = accent ? accentSoundRef.current : offbeatSoundRef.current;
    sound?.replayAsync().catch(() => {});
  }

  // -- Load: pick an engine -------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    async function init() {
      // Try the precise engine first.
      try {
        const { AudioContext } = require('react-native-audio-api');
        const ctx = new AudioContext();
        const accentGain = ctx.createGain();
        accentGain.gain.value = ACCENT_VOLUME;
        accentGain.connect(ctx.destination);
        const offbeatGain = ctx.createGain();
        offbeatGain.gain.value = OFFBEAT_VOLUME;
        offbeatGain.connect(ctx.destination);
        const buf = await ctx.decodeAudioData(CLICK_SAMPLE);
        if (cancelled) { ctx.close?.(); return; }
        ctxRef.current = ctx;
        clickBufRef.current = buf;
        accentGainRef.current = accentGain;
        offbeatGainRef.current = offbeatGain;
        engineRef.current = 'audioapi';
        setEngineReady(true);
        return;
      } catch (e) {
        if (__DEV__) console.warn('[metronome] audio-api unavailable, using expo-av', e);
      }
      // Fallback: expo-av.
      try {
        await ensureAudioSession();
        const [{ sound: accent }, { sound: offbeat }] = await Promise.all([
          Audio.Sound.createAsync(CLICK_SAMPLE, { shouldPlay: false, volume: ACCENT_VOLUME }),
          Audio.Sound.createAsync(CLICK_SAMPLE, { shouldPlay: false, volume: OFFBEAT_VOLUME }),
        ]);
        if (cancelled) { accent.unloadAsync(); offbeat.unloadAsync(); return; }
        accentSoundRef.current = accent;
        offbeatSoundRef.current = offbeat;
        engineRef.current = 'expoav';
        setEngineReady(true);
      } catch {}
    }
    init();
    return () => {
      cancelled = true;
      if (lookaheadRef.current) clearInterval(lookaheadRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      accentSoundRef.current?.unloadAsync();
      offbeatSoundRef.current?.unloadAsync();
      accentSoundRef.current = null;
      offbeatSoundRef.current = null;
      ctxRef.current?.close?.().catch?.(() => {});
      ctxRef.current = null;
    };
  }, []);

  // -- Run: start/stop the active engine's scheduler ------------------------
  useEffect(() => {
    if (!running) {
      if (lookaheadRef.current) { clearInterval(lookaheadRef.current); lookaheadRef.current = null; }
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      beatAnim.setValue(-1);
      return;
    }
    if (!engineReady) return;  // re-runs when the engine finishes loading

    beatRef.current = 0;

    // -- Precise path: lookahead against the audio clock --
    if (engineRef.current === 'audioapi') {
      const ctx = ctxRef.current;
      ctx.resume?.();
      visualQueueRef.current = [];
      // Start a hair in the future so the first click isn't clipped.
      nextNoteTimeRef.current = ctx.currentTime + 0.06;

      const schedule = () => {
        const c = ctxRef.current;
        if (!c) return;
        // Fill the audio queue up to SCHEDULE_AHEAD out.
        while (nextNoteTimeRef.current < c.currentTime + SCHEDULE_AHEAD) {
          const beat = beatRef.current;
          const t = nextNoteTimeRef.current;
          const src = c.createBufferSource();
          src.buffer = clickBufRef.current;
          src.connect(beat === 0 ? accentGainRef.current : offbeatGainRef.current);
          src.start(t);  // fires at exactly t on the audio thread
          visualQueueRef.current.push({ beat, time: t });
          beatRef.current = (beat + 1) % beatsRef.current;
          nextNoteTimeRef.current += 60 / bpmRef.current;
        }
        // Fire visuals whose audio time has arrived (cosmetic; ~LOOKAHEAD_MS
        // resolution, imperceptible).
        const now = c.currentTime;
        const q = visualQueueRef.current;
        while (q.length && q[0].time <= now) showBeat(q.shift()!.beat);
      };
      schedule();
      lookaheadRef.current = setInterval(schedule, LOOKAHEAD_MS);

      return () => {
        if (lookaheadRef.current) { clearInterval(lookaheadRef.current); lookaheadRef.current = null; }
      };
    }

    // -- Fallback path: expo-av absolute-grid setTimeout --
    beatAnim.setValue(0);
    nextTickRef.current = Date.now();
    function tick() {
      const now = Date.now();
      const interval = 60_000 / bpmRef.current;
      const beat = beatRef.current;
      playClick(beat === 0);
      beatRef.current = (beat + 1) % beatsRef.current;
      nextTickRef.current += interval;
      if (nextTickRef.current <= now) nextTickRef.current = now + interval;
      timerRef.current = setTimeout(tick, nextTickRef.current - now);
      showBeat(beat);
    }
    tick();
    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tempo/beats via refs by design
  }, [running, engineReady]);

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
