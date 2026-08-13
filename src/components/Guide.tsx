import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS, SPACE } from '../constants/theme';
import { useProGate } from '../hooks/useProGate';

interface FeatureRow {
  name: string;
  desc: string;
  badge?: 'free' | 'pro' | 'mixed';
}

interface Section {
  title: string;
  intro?: string;
  features: FeatureRow[];
  navTo?: string;
  navLabel?: string;
}

const SECTIONS: Section[] = [
  {
    title: 'Fretboard',
    intro: 'The interactive neck — switch between scales, chords, CAGED and Identify views. Color-coded by interval (root / 3rd / 5th / extension).',
    navTo: '/',
    navLabel: 'Open Fretboard',
    features: [
      { name: 'Scales mode',     desc: '14 scales — Major, modes, pentatonics, blues, harmonic/melodic minor, whole-tone, diminished.', badge: 'mixed' },
      { name: 'Chords mode',     desc: 'Light up any of 42 chord types across the entire neck.', badge: 'mixed' },
      { name: 'CAGED mode',      desc: 'See where each of the 5 CAGED shapes lives for any key — with shape detail, caret-fret indicator, and pedagogical tips.', badge: 'mixed' },
      { name: 'Identify mode',   desc: 'Tap notes on the neck and the app names what you built — including partial voicings like no-5 and rootless chords.', badge: 'pro' },
      { name: 'Daily Pick',      desc: 'A new scale or chord to explore every day, with streak tracking.', badge: 'mixed' },
      { name: 'Position lock',   desc: 'Filter the fretboard to a single 5-fret position (Pos 1–5), aligned with the CAGED shapes.', badge: 'pro' },
      { name: 'Labels & range',  desc: 'Note name, degree, interval or no labels; three label sizes; fret windows from 0–5 up to a full 24-fret neck.', badge: 'free' },
    ],
  },
  {
    title: 'Chord Library',
    intro: 'Browse all 42 chord types with real diagrams, multiple voicings up the neck, and pedagogical resolution suggestions.',
    navTo: '/chords',
    navLabel: 'Open Chord Library',
    features: [
      { name: 'Chord diagrams',         desc: 'Full box diagrams with multiple voicings — swipe to step through positions.', badge: 'mixed' },
      { name: 'Resolution suggestions', desc: 'Each chord shows where it commonly resolves to with the voice-leading reason.', badge: 'free' },
      { name: 'Tap to hear',            desc: 'Tap any chord to play it through your speakers.', badge: 'free' },
    ],
  },
  {
    title: 'Progressions',
    intro: 'Learn and play 64 progressions across 16 genres, plus 18 song-based examples, diatonic sequences, or your own.',
    navTo: '/progressions',
    navLabel: 'Open Progressions',
    features: [
      { name: 'Common progressions', desc: '64 progressions — pop, rock, jazz, blues, Latin, Motown, gospel, classical, reggae and more.', badge: 'mixed' },
      { name: 'Diatonic builder',    desc: 'Pick any key and see all 7 diatonic chords.', badge: 'free' },
      { name: 'Custom builder',      desc: 'Stack your own chord sequence.', badge: 'free' },
      { name: 'Audio playback',      desc: 'Play progressions back at any BPM with auto-strumming.', badge: 'pro' },
    ],
  },
  {
    title: 'Maps',
    intro: 'Design your own fretboard diagrams under Tools → Maps — tap notes anywhere on the neck, color them, and share the result.',
    features: [
      { name: 'Diagram builder', desc: 'Tap to place notes in any of 8 colors. Start blank or seed from any scale or chord and edit from there.', badge: 'pro' },
      { name: 'My Maps',         desc: 'Save named diagrams and reload them any time.', badge: 'pro' },
      { name: 'PDF export',      desc: 'Share any map as a clean print-ready PDF — lesson handouts, licks, voicings.', badge: 'pro' },
    ],
  },
  {
    title: 'Practice',
    intro: 'Sharpen your fretboard knowledge with interactive drills.',
    navTo: '/practice',
    navLabel: 'Open Practice',
    features: [
      { name: 'Name the Note', desc: 'A fret lights up — pick the right note from 7 (or 12) options.', badge: 'mixed' },
      { name: 'Find the Note', desc: 'Show me a target note — tap every position of it on the neck.', badge: 'pro' },
      { name: 'String Drill',  desc: 'Master one string at a time. Random fret positions, name the note.', badge: 'pro' },
      { name: 'Difficulty levels', desc: 'Beginner (frets 0–5, naturals), Intermediate (full neck, all 12), Advanced (timed).', badge: 'mixed' },
    ],
  },
  {
    title: 'Progress & Metronome',
    intro: 'Both live here on the Tools tab.',
    features: [
      { name: 'Progress',  desc: 'Daily streak, plus counters for scales explored, chords learned, and progressions played.', badge: 'free' },
      { name: 'Metronome', desc: 'BPM 40–240, six time signatures, accent + offbeat clicks, tap-tempo. Drift-corrected.', badge: 'free' },
    ],
  },
  {
    title: 'Tunings',
    intro: 'Switch the fretboard to alternate tunings via the picker on the Fretboard tab.',
    features: [
      { name: 'Standard',        desc: 'E A D G B E — the universal default.', badge: 'free' },
      { name: 'Drop D',          desc: 'D A D G B E — heavy riffs and easy power chords.', badge: 'free' },
      { name: '7 more tunings',  desc: 'Drop C, DADGAD, Open D / G / E, Eb Standard, D Standard.', badge: 'pro' },
    ],
  },
  {
    title: 'Saved',
    intro: 'Tap the heart on any chord, scale or progression to save it. Recents are auto-tracked. Access via the ♥ button on every tab.',
    features: [
      { name: 'Favorites', desc: 'Pin combos you keep coming back to.', badge: 'free' },
      { name: 'Recents',   desc: 'Last 20 chords / scales / progressions you selected.', badge: 'free' },
    ],
  },
];

