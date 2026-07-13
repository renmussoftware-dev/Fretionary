import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_FAMILY, RADIUS, SPACE } from '../../src/constants/theme';
import Metronome from '../../src/components/Metronome';
import Guide from '../../src/components/Guide';
import { SUPPORT_EMAIL, openSupportEmail, requestInlineReview, openStoreReview } from '../../src/utils/support';

type ToolMode = 'guide' | 'metronome' | 'support';

const TOOLS: { mode: ToolMode; label: string; sub: string }[] = [
  { mode: 'guide',     label: 'Guide',     sub: 'Features & what\u2019s free' },
  { mode: 'metronome', label: 'Metronome', sub: 'BPM & time sig' },
  { mode: 'support',   label: 'Support',   sub: 'Bugs & feedback' },
];

function Support() {
  return (
    <View style={{ gap: SPACE.lg }}>
      <View style={styles.supportWrap}>
        <Text style={styles.supportEmoji}>\ud83d\udee0\ufe0f</Text>
        <Text style={styles.supportTitle}>Need help?</Text>
        <Text style={styles.supportDesc}>
          Found a bug, stuck on a feature, or have an idea?{'\n'}We'd love to hear from you.
        </Text>
        <TouchableOpacity style={styles.supportBtn} onPress={openSupportEmail} activeOpacity={0.85}>
          <Text style={styles.supportBtnText}>\u2709  Email Support</Text>
        </TouchableOpacity>
        <Text style={styles.supportEmailAddr}>{SUPPORT_EMAIL}</Text>
        <Text style={styles.supportNote}>
          We auto-include your app version and device info in the message so we can debug faster.
          We typically respond within a day or two.
        </Text>
      </View>

      <View style={styles.supportWrap}>
        <Text style={styles.supportEmoji}>\u2b50\ufe0f</Text>
        <Text style={styles.supportTitle}>Enjoying Fretionary?</Text>
        <Text style={styles.supportDesc}>
          A rating helps other guitarists discover the app{'\n'}\u2014 it only takes a few seconds.
        </Text>
        <TouchableOpacity
          style={styles.supportBtnSecondary}
          onPress={requestInlineReview}
          activeOpacity={0.85}
        >
          <Text style={styles.supportBtnSecondaryText}>Rate Fretionary</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openStoreReview} activeOpacity={0.7} style={styles.supportStoreLink}>
          <Text style={styles.supportStoreLinkText}>or open the store directly \u2192</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ToolsScreen() {
  const [mode, setMode] = useState<ToolMode>('guide');

  let body: React.ReactNode;
  if (mode === 'guide')            body = <Guide />;
  else if (mode === 'support')     body = <Support />;
  else                             body = <Metronome />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Workshop</Text>
          <Text style={styles.title}>Tools</Text>
        </View>
        <View style={styles.tabs}>
          {TOOLS.map(t => (
            <TouchableOpacity
              key={t.mode}
              onPress={() => setMode(t.mode)}
              activeOpacity={0.7}
              style={[styles.tab, mode === t.mode && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === t.mode && styles.tabTextActive]}>
                {t.label}
              </Text>
              <Text style={[styles.tabSub, mode === t.mode && styles.tabSubActive]}>
                {t.sub}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {body}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingTop: SPACE.md, paddingBottom: SPACE.md, paddingHorizontal: SPACE.lg,
    gap: SPACE.md,
  },
  eyebrow: {
    fontSize: 11, fontWeight: '500',
    color: COLORS.textMuted, letterSpacing: 0.4,
    marginBottom: 1,
  },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, letterSpacing: -0.4 },

  tabs: {
    flexDirection: 'row', gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md, padding: 3,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tab: {
    flex: 1, paddingVertical: 8, paddingHorizontal: 6,
    alignItems: 'center', borderRadius: 7,
  },
  tabActive: { backgroundColor: COLORS.surfaceActive },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.1 },
  tabTextActive: { color: COLORS.text },
  tabSub: { fontSize: 9, color: COLORS.textFaint, marginTop: 2 },
  tabSubActive: { color: COLORS.textMuted },

  body: { paddingTop: SPACE.lg },

  supportWrap: {
    margin: SPACE.lg, padding: SPACE.xl, alignItems: 'center',
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  supportEmoji:     { fontSize: 36, marginBottom: SPACE.md },
  supportTitle:     { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: SPACE.sm },
  supportDesc:      {
    fontSize: 14, color: COLORS.textMuted, lineHeight: 20,
    textAlign: 'center', marginBottom: SPACE.lg,
  },
  supportBtn: {
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent, marginBottom: SPACE.md,
  },
  supportBtnText:   { fontSize: 14, fontWeight: '700', color: '#1a1400' },
  supportEmailAddr: {
    fontSize: 13, color: COLORS.textMuted, marginBottom: SPACE.lg,
    fontFamily: FONT_FAMILY.mono, letterSpacing: 0.2,
  },
  supportNote: {
    fontSize: 12, color: COLORS.textFaint, lineHeight: 18,
    textAlign: 'center',
  },
  supportBtnSecondary: {
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.accent, backgroundColor: 'transparent',
    marginBottom: SPACE.sm,
  },
  supportBtnSecondaryText: {
    fontSize: 14, fontWeight: '700', color: COLORS.accent,
  },
  supportStoreLink:     { paddingVertical: 4 },
  supportStoreLinkText: { fontSize: 12, color: COLORS.textMuted },
});
