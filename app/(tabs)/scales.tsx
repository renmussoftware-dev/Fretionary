import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACE, RADIUS } from '../../src/constants/theme';
import { NOTES, NOTE_DISPLAY, SCALES, COLORS as MUSIC_COLORS } from '../../src/constants/music';
import { useStore } from '../../src/store/useStore';
import { getScaleNotes } from '../../src/utils/theory';

const CATEGORIES = ['All', 'Major', 'Minor', 'Pentatonic', 'Modes', 'Other'];
const CAT_MAP: Record<string, string> = {
  'Major': 'major', 'Minor': 'minor', 'Pentatonic': 'pentatonic', 'Modes': 'mode', 'Other': 'other',
};
const DRAWER_W = 190;

export default function ScalesScreen() {
  const { root, setRoot } = useStore();
  const [category, setCategory] = useState('All');
  const [selectedScale, setSelectedScale] = useState('Major');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const scrimAnim = useRef(new Animated.Value(0)).current;

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

  function selectScale(key: string) { setSelectedScale(key); closeDrawer(); }

  const filteredScales = Object.entries(SCALES).filter(([, sc]) =>
    category === 'All' || sc.category === CAT_MAP[category]
  );

  const scaleNotes = getScaleNotes(root, selectedScale);
  const sc = SCALES[selectedScale];

  const drawerX = drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [-DRAWER_W, 0] });
  const toggleX = drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, DRAWER_W] });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Scale Reference</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.noteRow}>
          {NOTES.map((n, i) => (
            <TouchableOpacity key={n} onPress={() => setRoot(i)}
              style={[styles.notePill, root === i && styles.notePillActive]} activeOpacity={0.7}>
              <Text style={[styles.noteText, root === i && styles.noteTextActive]}>{NOTE_DISPLAY[n] || n}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
              style={[styles.catPill, category === cat && styles.catPillActive]} activeOpacity={0.7}>
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.body}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailContent}>
          <Text style={styles.detailTitle}>{NOTES[root]} {selectedScale}</Text>
          <Text style={styles.detailDesc}>{sc?.description}</Text>

          <Text style={styles.subLabel}>Notes</Text>
          <View style={styles.noteGrid}>
            {scaleNotes.map((ni, i) => {
              const intv = (ni - root + 12) % 12;
              // Build semitone offsets from scale steps
              let _cum = 0;
              const _semitones: number[] = [0];
              for (const _s of (sc?.steps ?? [])) { _cum += _s; _semitones.push(_cum % 12); }
              const pos = _semitones.indexOf(intv);
              // Color by scale degree position
              let bg = COLORS.surfaceHigh, border = COLORS.border, noteClr = COLORS.text, degClr = COLORS.textMuted;
              if (ni === root) {
                bg = MUSIC_COLORS.root.fill; border = MUSIC_COLORS.root.stroke;
                noteClr = MUSIC_COLORS.root.text; degClr = '#8B6800';
              } else if (pos === 2) {
                bg = MUSIC_COLORS.third.fill; border = MUSIC_COLORS.third.stroke;
                noteClr = MUSIC_COLORS.third.text; degClr = 'rgba(255,255,255,0.7)';
              } else if (pos === 4) {
                bg = MUSIC_COLORS.fifth.fill; border = MUSIC_COLORS.fifth.stroke;
                noteClr = MUSIC_COLORS.fifth.text; degClr = 'rgba(255,255,255,0.7)';
              } else if (pos >= 6) {
                bg = MUSIC_COLORS.extension.fill; border = MUSIC_COLORS.extension.stroke;
                noteClr = MUSIC_COLORS.extension.text; degClr = 'rgba(255,255,255,0.7)';
              }
              return (
                <View key={i} style={[styles.noteBadge, { backgroundColor: bg, borderColor: border }]}>
                  <Text style={[styles.noteBadgeNote, { color: noteClr }]}>{NOTES[ni]}</Text>
                  <Text style={[styles.noteBadgeDeg, { color: degClr }]}>{sc?.degrees[i]}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.subLabel}>Interval formula</Text>
          <View style={styles.formulaBox}>
            <Text style={styles.formulaText}>{sc?.formula}</Text>
            <Text style={styles.formulaHint}>W = whole step · H = half step</Text>
          </View>

          <Text style={styles.subLabel}>Degrees</Text>
          <View style={styles.degreeRow}>
            {sc?.degrees.map((deg, i) => (
              <View key={i} style={styles.degreeBadge}>
                <Text style={styles.degreeText}>{deg}</Text>
              </View>
            ))}
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>

        {drawerOpen && (
          <Animated.View style={[styles.scrim, { opacity: scrimAnim }]} pointerEvents="auto">
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
          </Animated.View>
        )}

        <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerX }] }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredScales.map(([key]) => (
              <TouchableOpacity key={key} onPress={() => selectScale(key)}
                style={[styles.scaleItem, selectedScale === key && styles.scaleItemActive]} activeOpacity={0.7}>
                <Text style={[styles.scaleName, selectedScale === key && styles.scaleNameActive]}>{key}</Text>
                <Text style={styles.scaleCategory}>{SCALES[key].category}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>

        <Animated.View style={[styles.toggleWrap, { transform: [{ translateX: toggleX }] }]}>
          <TouchableOpacity onPress={() => drawerOpen ? closeDrawer() : openDrawer()} style={styles.togglePill} activeOpacity={0.8}>
            <Text style={styles.toggleArrow}>{drawerOpen ? '‹' : '›'}</Text>
            <Text style={styles.toggleLabel}>LIST</Text>
          </TouchableOpacity>
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

  body:         { flex: 1, overflow: 'hidden' },
  detailContent:{ padding: SPACE.lg },
  detailTitle:  { fontSize: 26, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  detailDesc:   { fontSize: 14, color: COLORS.textMuted, lineHeight: 21, marginBottom: SPACE.xl },
  subLabel:     { fontSize: 10, fontWeight: '500', color: COLORS.textMuted, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: SPACE.sm, marginTop: SPACE.lg },
  noteGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  noteBadge:    { alignItems: 'center', backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border, minWidth: 44 },
  rootBadge:    { backgroundColor: '#E8D44D', borderColor: '#C4A800' },
  noteBadgeNote:{ fontSize: 14, fontWeight: '700', color: COLORS.text },
  rootNote:     { color: '#5C4400' },
  noteBadgeDeg: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  rootDeg:      { color: '#8B6800' },
  formulaBox:   { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, padding: SPACE.md, borderWidth: 1, borderColor: COLORS.border },
  formulaText:  { fontSize: 15, fontWeight: '600', color: COLORS.text, letterSpacing: 2, marginBottom: 6, fontFamily: 'monospace' },
  formulaHint:  { fontSize: 11, color: COLORS.textFaint },
  degreeRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  degreeBadge:  { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border },
  degreeText:   { fontSize: 13, fontWeight: '600', color: COLORS.text },

  scrim:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 10 },
  drawer:       { position: 'absolute', left: 0, top: 0, bottom: 0, width: DRAWER_W, backgroundColor: COLORS.surface, borderRightWidth: 1, borderRightColor: COLORS.border, zIndex: 20 },
  scaleItem:    { paddingVertical: 11, paddingHorizontal: SPACE.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  scaleItemActive: { backgroundColor: COLORS.surfaceHigh },
  scaleName:    { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  scaleNameActive: { color: COLORS.accent },
  scaleCategory:{ fontSize: 10, color: COLORS.textFaint, textTransform: 'capitalize' },

  toggleWrap:   { position: 'absolute', left: 0, top: '40%', zIndex: 30 },
  togglePill:   { backgroundColor: COLORS.surfaceHigh, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderWidth: 1, borderLeftWidth: 0, borderColor: COLORS.borderLight, paddingVertical: 14, paddingLeft: 6, paddingRight: 10, alignItems: 'center', gap: 4 },
  toggleArrow:  { fontSize: 16, color: COLORS.text, fontWeight: '600', lineHeight: 18 },
  toggleLabel:  { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2 },
});
