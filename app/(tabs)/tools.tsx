import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { COLORS, FONT_FAMILY, RADIUS, SPACE } from '../../src/constants/theme';
import Metronome from '../../src/components/Metronome';
import Guide from '../../src/components/Guide';
import { useProGate } from '../../src/hooks/useProGate';

type ToolMode = 'guide' | 'metronome' | 'support';

const TOOLS: { mode: ToolMode; label: string; sub: string }[] = [
  { mode: 'guide',     label: 'Guide',     sub: 'Features & what\u2019s free' },
  { mode: 'metronome', label: 'Metronome', sub: 'BPM & time sig' },
  { mode: 'support',   label: 'Support',   sub: 'Bugs & feedback' },
];

const SUPPORT_EMAIL = 'renmussoftware@gmail.com';

/**
 * Build a mailto: URL with device + app context pre-filled in the body, so
 * bug reports come in already labeled with the version and platform \u2014 saves
 * the back-and-forth of "what version are you on?" The user types their
 * issue above the auto-filled context lines.
 */
function buildSupportMailto(): string {
  const appVersion = Constants.expoConfig?.version ?? 'unknown';
  const platform = Platform.OS;
  const osVersion = String(Platform.Version);
  const subject = 'Fretionary Support';
  const body = [
    '',
    '',
    '\u2014 \u2014 \u2014 \u2014 \u2014 \u2014 \u2014 \u2014 \u2014 \u2014 \u2014',
    'Describe what you were doing and what went wrong above.',
    '',
    `App version: ${appVersion}`,
    `Platform: ${platform} ${osVersion}`,
  ].join('\n');
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function openSupportEmail() {
  const url = buildSupportMailto();
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
      return;
    }
  } catch {
    // fall through to fallback alert
  }
  // No mail app configured \u2014 show the address so the user can copy it.
  Alert.alert(
    'No email app found',
    `Please email us at:\n\n${SUPPORT_EMAIL}\n\nInclude your device and app version if you're reporting a bug.`,
    [{ text: 'OK' }],
  );
}

function Support() {
  return (
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
  );
}

function ProUpsell() {
  return (
    <View style={styles.upsell}>
      <Text style={styles.upsellLock}>🔒</Text>
      <Text style={styles.upsellTitle}>Metronome is Pro</Text>
      <Text style={styles.upsellDesc}>
        Practice in time with a built-in metronome. BPM, time signature, accent beat, and tap-tempo.
      </Text>
      <TouchableOpacity
        style={styles.upsellBtn}
        onPress={() => router.push('/paywall')}
        activeOpacity={0.85}
      >
        <Text style={styles.upsellBtnText}>Unlock Pro →</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ToolsScreen() {
  const { isPro } = useProGate();
  const [mode, setMode] = useState<ToolMode>('guide');

  let body: React.ReactNode;
  if (mode === 'guide')            body = <Guide />;
  else if (mode === 'support')     body = <Support />;
  else if (!isPro)                 body = <ProUpsell />;
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

  upsell: {
    margin: SPACE.lg, padding: SPACE.xl, alignItems: 'center',
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  upsellLock: { fontSize: 36, marginBottom: SPACE.md },
  upsellTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: SPACE.sm },
  upsellDesc: {
    fontSize: 14, color: COLORS.textMuted, lineHeight: 20,
    textAlign: 'center', marginBottom: SPACE.lg,
  },
  upsellBtn: {
    paddingHorizontal: 24, paddingVertical: 11, borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
  },
  upsellBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

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
});
