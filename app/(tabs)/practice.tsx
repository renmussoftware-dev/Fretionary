import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACE } from '../../src/constants/theme';
import Practice from '../../src/components/practice/Practice';
import HelpSheet from '../../src/components/HelpSheet';

export default function PracticeScreen() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Drill</Text>
          <Text style={styles.title}>Practice</Text>
        </View>
        <TouchableOpacity onPress={() => setHelpOpen(true)} activeOpacity={0.7} style={styles.helpBtn}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={styles.helpBtnText}>?</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >
        <Practice />
      </ScrollView>
      <HelpSheet visible={helpOpen} onClose={() => setHelpOpen(false)} tab="practice" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingTop: SPACE.md, paddingBottom: SPACE.md, paddingHorizontal: SPACE.lg,
    gap: SPACE.sm,
  },
  eyebrow: {
    fontSize: 11, fontWeight: '500',
    color: COLORS.textMuted, letterSpacing: 0.4,
    marginBottom: 1,
  },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, letterSpacing: -0.4 },
  helpBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  helpBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.textMuted, lineHeight: 16 },
  body: { paddingBottom: 60 },
});