function Badge({ kind }: { kind: 'free' | 'pro' | 'mixed' }) {
  if (kind === 'free') {
    return <View style={[styles.badge, styles.badgeFree]}><Text style={styles.badgeFreeText}>FREE</Text></View>;
  }
  if (kind === 'pro') {
    return <View style={[styles.badge, styles.badgePro]}><Text style={styles.badgeProText}>🔒 PRO</Text></View>;
  }
  return <View style={[styles.badge, styles.badgeMixed]}><Text style={styles.badgeMixedText}>FREE + PRO</Text></View>;
}

export default function Guide() {
  const { isPro } = useProGate();

  return (
    <View style={styles.wrap}>
      <View style={styles.intro}>
        <Text style={styles.welcome}>Welcome to Fretionary</Text>
        <Text style={styles.welcomeSub}>
          The fretboard dictionary. Every scale, chord, and progression — everywhere on the neck.
        </Text>
        {!isPro && (
          <View style={styles.proHint}>
            <Text style={styles.proHintText}>
              You{'\u2019'}re on the <Text style={{ fontWeight: '700' }}>Free</Text> plan. Items marked
              {' '}<Text style={{ color: '#E8D44D', fontWeight: '700' }}>🔒 PRO</Text>{' '}
              unlock with a subscription.
            </Text>
            <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.85} style={styles.proCta}>
              <Text style={styles.proCtaText}>Unlock Pro →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {SECTIONS.map(section => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.intro && <Text style={styles.sectionIntro}>{section.intro}</Text>}

          {section.features.map(f => (
            <View key={f.name} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowName}>{f.name}</Text>
                {f.badge && <Badge kind={f.badge} />}
              </View>
              <Text style={styles.rowDesc}>{f.desc}</Text>
            </View>
          ))}

          {section.navTo && (
            <TouchableOpacity
              onPress={() => router.push(section.navTo as any)}
              activeOpacity={0.7}
              style={styles.navBtn}
            >
              <Text style={styles.navBtnText}>{section.navLabel} →</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, paddingBottom: SPACE.xl },

  intro: { marginBottom: SPACE.xl },
  welcome: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  welcomeSub: { fontSize: 14, color: COLORS.textMuted, lineHeight: 21 },

  proHint: {
    marginTop: SPACE.md,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(83,74,183,0.10)',
    borderWidth: 1, borderColor: 'rgba(83,74,183,0.3)',
  },
  proHintText: { fontSize: 13, color: COLORS.text, lineHeight: 19, marginBottom: 8 },
  proCta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
  },
  proCtaText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  section: {
    marginBottom: SPACE.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACE.lg,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  sectionIntro: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19, marginBottom: SPACE.md },

  row: {
    paddingVertical: SPACE.sm,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  rowName: { fontSize: 13, fontWeight: '600', color: COLORS.text, flexShrink: 1 },
  rowDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },

  badge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginLeft: 'auto',
  },
  badgeFree: { backgroundColor: 'rgba(29,158,117,0.18)', borderWidth: 1, borderColor: '#1D9E75' },
  badgeFreeText: { fontSize: 9, fontWeight: '800', color: '#1D9E75', letterSpacing: 0.4 },
  badgePro: { backgroundColor: 'rgba(232,212,77,0.15)', borderWidth: 1, borderColor: '#C4A800' },
  badgeProText: { fontSize: 9, fontWeight: '800', color: '#E8D44D', letterSpacing: 0.4 },
  badgeMixed: { backgroundColor: 'rgba(110,96,217,0.18)', borderWidth: 1, borderColor: '#6E60D9' },
  badgeMixedText: { fontSize: 9, fontWeight: '800', color: '#837AB7', letterSpacing: 0.4 },

  navBtn: {
    marginTop: SPACE.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
  },
  navBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
});
