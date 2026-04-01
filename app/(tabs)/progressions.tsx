import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Modal, Pressable, useWindowDimensions, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Text as SvgText, G, Rect } from 'react-native-svg';
import { COLORS, SPACE, RADIUS } from '../../src/constants/theme';
import { NOTES, NOTE_DISPLAY, CHORDS, OPEN_STRINGS } from '../../src/constants/music';
import { PROGRESSIONS, GENRES, type Progression } from '../../src/constants/progressions';
import ChordBox from '../../src/components/ChordBox';
import { useStore } from '../../src/store/useStore';
import { useAudioEngine } from '../../src/hooks/useAudioEngine';
import { useProGate } from '../../src/hooks/useProGate';
import { ProBanner } from '../../src/components/ProLock';
import { isProgressionFree } from '../../src/constants/subscription';
import { getChordVoicings } from '../../src/utils/theory';

type SubMode = 'common' | 'diatonic' | 'custom';

const DIATONIC_MAJOR = [
  { degree: 0,  chordType: 'Major',      numeral: 'I'    },
  { degree: 2,  chordType: 'Minor',      numeral: 'ii'   },
  { degree: 4,  chordType: 'Minor',      numeral: 'iii'  },
  { degree: 5,  chordType: 'Major',      numeral: 'IV'   },
  { degree: 7,  chordType: 'Major',      numeral: 'V'    },
  { degree: 9,  chordType: 'Minor',      numeral: 'vi'   },
  { degree: 11, chordType: 'Diminished', numeral: 'vii\u00b0' },
];


// Fretboard constants (base — overridden inside component for tablet)
const INLAYS = [3, 5, 7, 9, 12];

