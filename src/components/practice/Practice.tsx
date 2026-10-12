import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS, SPACE } from '../../constants/theme';
import {
  isPracticeFree,
  type PracticeMode,
  type PracticeDifficulty,
} from '../../constants/subscription';
import { useProGate } from '../../hooks/useProGate';
import { useStore } from '../../store/useStore';
import NameTheNoteDrill from './NameTheNoteDrill';
import FindTheNoteDrill from './FindTheNoteDrill';
import StringDrill from './StringDrill';
import Exercises from './Exercises';
import { DIFFICULTY, type RoundResult } from './practiceConfig';

const MODES: { mode: PracticeMode; title: string; tagline: string }[] = [
  { mode: 'name',   title: 'Name the Note',   tagline: 'A fret lights up — pick its note.' },
  { mode: 'find',   title: 'Find the Note',   tagline: 'Tap every position of the target note.' },
  { mode: 'string', title: 'String Drill',    tagline: 'Master one string at a time.' },
];

const DIFFICULTIES: PracticeDifficulty[] = ['beginner', 'intermediate', 'advanced'];

type Stage = 'menu' | 'drill' | 'results';

// Drills are tap-to-answer quizzes; Exercises are guitar-in-hand play-alongs.
type Tab = 'drills' | 'exercises';
const TABS: { tab: Tab; label: string }[] = [
  { tab: 'exercises', label: 'Exercises' },
  { tab: 'drills',    label: 'Drills' },
];

interface Props {
  // Scrolls the screen back to the top — the menus are long enough that
  // opening a drill or exercise from the bottom would otherwise land mid-page.
  onScrollTop?: () => void;
}

