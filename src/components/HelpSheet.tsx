import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, FONT_FAMILY, RADIUS, SPACE } from '../constants/theme';

// Which tab's help content to show. Each key maps to a curated short-form
// summary — "how to use this screen" in 4-6 bullets. The full walkthrough
// lives in Tools → Guide; this sheet is deliberately terse so users can
// orient without leaving what they're doing.
export type HelpTab = 'fretboard' | 'chords' | 'progressions' | 'practice';

interface Section {
  title: string;
  bullets: string[];
}

interface Content {
  headline: string;
  sub: string;
  sections: Section[];
}

const CONTENT: Record<HelpTab, Content> = {
  fretboard: {
    headline: 'Fretboard',
    sub: 'The interactive neck — every scale, chord and CAGED shape everywhere in every key.',
    sections: [
      {
        title: 'Switch what you’re looking at',
        bullets: [
          'Tap the top tabs to switch between Scales, Chords, CAGED, and Identify.',
          'The row of note pills below sets your root note (key).',
        ],
      },
      {
        title: 'Play + explore',
        bullets: [
          'In Scales mode, tap "▶ Hear scale" to play the current scale — pick a speed and All / Single highlight.',
          'In CAGED mode, pick one of the 5 shapes to see where it sits on the neck plus a reference chord diagram.',
          'Change the tuning via the top-right TUNING pill.',
        ],
      },
      {
        title: 'Tune the display',
        bullets: [
          '"Label size" controls how big the note letters inside the dots are.',
          '"Fret range" zooms into just part of the neck (0–5, 5–12, etc.) — great for focusing on one position.',
          'Tap the ♥ icon to save what you’re looking at; access saved items via the same icon.',
        ],
      },
    ],
  },

  chords: {
    headline: 'Chord Library',
    sub: 'Every chord type, real fingering diagrams, multiple voicings up the neck.',
    sections: [
      {
        title: 'Find a chord',
        bullets: [
          'Filter by category — Triad, Sus, Seventh, Extended, or All.',
          'Tap the drawer handle on the left to open the chord list.',
          'Change the root note using the pills at the top.',
        ],
      },
      {
        title: 'Use the diagram',
        bullets: [
          'Swipe or use the arrows below the diagram to step through voicings up the neck.',
          'The "▶ Play chord" button plays the chord through your speakers.',
          'Resolution suggestions below show where this chord commonly moves next.',
        ],
      },
    ],
  },

  progressions: {
    headline: 'Progressions',
    sub: '22 common progressions across genres, plus diatonic and custom builders.',
    sections: [
      {
        title: 'Pick a mode',
        bullets: [
          'Common: browse 22 famous progressions (I–V–vi–IV, 12-bar blues, etc.).',
          'Diatonic: pick a key and see all 7 chords that belong to it.',
          'Custom: build your own sequence from scratch.',
          'Examples: real songs mapped to their progression.',
        ],
      },
      {
        title: 'Play it back',
        bullets: [
          'Adjust the BPM at the top-right to change tempo.',
          'The "▶" button loops the progression with auto-strumming.',
          'Tap any chord in the strip to skip to that beat.',
        ],
      },
    ],
  },

  practice: {
    headline: 'Practice',
    sub: 'Interactive drills to sharpen your fretboard knowledge.',
    sections: [
      {
        title: 'Three drill types',
        bullets: [
          'Name the Note: a fret lights up — pick the right note name.',
          'Find the Note: given a note, tap every place it appears on the neck.',
          'String Drill: master one string at a time.',
        ],
      },
      {
        title: 'Difficulty',
        bullets: [
          'Beginner: frets 0–5, naturals only, no timer.',
          'Intermediate: full neck to fret 12, all 12 pitches, no timer.',
          'Advanced: full neck, all 12 pitches, 60-second timer.',
        ],
      },
    ],
  },
};

interface Props {
  visible: boolean;
  onClose: () => void;
  tab: HelpTab;
}

/**
 * Bottom-sheet modal opened by the "?" icon at the top of each tab. Shows
 * a short, tab-specific "how to use this" cheat sheet. Deliberately terse
 * — the full walkthrough lives in Tools → Guide, linked from the footer of
 * this sheet.
 */
export default function HelpSheet({ visible, onClose, tab }: Props) {
  const content = CONTENT[tab];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>HOW TO USE</Text>
              <Text style={styles.title}>{content.headline}</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.close}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <Text style={styles.sub}>{content.sub}</Text>

            {content.sections.map(section => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.bullets.map((b, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bullet}>{'•'}</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}

            <TouchableOpacity
              onPress={() => { onClose(); router.push('/(tabs)/tools'); }}
              activeOpacity={0.7}
              style={styles.guideBtn}
            >
              <Text style={styles.guideBtnText}>Open the full Guide →</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.bgElevated,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '85%', paddingBottom: 30,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg, paddingBottom: SPACE.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: SPACE.sm,
  },
  eyebrow: {
    fontSize: 10, fontWeight: '700', color: COLORS.textFaint,
    letterSpacing: 1.5, fontFamily: FONT_FAMILY.mono, marginBottom: 2,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  close: { fontSize: 14, color: COLORS.accent, fontWeight: '600', padding: 4 },

  body: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, paddingBottom: SPACE.lg },
  sub: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19, marginBottom: SPACE.lg },

  section: { marginBottom: SPACE.lg },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: SPACE.sm,
  },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 6, paddingRight: SPACE.sm },
  bullet: { fontSize: 13, color: COLORS.accent, fontWeight: '700', lineHeight: 20 },
  bulletText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 20 },

  guideBtn: {
    marginTop: SPACE.md,
    paddingVertical: 12, paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
  },
  guideBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
});
