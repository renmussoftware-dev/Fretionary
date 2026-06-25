import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, RADIUS, SPACE } from '../../constants/theme';
import { NOTES, OPEN_STRINGS, NOTE_DISPLAY } from '../../constants/music';
import type { PracticeDifficulty } from '../../constants/subscription';
import PracticeFretboard from './PracticeFretboard';
import { DIFFICULTY, NATURAL_NOTES, ALL_NOTE_CLASSES, type RoundResult } from './practiceConfig';

interface Props {
  difficulty: PracticeDifficulty;
  onComplete: (result: RoundResult) => void;
  onExit: () => void;
}

interface Question {
  stringIdx: number;
  fret: number;
  noteClass: number;
}

function genQuestion(maxFret: number, naturalsOnly: boolean): Question {
  for (let attempts = 0; attempts < 50; attempts++) {
    const stringIdx = Math.floor(Math.random() * 6);
    const fret = Math.floor(Math.random() * (maxFret + 1));
    const noteClass = (OPEN_STRINGS[stringIdx] + fret) % 12;
    if (naturalsOnly && !NATURAL_NOTES.includes(noteClass)) continue;
    return { stringIdx, fret, noteClass };
  }
  // Fallback
  return { stringIdx: 0, fret: 0, noteClass: OPEN_STRINGS[0] };
}

export default function NameTheNoteDrill({ difficulty, onComplete, onExit }: Props) {
  const cfg = DIFFICULTY[difficulty];
  const optionNoteClasses = cfg.naturalsOnly ? NATURAL_NOTES : ALL_NOTE_CLASSES;

  const [qIdx, setQIdx] = useState(0);
  const [question, setQuestion] = useState<Question>(() => genQuestion(cfg.maxFret, cfg.naturalsOnly));
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [pickedNoteClass, setPickedNoteClass] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(cfg.timerSec);
  const startTimeRef = useRef(Date.now());
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs mirror correct + qIdx so async callbacks (advance via setTimeout,
  // tick via setInterval) read the latest values instead of stale closures.
  // Without these, a perfect 10/10 round reports as 9/10 (90%) because the
  // advance() closure scheduled in handlePick captures correct from before
  // the state batch commits. Same root cause for the timer-expiry path.
  const correctRef = useRef(0);
  const qIdxRef = useRef(0);

  // Countdown timer for advanced
  useEffect(() => {
    if (cfg.timerSec === null) return;
    tickTimerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s === null) return s;
        if (s <= 1) {
          if (tickTimerRef.current) clearInterval(tickTimerRef.current);
          // End round on timeout — read from refs because this callback was
          // captured at mount when both values were 0.
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

  function handlePick(nc: number) {
    if (feedback !== null) return; // already answered, waiting for advance
    setPickedNoteClass(nc);
    if (nc === question.noteClass) {
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
    qIdxRef.current = nextIdx;
    setQIdx(nextIdx);
    setQuestion(genQuestion(cfg.maxFret, cfg.naturalsOnly));
    setFeedback(null);
    setPickedNoteClass(null);
  }

  const highlights = useMemo(() => {
    const target = {
      stringIdx: question.stringIdx,
      fret: question.fret,
      kind: feedback ?? 'target' as const,
      label: feedback === 'correct' || feedback === 'wrong' ? NOTES[question.noteClass] : undefined,
    };
    return [target];
  }, [question, feedback]);

  return (
    <View style={styles.wrap}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onExit} activeOpacity={0.7} style={styles.exitBtn}>
          <Text style={styles.exitText}>← Exit</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>{qIdx + 1} / {cfg.questions}</Text>
        <Text style={styles.score}>
          {correct}{cfg.timerSec !== null && secondsLeft !== null ? ` · ${secondsLeft}s` : ''}
        </Text>
      </View>

      <Text style={styles.prompt}>What note is this?</Text>

      <View style={styles.fbWrap}>
        <PracticeFretboard
          maxFret={cfg.maxFret}
          highlights={highlights as any}
          disabled
        />
      </View>

      <Text style={styles.feedbackLine}>
        {feedback === 'correct'
          ? '✓ Correct!'
          : feedback === 'wrong'
            ? `✗ That was ${NOTES[pickedNoteClass!]} — answer was ${NOTES[question.noteClass]}`
            : ' '}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
        {optionNoteClasses.map(nc => {
          const isPicked = pickedNoteClass === nc;
          const isAnswer = question.noteClass === nc;
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