export default function Practice({ onScrollTop = () => {} }: Props) {
  const { isPro, requirePro } = useProGate();
  const recordPositiveAction = useStore(s => s.recordPositiveAction);
  const [stage, setStage] = useState<Stage>('menu');
  const [activeMode, setActiveMode] = useState<PracticeMode>('name');
  const [activeDifficulty, setActiveDifficulty] = useState<PracticeDifficulty>('beginner');
  const [result, setResult] = useState<RoundResult | null>(null);
  const [tab, setTab] = useState<Tab>('exercises');

  function startDrill(mode: PracticeMode, difficulty: PracticeDifficulty) {
    const free = isPracticeFree(mode, difficulty);
    const launch = () => {
      setActiveMode(mode);
      setActiveDifficulty(difficulty);
      setResult(null);
      setStage('drill');
    };
    if (!isPro && !free) {
      requirePro(launch);
      return;
    }
    launch();
  }

  function handleComplete(r: RoundResult) {
    setResult(r);
    setStage('results');
    // Strong drill performance is a great moment to ask for a rating.
    if (r.total > 0 && r.correct / r.total >= 0.8) {
      recordPositiveAction();
    }
  }

  function handleExit() {
    setStage('menu');
  }

  if (stage === 'drill') {
    if (activeMode === 'name')   return <NameTheNoteDrill difficulty={activeDifficulty} onComplete={handleComplete} onExit={handleExit} />;
    if (activeMode === 'find')   return <FindTheNoteDrill difficulty={activeDifficulty} onComplete={handleComplete} onExit={handleExit} />;
    if (activeMode === 'string') return <StringDrill      difficulty={activeDifficulty} onComplete={handleComplete} onExit={handleExit} />;
  }

  if (stage === 'results' && result) {
    const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
    const seconds = (result.elapsedMs / 1000).toFixed(1);
    const modeMeta = MODES.find(m => m.mode === activeMode);
    return (
      <View style={styles.wrap}>
        <View style={styles.resultsCard}>
          <Text style={styles.resultsLabel}>{modeMeta?.title} · {DIFFICULTY[activeDifficulty].label}</Text>
          <Text style={styles.resultsBig}>{result.correct} / {result.total}</Text>
          <Text style={styles.resultsAcc}>{accuracy}% accuracy</Text>
          <Text style={styles.resultsTime}>in {seconds}s</Text>
        </View>

        <TouchableOpacity onPress={() => startDrill(activeMode, activeDifficulty)} activeOpacity={0.85} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Try again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setStage('menu')} activeOpacity={0.7} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Back to menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tabs = (
    <View style={styles.tabs}>
      {TABS.map(t => (
        <TouchableOpacity
          key={t.tab}
          onPress={() => setTab(t.tab)}
          activeOpacity={0.8}
          style={[styles.tab, tab === t.tab && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === t.tab && styles.tabTextActive]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (tab === 'exercises') {
    return <Exercises tabs={tabs} onScrollTop={onScrollTop} />;
  }

  // Menu
  return (
    <View style={styles.wrap}>
      {tabs}
      <Text style={styles.intro}>
        Sharpen your fretboard knowledge — drill notes, find positions, master one string at a time.
      </Text>

      {!isPro && (
        <View style={styles.proHint}>
          <Text style={styles.proHintText}>
            <Text style={{ fontWeight: '700' }}>Free:</Text> Name the Note · Beginner.{' '}
            Other modes and harder difficulties unlock with Pro.
          </Text>
          <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.85} style={styles.upgradeBtn}>
            <Text style={styles.upgradeBtnText}>Unlock Pro →</Text>
          </TouchableOpacity>
        </View>
      )}

      {MODES.map(m => (
        <View key={m.mode} style={styles.modeCard}>
          <View style={styles.modeHeader}>
            <Text style={styles.modeTitle}>{m.title}</Text>
            {!isPracticeFree(m.mode, 'beginner') && !isPro && (
              <Text style={styles.modePro}>🔒 PRO</Text>
            )}
          </View>
          <Text style={styles.modeTagline}>{m.tagline}</Text>

          <View style={styles.diffRow}>
            {DIFFICULTIES.map(d => {
              const free = isPracticeFree(m.mode, d);
              const locked = !isPro && !free;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => startDrill(m.mode, d)}
                  activeOpacity={0.7}
                  style={[styles.diffPill, locked && styles.diffPillLocked]}
                >
                  <Text style={[styles.diffLabel, locked && styles.diffLocked]}>
                    {locked ? '🔒 ' : ''}{DIFFICULTY[d].label}
                  </Text>
                  <Text style={styles.diffDesc}>{DIFFICULTY[d].desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md },
  intro: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19, marginBottom: SPACE.lg },

  tabs: {
    flexDirection: 'row', padding: 3, marginBottom: SPACE.lg,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: RADIUS.full },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  proHint: {
    padding: SPACE.md, marginBottom: SPACE.lg,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(83,74,183,0.10)',
    borderWidth: 1, borderColor: 'rgba(83,74,183,0.3)',
  },
  proHintText: { fontSize: 12, color: COLORS.text, lineHeight: 18, marginBottom: 8 },
  upgradeBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
  },
  upgradeBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  modeCard: {
    marginBottom: SPACE.md,
    padding: SPACE.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  modeTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  modePro: { fontSize: 10, fontWeight: '800', color: '#E8D44D', letterSpacing: 0.6 },
  modeTagline: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACE.md },

  diffRow: { gap: 6 },
  diffPill: {
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceHigh,
  },
  diffPillLocked: { opacity: 0.6 },
  diffLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  diffLocked: { color: COLORS.textMuted },
  diffDesc: { fontSize: 11, color: COLORS.textFaint },

  resultsCard: {
    padding: SPACE.xl, alignItems: 'center',
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.accent,
    backgroundColor: COLORS.surface, marginBottom: SPACE.lg,
  },
  resultsLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 0.8, marginBottom: SPACE.sm, textTransform: 'uppercase',
  },
  resultsBig: { fontSize: 56, fontWeight: '800', color: COLORS.text, lineHeight: 60 },
  resultsAcc: { fontSize: 16, fontWeight: '700', color: COLORS.accent, marginTop: 4 },
  resultsTime: { fontSize: 12, color: COLORS.textMuted, marginTop: 6 },

  primaryBtn: {
    paddingVertical: 12, alignItems: 'center', borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent, marginBottom: SPACE.sm,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  secondaryBtn: {
    paddingVertical: 11, alignItems: 'center', borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
});