function ProgFretboard({ chordRoot, chordKey, animVal }: {
  chordRoot: number; chordKey: string; animVal: Animated.Value;
}) {
  const { width: screenW } = useWindowDimensions();
  const isTablet = screenW >= 768;
  const FBL = 28, FBT = 20, FBNW = 5, FBFRETS = 12, FBSTR = 6;
  const FBFW = isTablet ? Math.floor((screenW - 60) / FBFRETS) : 46;
  const FBSH = isTablet ? 38 : 28;
  const FBDR = isTablet ? 14 : 11;
  const FBW = FBL + FBNW + FBFRETS * FBFW + 12;
  const FBH = FBT + (FBSTR - 1) * FBSH + 28;
  function fbX(f: number) { return f === 0 ? FBL + FBNW / 2 : FBL + FBNW + f * FBFW - FBFW / 2; }
  function fbY(s: number) { return FBT + s * FBSH; }

  const ch = CHORDS[chordKey];
  const chordNotes = ch ? ch.intervals.map((iv: number) => (chordRoot + iv) % 12) : [];
  const chordSet = new Set(chordNotes);
  return (
    <Animated.View style={{ opacity: animVal }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
        <Svg width={FBW} height={FBH} viewBox={`0 0 ${FBW} ${FBH}`}>
          {INLAYS.map(f => {
            const x = FBL + FBNW + f * FBFW - FBFW / 2;
            return f === 12
              ? <G key={f}>
                  <Circle cx={x} cy={fbY(1.5)} r={3} fill="#252528" />
                  <Circle cx={x} cy={fbY(3.5)} r={3} fill="#252528" />
                </G>
              : <Circle key={f} cx={x} cy={fbY(2.5)} r={3} fill="#252528" />;
          })}
          {Array.from({ length: FBSTR }, (_, s) => (
            <Line key={s} x1={FBL} y1={fbY(s)} x2={FBL + FBNW + FBFRETS * FBFW} y2={fbY(s)}
              stroke="#3A3A46" strokeWidth={0.5 + (s / FBSTR) * 2} />
          ))}
          <Rect x={FBL} y={fbY(0) - 8} width={FBNW} height={(FBSTR - 1) * FBSH + 16} rx={2} fill="#888680" />
          {Array.from({ length: FBFRETS }, (_, i) => i + 1).map(f => (
            <Line key={f} x1={FBL + FBNW + f * FBFW} y1={fbY(0) - 6}
              x2={FBL + FBNW + f * FBFW} y2={fbY(5) + 6} stroke="#2E2E38" strokeWidth={1} />
          ))}
          {[1, 3, 5, 7, 9, 12].map(f => (
            <SvgText key={f} x={FBL + FBNW + f * FBFW - FBFW / 2} y={FBH - 4}
              textAnchor="middle" fontSize={8} fill="#4A4A54">{f}</SvgText>
          ))}
          {['e', 'B', 'G', 'D', 'A', 'E'].map((n, s) => (
            <SvgText key={s} x={FBL - 6} y={fbY(s) + 4} textAnchor="middle" fontSize={9} fill="#888680">{n}</SvgText>
          ))}
          {Array.from({ length: FBSTR }, (_, s) =>
            Array.from({ length: FBFRETS + 1 }, (_, f) => {
              const ni = (OPEN_STRINGS[s] + f) % 12;
              if (!chordSet.has(ni)) return null;
              const x = fbX(f), y = fbY(s);
              const intv = (ni - chordRoot + 12) % 12;
              const chIv = ch?.intervals.map((i: number) => i % 12) ?? [];
              const pos = chIv.indexOf(intv);
              let fill = '#3A3A46', stroke = '#52525F', tc = '#C0BEB8';
              if (ni === chordRoot)  { fill = '#E8D44D'; stroke = '#C4A800'; tc = '#5C4400'; }
              else if (pos === 1)   { fill = '#E24B4A'; stroke = '#A32D2D'; tc = '#fff'; }
              else if (pos === 2)   { fill = '#1D9E75'; stroke = '#0F6E56'; tc = '#fff'; }
              else if (pos >= 3)    { fill = '#378ADD'; stroke = '#185FA5'; tc = '#fff'; }
              return (
                <G key={`${s}-${f}`}>
                  <Circle cx={x} cy={y} r={FBDR} fill={fill} stroke={stroke} strokeWidth={1.5} />
                  <SvgText x={x} y={y + 4} textAnchor="middle" fontSize={8} fontWeight="600" fill={tc}>
                    {NOTES[ni]}
                  </SvgText>
                </G>
              );
            })
          )}
        </Svg>
      </ScrollView>
    </Animated.View>
  );
}

function MiniBox({ root, chordKey, numeral, active, onPress }: {
  root: number; chordKey: string; numeral: string; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={[styles.miniBox, active && styles.miniBoxActive]}>
      <Text style={[styles.miniNum, active && styles.miniNumActive]}>{numeral}</Text>
      <ChordBox root={root} chordKey={chordKey} compact />
    </TouchableOpacity>
  );
}


export default function ProgressionsScreen() {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const isTablet = screenW >= 768;
  const { root, setRoot } = useStore();
  const { isPro, requirePro } = useProGate();
  const [subMode, setSubMode] = useState<SubMode>('common');
  const [genre, setGenre] = useState('All');
  const [selectedProg, setSelectedProg] = useState<Progression>(PROGRESSIONS[0]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(80);
  const [showModal, setShowModal] = useState(false);
  const [customChords, setCustomChords] = useState<{ degree: number; chordType: string; numeral: string }[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const scrimAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { playChord, playProgression, stopProgression } = useAudioEngine();

  // Draggable LIST pill
  const pillOffset = useRef(new Animated.Value(0)).current;
  const pillBase   = useRef(0);
  const didDrag    = useRef(false);
  const progPanResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      didDrag.current = false;
      pillOffset.setOffset(pillBase.current);
      pillOffset.setValue(0);
    },
    onPanResponderMove: (_, gs) => {
      if (Math.abs(gs.dy) > 4) didDrag.current = true;
      pillOffset.setValue(gs.dy);
    },
    onPanResponderRelease: (_, gs) => {
      pillOffset.flattenOffset();
      const clamped = Math.max(0, Math.min(screenH * 0.82, pillBase.current + gs.dy));
      pillBase.current = clamped;
      Animated.spring(pillOffset, { toValue: clamped, useNativeDriver: true, bounciness: 0, speed: 20 }).start();
      if (!didDrag.current) drawerOpen ? closeDrawer() : openDrawer();
    },
  })).current;

  const activeProg: Progression = subMode === 'custom'
    ? {
        name: 'Custom',
        numerals: customChords.map(c => c.numeral),
        degrees: customChords.map(c => c.degree),
        chordTypes: customChords.map(c => c.chordType),
        genre: 'Custom',
        description: '',
      }
    : selectedProg;

  const count = activeProg.degrees.length;
  const currentRoot = (root + (activeProg.degrees[activeIdx] ?? 0)) % 12;
  const currentType = activeProg.chordTypes[activeIdx] ?? 'Major';
  const currentNumeral = activeProg.numerals[activeIdx] ?? '';

  // Build fret arrays for the current progression's chords
  function getProgressionFrets(): (number | null)[][] {
    return activeProg.degrees.map((deg, i) => {
      const chordRoot = (root + deg) % 12;
      const chordType = activeProg.chordTypes[i] ?? 'Major';
      const voicings = getChordVoicings(chordRoot, chordType);
      return voicings.length > 0 ? voicings[0].frets : [];
    });
  }

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!playing) { stopProgression(); return; }
    if (count === 0) return;

    const fretsList = getProgressionFrets();
    playProgression(
      fretsList,
      bpm,
      (idx) => {
        setActiveIdx(idx);
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0.3, duration: 70, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      },
      () => setPlaying(false),
    );
    return () => { stopProgression(); };
  }, [playing, count, bpm, root, activeProg]);

  const DRAWER_W = 200;

  function openDrawer() {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerAnim, { toValue: 1, useNativeDriver: true, bounciness: 0, speed: 20 }),
      Animated.timing(scrimAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }

  function closeDrawer() {
    Animated.parallel([
      Animated.spring(drawerAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 20 }),
      Animated.timing(scrimAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  }

  function goTo(i: number) {
    setActiveIdx(i);
    setPlaying(false);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 60, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
    // Play the chord audio on manual step
    const chordRoot = (root + (activeProg.degrees[i] ?? 0)) % 12;
    const chordType = activeProg.chordTypes[i] ?? 'Major';
    const voicings = getChordVoicings(chordRoot, chordType);
    if (voicings.length > 0) playChord(voicings[0].frets);
  }

  function pickProg(p: Progression) {
    setSelectedProg(p);
    setActiveIdx(0);
    setPlaying(false);
  }

  const filtered = PROGRESSIONS.filter(p => genre === 'All' || p.genre === genre);

  const drawerX = drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [-DRAWER_W, 0] });
  const toggleX = drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, DRAWER_W] });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Progressions</Text>
          <View style={styles.bpmRow}>
            <TouchableOpacity onPress={() => setBpm(b => Math.max(40, b - 10))} style={styles.bpmBtn} activeOpacity={0.7}>
              <Text style={styles.bpmBtnTxt}>–</Text>
            </TouchableOpacity>
            <Text style={styles.bpmTxt}>{bpm} bpm</Text>
            <TouchableOpacity onPress={() => setBpm(b => Math.min(200, b + 10))} style={styles.bpmBtn} activeOpacity={0.7}>
              <Text style={styles.bpmBtnTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.noteRow}>
          {NOTES.map((n, i) => (
            <TouchableOpacity key={n} onPress={() => setRoot(i)}
              style={[styles.notePill, root === i && styles.notePillActive]} activeOpacity={0.7}>
              <Text style={[styles.noteText, root === i && styles.noteTextActive]}>{NOTE_DISPLAY[n] || n}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.subTabs}>
          {(['common', 'diatonic', 'custom'] as SubMode[]).map(m => (
            <TouchableOpacity key={m}
              onPress={() => { setSubMode(m); setActiveIdx(0); setPlaying(false); }}
              style={[styles.subTab, subMode === m && styles.subTabActive]} activeOpacity={0.7}>
              <Text style={[styles.subTabTxt, subMode === m && styles.subTabTxtActive]}>
                {m === 'common' ? 'Common' : m === 'diatonic' ? 'Diatonic' : 'Custom'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.body, { overflow: 'hidden' }]}>
        {/* Drawer content moved below */}
        <View style={styles.right}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {count > 0 ? (
              <>
                <View style={styles.activeCard}>
                  <Text style={styles.activeNum}>{currentNumeral}</Text>
                  <Text style={styles.activeName}>{NOTES[currentRoot]} {currentType}</Text>
                  <Text style={styles.activeIntervals}>{CHORDS[currentType]?.intervalNames.join('  ·  ')}</Text>
                </View>

                <View style={styles.fbWrap}>
                  <ProgFretboard chordRoot={currentRoot} chordKey={currentType} animVal={fadeAnim} />
                </View>

                <View style={styles.ctrlRow}>
                  <TouchableOpacity onPress={() => goTo((activeIdx - 1 + count) % count)} style={styles.navBtn} activeOpacity={0.7}>
                    <Text style={styles.navTxt}>{'<'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                      if (!isPro) { requirePro(() => {}); return; }
                      setPlaying(v => !v);
                    }}
                    style={[styles.playBtn, playing && styles.playBtnOn]} activeOpacity={0.7}>
                    <Text style={[styles.playTxt, playing && styles.playTxtOn]}>
                      {!isPro ? '🔒 Play' : playing ? 'Pause' : 'Play'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => goTo((activeIdx + 1) % count)} style={styles.navBtn} activeOpacity={0.7}>
                    <Text style={styles.navTxt}>{'>'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dots}>
                  {activeProg.degrees.map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
                      <View style={[styles.dot, i === activeIdx && styles.dotActive]} />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.secLabel}>Chord shapes</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boxRow}>
                  {activeProg.degrees.map((deg, i) => (
                    <MiniBox key={i} root={(root + deg) % 12} chordKey={activeProg.chordTypes[i]}
                      numeral={activeProg.numerals[i]} active={i === activeIdx} onPress={() => goTo(i)} />
                  ))}
                </ScrollView>

                {activeProg.description ? (
                  <View style={styles.descCard}>
                    <Text style={styles.descTitle}>{activeProg.name}</Text>
                    <Text style={styles.descTxt}>{activeProg.description}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTxt}>
                  {subMode === 'custom'
                    ? 'Add chords on the left\nto build a progression'
                    : 'Select a progression'}
                </Text>
              </View>
            )}
            <View style={{ height: 80 }} />
          </ScrollView>
        </View>

        {/* Scrim */}
        {drawerOpen && (
          <Animated.View style={[styles.scrim, { opacity: scrimAnim }]} pointerEvents="auto">
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
          </Animated.View>
        )}

        {/* Drawer */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerX }] }]}>
          {/* Content is inserted by JS below */}
          {drawerOpen && subMode === 'common' && (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.genreRow} style={{ maxHeight: 40 }}>
                {GENRES.map(g => (
                  <TouchableOpacity key={g} onPress={() => setGenre(g)}
                    style={[styles.genrePill, genre === g && styles.genrePillActive]} activeOpacity={0.7}>
                    <Text style={[styles.genreTxt, genre === g && styles.genreTxtActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView showsVerticalScrollIndicator={false}>
                {!isPro && <ProBanner />}
                {filtered.map(p => {
                  const locked = !isPro && !isProgressionFree(p.name);
                  return (
                    <TouchableOpacity key={p.name} onPress={() => {
                      if (locked) { requirePro(() => { pickProg(p); closeDrawer(); }); return; }
                      pickProg(p); closeDrawer();
                    }}
                      style={[styles.progItem, selectedProg.name === p.name && subMode === 'common' && styles.progItemActive, locked && { opacity: 0.5 }]}
                      activeOpacity={0.7}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.progName, selectedProg.name === p.name && subMode === 'common' && styles.progNameActive]}
                          numberOfLines={1}>{p.name}</Text>
                        {locked && <Text style={{ fontSize: 12 }}>🔒</Text>}
                      </View>
                      <View style={styles.progMeta}>
                        <View style={styles.badge}><Text style={styles.badgeTxt}>{p.genre}</Text></View>
                        <Text style={styles.progNums} numberOfLines={1}>{p.numerals.slice(0, 4).join(' – ')}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                <View style={{ height: 40 }} />
              </ScrollView>
            </>
          )}
          {drawerOpen && subMode === 'diatonic' && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.diatHeader}>Key of {NOTES[root]} major</Text>
              {DIATONIC_MAJOR.map((d, i) => {
                const cr = (root + d.degree) % 12;
                return (
                  <TouchableOpacity key={i} onPress={() => {
                    pickProg({ name: `${d.numeral} — ${NOTES[cr]} ${d.chordType}`, numerals: [d.numeral], degrees: [d.degree], chordTypes: [d.chordType], genre: 'Diatonic', description: `The ${d.numeral} chord of ${NOTES[root]} major.` });
                    setSubMode('common'); closeDrawer();
                  }} style={styles.progItem} activeOpacity={0.7}>
                    <View style={styles.diatRow}>
                      <Text style={styles.diatNum}>{d.numeral}</Text>
                      <View>
                        <Text style={styles.progName}>{NOTES[cr]} {d.chordType}</Text>
                        <Text style={styles.progNums}>{CHORDS[d.chordType]?.intervalNames.join(' · ')}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <Text style={styles.diatSubhead}>Common in {NOTES[root]}</Text>
              {[
                { name: 'I – IV – V', n: ['I','IV','V'], d: [0,5,7], t: ['Major','Major','Major'] },
                { name: 'I – V – vi – IV', n: ['I','V','vi','IV'], d: [0,7,9,5], t: ['Major','Major','Minor','Major'] },
                { name: 'ii – V – I', n: ['ii','V','I'], d: [2,7,0], t: ['Minor','Major','Major'] },
                { name: 'I – vi – IV – V', n: ['I','vi','IV','V'], d: [0,9,5,7], t: ['Major','Minor','Major','Major'] },
              ].map(p => (
                <TouchableOpacity key={p.name} onPress={() => {
                  setSubMode('common');
                  const match = PROGRESSIONS.find(x => x.name === p.name);
                  if (match) pickProg(match);
                  else pickProg({ name: p.name, numerals: p.n, degrees: p.d, chordTypes: p.t, genre: 'Diatonic', description: '' });
                  closeDrawer();
                }} style={styles.progItem} activeOpacity={0.7}>
                  <Text style={styles.progName}>{p.name}</Text>
                  <Text style={styles.progNums}>{p.n.join(' – ')}</Text>
                </TouchableOpacity>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
          {drawerOpen && subMode === 'custom' && (
            <View style={{ flex: 1 }}>
              <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn} activeOpacity={0.7}>
                <Text style={styles.addBtnTxt}>+ Add chord</Text>
              </TouchableOpacity>
              <ScrollView showsVerticalScrollIndicator={false}>
                {customChords.length === 0 && (
                  <Text style={styles.customEmpty}>Tap + Add chord to build your progression</Text>
                )}
                {customChords.map((c, i) => (
                  <View key={i} style={styles.customItem}>
                    <Text style={styles.customItemNum}>{c.numeral}</Text>
                    <Text style={styles.customItemName} numberOfLines={1}>{NOTES[(root + c.degree) % 12]} {c.chordType}</Text>
                    <TouchableOpacity onPress={() => { setCustomChords(ch => ch.filter((_, j) => j !== i)); if (activeIdx >= customChords.length - 1) setActiveIdx(0); }}
                      style={styles.removeBtn} activeOpacity={0.7}>
                      <Text style={styles.removeTxt}>x</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          )}
        </Animated.View>

        {/* Toggle pill */}
        <Animated.View
          style={[styles.toggleWrap, { transform: [{ translateX: toggleX }, { translateY: pillOffset }] }]}
          {...progPanResponder.panHandlers}
        >
          <View style={styles.togglePill}>
            <Text style={styles.toggleDots}>⋮</Text>
            <Text style={styles.toggleArrow}>{drawerOpen ? '‹' : '›'}</Text>
            <Text style={styles.toggleLabel}>LIST</Text>
          </View>
        </Animated.View>
      </View>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHdr}>
              <Text style={styles.modalTitle}>Add a chord</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} activeOpacity={0.7}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.modalSec}>Diatonic — {NOTES[root]} major</Text>
              {DIATONIC_MAJOR.map((d, i) => (
                <TouchableOpacity key={i}
                  onPress={() => { setCustomChords(ch => [...ch, d]); setShowModal(false); setActiveIdx(0); }}
                  style={styles.modalItem} activeOpacity={0.7}>
                  <Text style={styles.modalNum}>{d.numeral}</Text>
                  <Text style={styles.modalName}>{NOTES[(root + d.degree) % 12]} {d.chordType}</Text>
                  <Text style={styles.modalIntervals}>{CHORDS[d.chordType]?.intervalNames.join(' · ')}</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.modalSec}>All types on {NOTES[root]}</Text>
              {Object.keys(CHORDS).map(ck => (
                <TouchableOpacity key={ck}
                  onPress={() => { setCustomChords(ch => [...ch, { degree: 0, chordType: ck, numeral: 'I' }]); setShowModal(false); setActiveIdx(0); }}
                  style={styles.modalItem} activeOpacity={0.7}>
                  <Text style={styles.modalNum}>I</Text>
                  <Text style={styles.modalName}>{NOTES[root]} {ck}</Text>
                  <Text style={styles.modalIntervals}>{CHORDS[ck]?.intervalNames.join(' · ')}</Text>
                </TouchableOpacity>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.bg },
  header:         { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingTop: SPACE.md, paddingBottom: SPACE.sm, gap: SPACE.sm },
  headerTop:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.lg },
  title:          { fontSize: 18, fontWeight: '700', color: COLORS.text, flex: 1 },
  bpmRow:         { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bpmBtn:         { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  bpmBtnTxt:      { fontSize: 16, color: COLORS.text, lineHeight: 20 },
  bpmTxt:         { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, minWidth: 54, textAlign: 'center' },
  noteRow:        { flexDirection: 'row', paddingHorizontal: SPACE.lg, gap: 6 },
  notePill:       { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  notePillActive: { backgroundColor: '#E8D44D', borderColor: '#C4A800' },
  noteText:       { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  noteTextActive: { color: '#5C4400' },
  subTabs:        { flexDirection: 'row', marginHorizontal: SPACE.lg, gap: 4, backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 3, borderWidth: 1, borderColor: COLORS.border },
  subTab:         { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  subTabActive:   { backgroundColor: COLORS.surfaceHigh },
  subTabTxt:      { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  subTabTxtActive:{ color: COLORS.text },
  body:           { flex: 1 },
  scrim:          { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 10 },
  drawer:         { position: 'absolute', left: 0, top: 0, bottom: 0, width: 200, backgroundColor: COLORS.surface, borderRightWidth: 1, borderRightColor: COLORS.border, zIndex: 20 },
  toggleWrap:     { position: 'absolute', left: 0, top: '35%', zIndex: 30 },
  togglePill:     { backgroundColor: COLORS.surfaceHigh, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderWidth: 1, borderLeftWidth: 0, borderColor: COLORS.borderLight, paddingVertical: 14, paddingLeft: 6, paddingRight: 10, alignItems: 'center', gap: 4 },
  toggleDots:     { fontSize: 13, color: COLORS.textFaint, lineHeight: 14, letterSpacing: -2 },
  toggleArrow:    { fontSize: 16, color: COLORS.text, fontWeight: '600', lineHeight: 18 },
  toggleLabel:    { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2 },
  genreRow:       { flexDirection: 'row', paddingHorizontal: SPACE.sm, paddingVertical: SPACE.xs, gap: 5 },
  genrePill:      { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  genrePillActive:{ backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  genreTxt:       { fontSize: 11, fontWeight: '500', color: COLORS.textMuted },
  genreTxtActive: { color: '#fff' },
  progItem:       { paddingVertical: 9, paddingHorizontal: SPACE.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  progItemActive: { backgroundColor: COLORS.surfaceHigh },
  progName:       { fontSize: 11, fontWeight: '600', color: COLORS.text, marginBottom: 3 },
  progNameActive: { color: COLORS.accent },
  progMeta:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badge:          { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, backgroundColor: COLORS.surfaceHigh, borderWidth: 0.5, borderColor: COLORS.border },
  badgeTxt:       { fontSize: 8, color: COLORS.textFaint, fontWeight: '500' },
  progNums:       { fontSize: 9, color: COLORS.textFaint, flex: 1 },
  diatHeader:     { fontSize: 11, fontWeight: '600', color: COLORS.accent, padding: SPACE.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  diatSubhead:    { fontSize: 10, fontWeight: '500', color: COLORS.textMuted, paddingHorizontal: SPACE.md, paddingTop: SPACE.md, paddingBottom: SPACE.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  diatRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diatNum:        { fontSize: 16, fontWeight: '700', color: COLORS.textMuted, width: 30 },
  addBtn:         { margin: SPACE.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.accent, paddingVertical: 9, alignItems: 'center', backgroundColor: COLORS.accentLight },
  addBtnTxt:      { fontSize: 13, fontWeight: '600', color: COLORS.accent },
  customEmpty:    { fontSize: 12, color: COLORS.textFaint, padding: SPACE.lg, textAlign: 'center', lineHeight: 20 },
  customItem:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: SPACE.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 6 },
  customItemNum:  { fontSize: 13, fontWeight: '700', color: COLORS.accent, width: 28 },
  customItemName: { fontSize: 11, color: COLORS.text, flex: 1 },
  removeBtn:      { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  removeTxt:      { fontSize: 9, color: COLORS.textMuted },
  right:          { flex: 1 },
  activeCard:     { margin: SPACE.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.accent, padding: SPACE.md, alignItems: 'center' },
  activeNum:      { fontSize: 12, fontWeight: '600', color: COLORS.accent, letterSpacing: 1, marginBottom: 2 },
  activeName:     { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  activeIntervals:{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 0.3 },
  fbWrap:         { backgroundColor: COLORS.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, paddingVertical: SPACE.sm, marginBottom: SPACE.md, alignItems: 'center' },
  ctrlRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.md, gap: 8, marginBottom: SPACE.sm },
  navBtn:         { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  navTxt:         { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  playBtn:        { flex: 1, paddingVertical: 9, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: 'center' },
  playBtnOn:      { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  playTxt:        { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  playTxtOn:      { color: '#fff' },
  dots:           { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: SPACE.lg, flexWrap: 'wrap', paddingHorizontal: SPACE.md },
  dot:            { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border },
  dotActive:      { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  secLabel:       { fontSize: 10, fontWeight: '500', color: COLORS.textMuted, letterSpacing: 0.7, textTransform: 'uppercase', paddingHorizontal: SPACE.md, marginBottom: SPACE.sm },
  boxRow:         { paddingHorizontal: SPACE.md, gap: 8, paddingBottom: SPACE.md },
  miniBox:        { alignItems: 'center', padding: 7, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, minWidth: 70 },
  miniBoxActive:  { borderColor: '#E8D44D', backgroundColor: COLORS.surfaceHigh },
  miniNum:        { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginBottom: 3 },
  miniNumActive:  { color: '#E8D44D' },
  miniName:       { fontSize: 8, color: COLORS.textFaint, marginTop: 1 },
  miniNameActive: { color: COLORS.textMuted },
  descCard:       { marginHorizontal: SPACE.md, marginBottom: SPACE.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACE.md, borderWidth: 1, borderColor: COLORS.border },
  descTitle:      { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 3 },
  descTxt:        { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACE.xxl },
  emptyTxt:       { fontSize: 13, color: COLORS.textFaint, textAlign: 'center', lineHeight: 20 },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard:      { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingBottom: 30 },
  modalHdr:       { flexDirection: 'row', alignItems: 'center', padding: SPACE.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle:     { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.text },
  modalClose:     { fontSize: 14, color: COLORS.accent, fontWeight: '600', padding: 4 },
  modalSec:       { fontSize: 10, fontWeight: '500', color: COLORS.textMuted, letterSpacing: 0.7, textTransform: 'uppercase', paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg, paddingBottom: SPACE.sm },
  modalItem:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: SPACE.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10 },
  modalNum:       { fontSize: 14, fontWeight: '700', color: COLORS.accent, width: 32 },
  modalName:      { fontSize: 13, fontWeight: '600', color: COLORS.text, width: 120 },
  modalIntervals: { fontSize: 10, color: COLORS.textFaint, flex: 1 },
});
