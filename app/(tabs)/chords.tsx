import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Pressable, useWindowDimensions, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChordBox from '../../src/components/ChordBox';
import { COLORS, SPACE, RADIUS } from '../../src/constants/theme';
import { NOTES, NOTE_DISPLAY, CHORDS } from '../../src/constants/music';
import { useStore } from '../../src/store/useStore';
import { useAudioEngine } from '../../src/hooks/useAudioEngine';
import { useProGate } from '../../src/hooks/useProGate';
import { ProBanner } from '../../src/components/ProLock';
import { isChordFree } from '../../src/constants/subscription';
import { getChordVoicings } from '../../src/utils/theory';

const CATEGORIES = ['All', 'Triads', 'Seventh', 'Extended', 'Sus'];
const CAT_MAP: Record<string, string> = {
  'Triads': 'triad', 'Seventh': 'seventh', 'Extended': 'extended', 'Sus': 'sus',
};
const DRAWER_W = 220;

export default function ChordsScreen() {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const isTablet = screenW >= 768;
  const { root, setRoot } = useStore();
  const { isPro, requirePro } = useProGate();
  const { playChord } = useAudioEngine();
  const [category, setCategory] = useState('All');
  const [selectedChord, setSelectedChord] = useState('Major');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const scrimAnim = useRef(new Animated.Value(0)).current;

  // Draggable toggle pill
  const [pillY, setPillY] = useState(0.4);  // fraction of screen height
  const pillDragY = useRef(0);
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
    onPanResponderGrant: (_, gs) => {
      pillDragY.current = 0;
    },
    onPanResponderMove: (_, gs) => {
      pillDragY.current = gs.dy;
    },
    onPanResponderRelease: (_, gs) => {
      setPillY(prev => {
        const newFrac = prev + gs.dy / screenH;
        return Math.max(0.1, Math.min(0.85, newFrac));
      });
      pillDragY.current = 0;
    },
  })).current;

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

  function toggleDrawer() { drawerOpen ? closeDrawer() : openDrawer(); }

  function changeCategory(cat: string) {
    const filtered = Object.entries(CHORDS).filter(([, ch]) =>
      cat === 'All' || ch.category === CAT_MAP[cat]
    );
    setCategory(cat);
    if (filtered.length > 0) setSelectedChord(filtered[0][0]);
    openDrawer();
  }

  function selectChord(key: string) {
    if (!isChordFree(key)) {
      requirePro(() => {
        setSelectedChord(key);
        closeDrawer();
        const voicings = getChordVoicings(root, key);
        if (voicings.length > 0) playChord(voicings[0].frets);
      });
      return;
    }
    setSelectedChord(key);
    closeDrawer();
    const voicings = getChordVoicings(root, key);
    if (voicings.length > 0) playChord(voicings[0].frets);
  }

  const filteredChords = Object.entries(CHORDS).filter(([, ch]) =>
    category === 'All' || ch.category === CAT_MAP[category]
  );

  const drawerX = drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [-DRAWER_W, 0] });
  const toggleX = drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, DRAWER_W] });

  const chord = CHORDS[selectedChord];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chord Library</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.noteRow}>
          {NOTES.map((note, i) => (
            <TouchableOpacity key={note} onPress={() => {
                setRoot(i);
                const voicings = getChordVoicings(i, selectedChord);
                if (voicings.length > 0) playChord(voicings[0].frets);
              }}
              style={[styles.notePill, root === i && styles.notePillActive]} activeOpacity={0.7}>
              <Text style={[styles.noteText, root === i && styles.noteTextActive]}>{NOTE_DISPLAY[note] || note}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} onPress={() => changeCategory(cat)}
              style={[styles.catPill, category === cat && styles.catPillActive]} activeOpacity={0.7}>
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main content */}
      <View style={styles.body}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailContent}
        >
          {/* Chord name + description */}
          <Text style={[styles.diagramTitle, isTablet && styles.diagramTitleTablet]}>
            {NOTES[root]} {selectedChord}
          </Text>
          <Text style={[styles.diagramDesc, isTablet && styles.diagramDescTablet]}>
            {chord?.description}
          </Text>

          {/* Chord diagram — centered, large */}
          <View style={styles.boxWrap}>
            <ChordBox root={root} chordKey={selectedChord} />
          </View>

          {/* Interval pills — centered */}
          <View style={styles.intervalsWrap}>
            {chord?.intervalNames.map((name, i) => (
              <View key={i} style={[
                styles.intervalBadge,
                isTablet && styles.intervalBadgeTablet,
                i === 0 && styles.rootBadge,
              ]}>
                <Text style={[
                  styles.intervalText,
                  isTablet && styles.intervalTextTablet,
                  i === 0 && styles.rootText,
                ]}>{name}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.intervalLabel}>Interval structure</Text>

          {/* Chord description card */}
          {chord && (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardLabel}>ABOUT THIS CHORD</Text>
              <Text style={styles.infoCardText}>{chord.description}</Text>
              <View style={styles.infoCardIntervals}>
                {chord.intervalNames.map((name, i) => (
                  <View key={i} style={styles.infoInterval}>
                    <Text style={styles.infoIntervalName}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Scrim */}
        {drawerOpen && (
          <Animated.View style={[styles.scrim, { opacity: scrimAnim }]} pointerEvents="auto">
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
          </Animated.View>
        )}

        {/* Drawer */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerX }] }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {!isPro && <ProBanner />}
            {filteredChords.map(([key, ch]) => {
              const locked = !isPro && !isChordFree(key);
              return (
                <TouchableOpacity key={key} onPress={() => selectChord(key)}
                  style={[styles.chordItem, selectedChord === key && styles.chordItemActive, locked && { opacity: 0.5 }]}
                  activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.chordName, selectedChord === key && styles.chordNameActive]} numberOfLines={1}>
                      {NOTES[root]} {key}
                    </Text>
                    <Text style={styles.chordIntervals} numberOfLines={1}>{ch.intervalNames.join(' · ')}</Text>
                  </View>
                  {locked && <Text style={{ fontSize: 12, marginRight: 4 }}>🔒</Text>}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>

        {/* Toggle pill — draggable vertically */}
        <Animated.View style={[
          styles.toggleWrap,
          { top: `${pillY * 100}%`, transform: [{ translateX: toggleX }] },
        ]}>
          <View {...panResponder.panHandlers}>
            <TouchableOpacity onPress={toggleDrawer} style={styles.togglePill} activeOpacity={0.8}>
              <Text style={styles.toggleDragHint}>⋮</Text>
              <Text style={styles.toggleArrow}>{drawerOpen ? '‹' : '›'}</Text>
              <Text style={styles.toggleLabel}>LIST</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.bg },
  header:       { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingTop: SPACE.md, paddingBottom: SPACE.md, gap: SPACE.sm },
  title:        { fontSize: 18, fontWeight: '700', color: COLORS.text, paddingHorizontal: SPACE.lg, marginBottom: 2 },
  noteRow:      { flexDirection: 'row', paddingHorizontal: SPACE.lg, gap: 6 },
  notePill:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  notePillActive: { backgroundColor: '#E8D44D', borderColor: '#C4A800' },
  noteText:     { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  noteTextActive: { color: '#5C4400' },
  catRow:       { flexDirection: 'row', paddingHorizontal: SPACE.lg, gap: 6 },
  catPill:      { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  catPillActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  catText:      { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  catTextActive: { color: '#fff' },

  body:              { flex: 1, overflow: 'hidden' },
  detailContent:     { alignItems: 'center', paddingTop: SPACE.xxl, paddingHorizontal: SPACE.xl },

  diagramTitle:      { fontSize: 32, fontWeight: '700', color: COLORS.text, marginBottom: 6, textAlign: 'center' },
  diagramTitleTablet:{ fontSize: 48 },
  diagramDesc:       { fontSize: 15, color: COLORS.textMuted, marginBottom: SPACE.xl, textAlign: 'center' },
  diagramDescTablet: { fontSize: 20 },

  boxWrap:      { alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.xl },

  intervalsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 8 },
  intervalBadge:    { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border },
  intervalBadgeTablet: { paddingHorizontal: 22, paddingVertical: 12 },
  rootBadge:        { backgroundColor: '#E8D44D', borderColor: '#C4A800' },
  intervalText:     { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  intervalTextTablet: { fontSize: 22 },
  rootText:         { color: '#5C4400' },
  intervalLabel:    { fontSize: 12, color: COLORS.textFaint, letterSpacing: 0.5, marginBottom: SPACE.xl },

  infoCard:         { width: '100%', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACE.lg, marginTop: SPACE.sm },
  infoCardLabel:    { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: SPACE.sm },
  infoCardText:     { fontSize: 15, color: COLORS.text, lineHeight: 22, marginBottom: SPACE.md },
  infoCardIntervals:{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  infoInterval:     { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  infoIntervalName: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },

  scrim:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 10 },
  drawer:       { position: 'absolute', left: 0, top: 0, bottom: 0, width: DRAWER_W, backgroundColor: COLORS.surface, borderRightWidth: 1, borderRightColor: COLORS.border, zIndex: 20 },
  chordItem:    { paddingVertical: 12, paddingHorizontal: SPACE.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chordItemActive: { backgroundColor: COLORS.surfaceHigh },
  chordName:    { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  chordNameActive: { color: COLORS.accent },
  chordIntervals: { fontSize: 11, color: COLORS.textMuted },

  toggleWrap:   { position: 'absolute', left: 0, zIndex: 30, marginTop: -40 },
  togglePill:   { backgroundColor: COLORS.surfaceHigh, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderWidth: 1, borderLeftWidth: 0, borderColor: COLORS.borderLight, paddingVertical: 10, paddingLeft: 4, paddingRight: 10, alignItems: 'center', gap: 2 },
  toggleDragHint: { fontSize: 12, color: COLORS.textFaint, lineHeight: 14 },
  toggleArrow:  { fontSize: 16, color: COLORS.text, fontWeight: '600', lineHeight: 18 },
  toggleLabel:  { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2 },
});
