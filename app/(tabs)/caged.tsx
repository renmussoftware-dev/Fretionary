import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACE, RADIUS } from '../../src/constants/theme';
import { NOTES, NOTE_DISPLAY, CAGED_ORDER, CAGED_SHAPES, CAGED_COLORS } from '../../src/constants/music';
import { useStore } from '../../src/store/useStore';
import { getCagedCaretFret } from '../../src/utils/theory';

const CAGED_DESCRIPTION = `The CAGED system maps the entire guitar neck using 5 repeating chord shapes based on the open C, A, G, E, and D chord forms.

Each shape connects to the next — the cycle never stops. Once you know all 5, you can play any chord or scale anywhere on the neck.`;

const SHAPE_TIPS: Record<string, string[]> = {
  C: ['Root on B string (2nd string)', 'Often used in upper fret positions', 'Common in country and folk styles', 'Connects to A shape above it'],
  A: ['Root on G string (3rd string)', 'Classic barre chord shape', 'Works great for power chord extensions', 'Connects to G shape above it'],
  G: ['Root on low E string (6th string)', 'Widest shape — spans 4+ frets', 'Common in open position rock', 'Connects to E shape above it'],
  E: ['Root on low E AND high e strings', 'Most common barre chord shape', 'Foundation of rock guitar', 'Connects to D shape above it'],
  D: ['Root on high e string (1st string)', 'Great for melodic lead work', 'Often overlooked but very useful', 'Connects to C shape above it'],
};

export default function CagedScreen() {
  const { root, setRoot, setMode, setActiveCaged } = useStore();
  const [activeShape, setActiveShape] = useState<string>('E');

  const shape = CAGED_SHAPES[activeShape];
  const caretFret = getCagedCaretFret(root, activeShape as any);
  const col = CAGED_COLORS[activeShape];

  function goToFretboard(shape: string) {
    setMode('caged');
    setActiveCaged(shape);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>CAGED System</Text>
          <Text style={styles.subtitle}>{CAGED_DESCRIPTION}</Text>

          {/* Root selector */}
          <Text style={styles.label}>Key</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.noteRow}>
            {NOTES.map((note, i) => (
              <TouchableOpacity key={note} onPress={() => setRoot(i)}
                style={[styles.notePill, root === i && styles.notePillActive]} activeOpacity={0.7}>
                <Text style={[styles.noteText, root === i && styles.noteTextActive]}>
                  {NOTE_DISPLAY[note] || note}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Shape selector */}
        <View style={styles.shapeRow}>
          {CAGED_ORDER.map(s => {
            const c = CAGED_COLORS[s];
            const active = s === activeShape;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setActiveShape(s)}
                style={[styles.shapeBtn, active && { backgroundColor: c.fill, borderColor: c.fill }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.shapeLetter, active && styles.shapeLetterActive]}>{s}</Text>
                <Text style={[styles.shapeWord, active && styles.shapeWordActive]}>shape</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active shape detail */}
        <View style={[styles.detailCard, { borderLeftColor: col.fill, borderLeftWidth: 3 }]}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailTitle}>{shape.name}</Text>
              <Text style={styles.detailSub}>Based on open {shape.openShape} chord</Text>
            </View>
            <View style={[styles.caretBadge, { backgroundColor: col.fill }]}>
              <Text style={styles.caretText}>Caret fret {caretFret || 'open'}</Text>
            </View>
          </View>
          <Text style={styles.detailDesc}>{shape.description}</Text>

          <View style={styles.tipsList}>
            {SHAPE_TIPS[activeShape]?.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={[styles.tipDot, { backgroundColor: col.fill }]} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.viewBtn, { borderColor: col.fill }]}
            onPress={() => goToFretboard(activeShape)}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewBtnText, { color: col.fill }]}>
              View {activeShape} shape on fretboard →
            </Text>
          </TouchableOpacity>
        </View>

        {/* CAGED cycle diagram */}
        <View style={styles.cycleSection}>
          <Text style={styles.cycleTitle}>The CAGED cycle</Text>
          <Text style={styles.cycleSubtitle}>Shapes repeat every 12 frets</Text>
          <View style={styles.cycleRow}>
            {CAGED_ORDER.map((s, i) => {
              const c = CAGED_COLORS[s];
              const cf = getCagedCaretFret(root, s as any);
              return (
                <React.Fragment key={s}>
                  <View style={[styles.cycleShape, { backgroundColor: c.light, borderColor: c.fill }]}>
                    <Text style={[styles.cycleLetter, { color: c.fill }]}>{s}</Text>
                    <Text style={[styles.cycleFret, { color: c.fill }]}>fr {cf}</Text>
                  </View>
                  {i < CAGED_ORDER.length - 1 && (
                    <Text style={styles.cycleArrow}>→</Text>
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        <View style={{ height: SPACE.xxl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    padding: SPACE.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, lineHeight: 20, marginBottom: SPACE.lg },
  label: { fontSize: 11, fontWeight: '500', color: COLORS.textMuted, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: SPACE.xs },
  noteRow: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  notePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  notePillActive: { backgroundColor: '#E8D44D', borderColor: '#C4A800' },
  noteText: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  noteTextActive: { color: '#5C4400' },

  shapeRow: { flexDirection: 'row', padding: SPACE.lg, gap: 8 },
  shapeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  shapeLetter: { fontSize: 20, fontWeight: '700', color: COLORS.textMuted },
  shapeLetterActive: { color: '#fff' },
  shapeWord: { fontSize: 9, color: COLORS.textFaint, marginTop: 2 },
  shapeWordActive: { color: 'rgba(255,255,255,0.7)' },

  detailCard: {
    marginHorizontal: SPACE.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACE.lg,
    marginBottom: SPACE.lg,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACE.sm },
  detailTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  detailSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  caretBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  caretText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  detailDesc: { fontSize: 13, color: COLORS.textMuted, marginBottom: SPACE.lg, lineHeight: 19 },

  tipsList: { gap: 8, marginBottom: SPACE.lg },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3 },
  tipText: { fontSize: 13, color: COLORS.text, flex: 1 },

  viewBtn: {
    borderWidth: 1, borderRadius: RADIUS.md,
    paddingVertical: 10, alignItems: 'center',
  },
  viewBtnText: { fontSize: 13, fontWeight: '600' },

  cycleSection: { marginHorizontal: SPACE.lg, marginBottom: SPACE.lg },
  cycleTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  cycleSubtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACE.md },
  cycleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  cycleShape: {
    alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: RADIUS.md, borderWidth: 1,
  },
  cycleLetter: { fontSize: 18, fontWeight: '700' },
  cycleFret: { fontSize: 10, fontWeight: '500', marginTop: 2 },
  cycleArrow: { fontSize: 16, color: COLORS.textFaint },
});
