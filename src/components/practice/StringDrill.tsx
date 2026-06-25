import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, RADIUS, SPACE } from '../../constants/theme';
import { NOTES, OPEN_STRINGS, STRING_NAMES, NOTE_DISPLAY } from '../../constants/music';
import type { PracticeDifficulty } from '../../constants/subscription';
import PracticeFretboard, { type Highlight } from './PracticeFretboard';
import { DIFFICULTY, NATURAL_NOTES, ALL_NOTE_CLASSES, type RoundResult } from './practiceConfig';

interface Props {
  difficulty: PracticeDifficulty;
  onComplete: (result: RoundResult) => void;
  onExit: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function StringDrill({ difficulty, onComplete, onExit }: Props) {
  const cfg = DIFFICULTY[difficulty];
  const optionNoteClasses = cfg.naturalsOnly ? NATURAL_NOTES : ALL_NOTE_CLASSES;

  // Randomly pick a string for this round
  const [stringIdx, setStringIdx] = useState<number>(() => Math.floor(Math.random() * 6));

  // Build a shuffled queue of frets to visit; refilled on string change.
  const [fretQueue, setFretQueue] = useState<number[]>(() => {
    const range = Array.from({ length: cfg.maxFret + 1 }, (_, i) => i);
    return shuffle(range);
  });
  const [qIdx, setQIdx] = useState(0);
  const [currentFret, setCurrentFret] = useState<number>(() => 0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [pickedNoteClass, setPickedNoteClass] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(cfg.timerSec);
  const startTimeRef = useRef(Date.now());
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs mirror correct + qIdx so async callbacks (setTimeout in advance,
  // setInterval in the countdown) read the latest values — using state
  // directly produced a stale-closure bug where a perfect round scored as
  // N-1 / N (90% on a 10-question round).
  const correctRef = useRef(0);
  const qIdxRef = useRef(0);

  // First fret on mount
  useEffect(() => {
    setCurrentFret(fretQueue[0] ?? 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cfg.timerSec === null) return;
    tickTimerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s === null) return s;
        if (s <= 1) {
          if (tickTimerRef.current) clearInterval(tickTimerRef.current);
          onComplete({
            correct: correctRef.current,
            total: qIdxRef.current + 1,
            elapsedMs: Date.now() - startTimeRef.current,
          });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (tickTimerRef.current) clearInterval(tickTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); };
  }, []);

  function changeString(s: number) {
    if (s === stringIdx) return;
    setStringIdx(s);
    const range = Array.from({ length: cfg.maxFret + 1 }, (_, i) => i);
    const newQueue = shuffle(range);
    setFretQueue(newQueue);
    qIdxRef.current = 0;
    setQIdx(0);
    setCurrentFret(newQueue[0]);
    setFeedback(null);
    setPickedNoteClass(null);
    correctRef.current = 0;
    setCorrect(0);
    startTimeRef.current = Date.now();
  }

  function handlePick(nc: number) {
    if (feedback !== null) return;
    setPickedNoteClass(nc);
    const correctClass = (OPEN_STRINGS[stringIdx] + currentFret) % 12;
    if (nc === correctClass) {
      setFeedback('correct');
      correctRef.current += 1;
      setCorrect(correctRef.current);
    } else {
      setFeedback('wrong');
    }
    advanceTimerRef.current = setTimeout(() => advance(), 700);
  }

  function advance() {
    const nextIdx = qIdx + 1;
    if (nextIdx >= cfg.questions) {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      onComplete({
        correct: correctRef.current,
        total: cfg.questions,
        elapsedMs: Date.now() - startTimeRef.current,
      });
      return;
    }
    let queue = fretQueue;
    if (nextIdx >= queue.length) {
      const range = Array.from({ length: cfg.maxFret + 1 }, (_, i) => i);
      queue = shuffle(range);
      setFretQueue(queue);
    }
    qIdxRef.current = nextIdx;
    setQIdx(nextIdx);
    setCurrentFret(queue[nextIdx % queue.length]);
    setFeedback(null);
    setPickedNoteClass(null);
  }

  const correctClass = (OPEN_STRINGS[stringIdx] + currentFret) % 12;

  const highlights: Highlight[] = useMemo(() => {
    return [{
      stringIdx,
      fret: currentFret,
      kind: feedback ?? 'target' as const,
      label: feedback === 'correct' || feedback === 'wrong' ? NOTES[correctClass] : undefined,
    }];
  }, [stringIdx, currentFret, feedback, correctClass]);

  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onExit} activeOpacity={0.7} style={styles.exitBtn}>
          <Text style={styles.exitText}>← Exit</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>{qIdx + 1} / {cfg.questions}</Text>
        <Text style={styles.score}>
          {correct}{cfg.timerSec !== null && secondsLeft !== null ? ` · ${secondsLeft}s` : ''}
        </Text>
      </View>

      {/* String picker */}
      <Text style={styles.label}>STRING</Text>
      <View style={styles.stringRow}>
        {STRING_NAMES.map((name, s) => {
          const active = s === stringIdx;
          return (
            <TouchableOpacity
              key={`${s}-${name}`}
              onPress={() => changeString(s)}
              activeOpacity={0.7}
              style={[styles.stringPill, active && styles.stringPillActive]}
            >
              <Text style={[styles.stringPillText, active && styles.stringPillTextActive]}>
                {name.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.prompt}>What note is this?</Text>

      <View style={styles.fbWrap}>
        <PracticeFretboard
          maxFret={cfg.maxFret}
          highlights={highlights}
          disabled
        />
      </View>

      <Text style={styles.feedbackLine}>
        {feedback === 'correct'
          ? '✓ Correct!'
          : feedback === 'wrong'
            ? `✗ That was ${NOTES[pickedNoteClass!]} — answer was ${NOTES[correctClass]}`
            : ' '}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
        {optionNoteClasses.map(nc => {
          const isPicked = pickedNoteClass === nc;
          const isAnswer = correctClass === nc;
          let pillStyle = styles.pill;
          let textStyle = styles.pillText;
          if (feedback !== null) {
            if (isAnswer) { pillStyle = { ...styles.pill, ...styles.pillCorrect }; textStyle = styles.pillTextCorrect; }
            else if (isPicked) { pillStyle = { ...styles.pill, ...styles.pillWrong }; textStyle = styles.pillTextWrong; }
          }
          return (
            <TouchableOpacity
              key={nc}
              onPress={() => handlePick(nc)}
              activeOpacity={0.7}
              style={pillStyle}
              disabled={feedback !== null}
            >
              <Text style={textStyle}>{NOTE_DISPLAY[NOTES[nc]] || NOTES[nc]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md, alignItems: 'center' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch',
    marginBottom: SPACE.md,
  },
  exitBtn: { padding: 6 },
  exitText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  progress: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', color: COLORS.text },
  score: { fontSize: 13, fontWeight: '700', color: COLORS.accent, fontVariant: ['tabular-nums'] },

  label: { fontSize: 9, fontWeight: '700', color: COLORS.textFaint, letterSpacing: 0.8, marginBottom: 6 },
  stringRow: { flexDirection: 'row', gap: 6, marginBottom: SPACE.md },
  stringPill: {
    width: 44, height: 36, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  stringPillActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  stringPillText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  stringPillTextActive: { color: COLORS.accent },

  prompt: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: SPACE.md },
  fbWrap: { alignSelf: 'stretch', marginBottom: SPACE.md, alignItems: 'center' },
  feedbackLine: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: SPACE.md, minHeight: 18 },

  pillRow: { gap: 8, paddingVertical: 4, paddingHorizontal: 4 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
    minWidth: 50, alignItems: 'center',
  },
  pillCorrect: { borderColor: '#1D9E75', backgroundColor: 'rgba(29,158,117,0.18)' },
  pillWrong: { borderColor: '#E24B4A', backgroundColor: 'rgba(226,75,74,0.18)' },
  pillText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  pillTextCorrect: { fontSize: 14, fontWeight: '700', color: '#1D9E75' },
  pillTextWrong: { fontSize: 14, fontWeight: '700', color: '#E24B4A' },
});
