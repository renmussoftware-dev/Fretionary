import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACE } from '../../constants/theme';
import { NOTES, OPEN_STRINGS, NOTE_DISPLAY } from '../../constants/music';
import type { PracticeDifficulty } from '../../constants/subscription';
import PracticeFretboard, { type Highlight } from './PracticeFretboard';
import { DIFFICULTY, NATURAL_NOTES, ALL_NOTE_CLASSES, type RoundResult } from './practiceConfig';

interface Props {
  difficulty: PracticeDifficulty;
  onComplete: (result: RoundResult) => void;
  onExit: () => void;
}

interface Pos { stringIdx: number; fret: number; }

// Round size for find-the-note is smaller because each target involves
// multiple taps to fully clear.
const TARGETS_PER_ROUND: Record<PracticeDifficulty, number> = {
  beginner: 5, intermediate: 8, advanced: 10,
};

function allPositionsFor(noteClass: number, maxFret: number): Pos[] {
  const out: Pos[] = [];
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= maxFret; f++) {
      if ((OPEN_STRINGS[s] + f) % 12 === noteClass) out.push({ stringIdx: s, fret: f });
    }
  }
  return out;
}

function pickTargetNote(naturalsOnly: boolean, exclude: number | null): number {
  const pool = naturalsOnly ? NATURAL_NOTES : ALL_NOTE_CLASSES;
  const filtered = exclude !== null ? pool.filter(n => n !== exclude) : pool;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export default function FindTheNoteDrill({ difficulty, onComplete, onExit }: Props) {
  const cfg = DIFFICULTY[difficulty];
  const targetCount = TARGETS_PER_ROUND[difficulty];

  const [tIdx, setTIdx] = useState(0);
  const [target, setTarget] = useState<number>(() => pickTargetNote(cfg.naturalsOnly, null));
  const [foundFrets, setFoundFrets] = useState<Pos[]>([]);
  const [wrongFlash, setWrongFlash] = useState<Pos | null>(null);
  const [mistakeThisTarget, setMistakeThisTarget] = useState(false);
  const [perfectCount, setPerfectCount] = useState(0); // targets cleared with no mistakes
  const [secondsLeft, setSecondsLeft] = useState(cfg.timerSec);
  const startTimeRef = useRef(Date.now());
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs mirror perfectCount + tIdx so async callbacks (advanceTarget via
  // setTimeout, timer tick via setInterval) read the latest values. Without
  // these, the closure captured at scheduling time sees a stale count and
  // a perfect round ends up reported as N-1 / N (e.g. 9/10 = 90%).
  const perfectCountRef = useRef(0);
  const tIdxRef = useRef(0);

  const allTargetPositions = useMemo(
    () => allPositionsFor(target, cfg.maxFret),
    [target, cfg.maxFret],
  );

  // Timer for advanced
  useEffect(() => {
    if (cfg.timerSec === null) return;
    tickTimerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s === null) return s;
        if (s <= 1) {
          if (tickTimerRef.current) clearInterval(tickTimerRef.current);
          onComplete({
            correct: perfectCountRef.current,
            total: tIdxRef.current + 1,
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
    return () => {
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  function handlePress(stringIdx: number, fret: number) {
    const noteClass = (OPEN_STRINGS[stringIdx] + fret) % 12;
    const alreadyFound = foundFrets.some(p => p.stringIdx === stringIdx && p.fret === fret);
    if (alreadyFound) return;

    if (noteClass === target) {
      const next = [...foundFrets, { stringIdx, fret }];
      setFoundFrets(next);
      // All instances found?
      if (next.length === allTargetPositions.length) {
        if (!mistakeThisTarget) {
          perfectCountRef.current += 1;
          setPerfectCount(perfectCountRef.current);
        }
        // Brief delay then advance
        advanceTimerRef.current = setTimeout(() => advanceTarget(), 700);
      }
    } else {
      setMistakeThisTarget(true);
      setWrongFlash({ stringIdx, fret });
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => setWrongFlash(null), 500);
    }
  }

  function advanceTarget() {
    const nextIdx = tIdx + 1;
    if (nextIdx >= targetCount) {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      onComplete({
        correct: perfectCountRef.current,
        total: targetCount,
        elapsedMs: Date.now() - startTimeRef.current,
      });
      return;
    }
    tIdxRef.current = nextIdx;
    setTIdx(nextIdx);
    setTarget(prev => pickTargetNote(cfg.naturalsOnly, prev));
    setFoundFrets([]);
    setMistakeThisTarget(false);
    setWrongFlash(null);
  }

  function skip() {
    advanceTarget();
  }

  const highlights: Highlight[] = useMemo(() => {
    const list: Highlight[] = foundFrets.map(p => ({
      stringIdx: p.stringIdx,
      fret: p.fret,
      kind: 'correct',
      label: NOTES[target],
    }));
    if (wrongFlash) {
      list.push({
        stringIdx: wrongFlash.stringIdx,
        fret: wrongFlash.fret,
        kind: 'wrong',
        label: NOTES[(OPEN_STRINGS[wrongFlash.stringIdx] + wrongFlash.fret) % 12],
      });
    }
    return list;
  }, [foundFrets, wrongFlash, target]);

  const totalFound = foundFrets.length;
  const totalToFind = allTargetPositions.length;

  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onExit} activeOpacity={0.7} style={styles.exitBtn}>
          <Text style={styles.exitText}>← Exit</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>{tIdx + 1} / {targetCount}</Text>
        <Text style={styles.score}>
          {perfectCount}{cfg.timerSec !== null && secondsLeft !== null ? ` · ${secondsLeft}s` : ''}
        </Text>
      </View>

      <Text style={styles.prompt}>Tap every</Text>
      <View style={styles.targetBadge}>
        <Text style={styles.targetText}>{NOTE_DISPLAY[NOTES[target]] || NOTES[target]}</Text>
      </View>
      <Text style={styles.subPrompt}>{totalFound} / {totalToFind} found</Text>

      <View style={styles.fbWrap}>
        <PracticeFretboard
          maxFret={cfg.maxFret}
          highlights={highlights}
          onPress={handlePress}
        />
      </View>

      <TouchableOpacity onPress={skip} activeOpacity={0.7} style={styles.skipBtn}>
        <Text style={styles.skipText}>Skip — no credit</Text>
      </TouchableOpacity>
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

  prompt: { fontSize: 14, fontWeight: '500', color: COLORS.textMuted, marginBottom: 4 },
  targetBadge: {
    paddingHorizontal: 22, paddingVertical: 8, borderRadius: RADIUS.full,
    backgroundColor: '#E8D44D', borderWidth: 1, borderColor: '#C4A800',
    marginBottom: 4,
  },
  targetText: { fontSize: 28, fontWeight: '800', color: '#5C4400', letterSpacing: 1 },
  subPrompt: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACE.md, fontVariant: ['tabular-nums'] },
  fbWrap: { alignSelf: 'stretch', alignItems: 'center', marginBottom: SPACE.md },
  skipBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  skipText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
});
