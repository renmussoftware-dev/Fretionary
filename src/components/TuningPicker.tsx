import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Pressable,
} from 'react-native';
import { COLORS, RADIUS, SPACE } from '../constants/theme';
import { TUNINGS, getTuning, type Tuning } from '../constants/tunings';
import { useStore } from '../store/useStore';
import { useProGate } from '../hooks/useProGate';
import { isTuningFree } from '../constants/subscription';

interface Props {
  /** When true, the picker is shown but locked to standard (e.g. CAGED mode). */
  forcedStandard?: boolean;
}

export default function TuningPicker({ forcedStandard = false }: Props) {
  const { tuningId, setTuningId } = useStore();
  const { isPro, requirePro } = useProGate();
  const [open, setOpen] = useState(false);

  const displayTuning = forcedStandard ? getTuning('standard') : getTuning(tuningId);

  function handleSelect(t: Tuning) {
    if (forcedStandard) return; // shouldn't happen — picker disabled in this mode
    if (!isPro && !isTuningFree(t.id)) {
      requirePro(() => {
        setTuningId(t.id);
        setOpen(false);
      });
      return;
    }
    setTuningId(t.id);
    setOpen(false);
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => !forcedStandard && setOpen(true)}
        activeOpacity={forcedStandard ? 1 : 0.7}
        style={[styles.button, forcedStandard && styles.buttonDisabled]}
      >
        <Text style={styles.buttonLabel}>TUNING</Text>
        <View style={styles.buttonRight}>
          <Text style={styles.buttonValue} numberOfLines={1}>
            {displayTuning.shortName}
          </Text>
          {!forcedStandard && <Text style={styles.buttonChevron}>⌄</Text>}
        </View>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Tuning</Text>
              <TouchableOpacity onPress={() => setOpen(false)} activeOpacity={0.7}>
                <Text style={styles.close}>Done</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.subhead}>
              Tuning affects scale notes on the fretboard. Chord library, progressions and CAGED always use standard tuning.
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {TUNINGS.map(t => {
                const active = t.id === tuningId;
                const locked = !isPro && !isTuningFree(t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => handleSelect(t)}
                    activeOpacity={0.7}
                    style={[styles.row, active && styles.rowActive, locked && { opacity: 0.55 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.rowTop}>
                        <Text style={[styles.rowName, active && styles.rowNameActive]}>
                          {t.name}
                        </Text>
                        {locked && <Text style={styles.lockBadge}>🔒 PRO</Text>}
                        {active && <Text style={styles.activeDot}>●</Text>}
                      </View>
                      <Text style={styles.rowStrings}>
                        {[...t.stringNames].reverse().join(' ')}
                      </Text>
                      <Text style={styles.rowDesc} numberOfLines={2}>{t.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    gap: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonLabel: {
    fontSize: 9, fontWeight: '700', color: COLORS.textFaint,
    letterSpacing: 0.8,
  },
  buttonRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  buttonValue: {
    fontSize: 12, fontWeight: '600', color: COLORS.text,
    maxWidth: 90,
  },
  buttonChevron: {
    fontSize: 12, color: COLORS.textMuted, lineHeight: 14,
  },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.bgElevated,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '85%', paddingBottom: 30,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg, paddingBottom: SPACE.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.text },
  close: { fontSize: 14, color: COLORS.accent, fontWeight: '600', padding: 4 },
  subhead: {
    fontSize: 12, color: COLORS.textMuted, lineHeight: 18,
    paddingHorizontal: SPACE.lg, paddingTop: SPACE.sm, paddingBottom: SPACE.md,
  },

  row: {
    paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rowActive: { backgroundColor: COLORS.surfaceHigh },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  rowName: { fontSize: 14, fontWeight: '600', color: COLORS.text, flexShrink: 1 },
  rowNameActive: { color: COLORS.accent },
  rowStrings: {
    fontSize: 12, color: COLORS.textMuted, marginBottom: 3,
    fontVariant: ['tabular-nums'], letterSpacing: 1,
  },
  rowDesc: { fontSize: 12, color: COLORS.textFaint, lineHeight: 17 },
  lockBadge: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.6 },
  activeDot: { fontSize: 10, color: COLORS.accent, marginLeft: 'auto' },
});
