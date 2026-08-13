import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Pressable, ScrollView, Modal,
  StyleSheet, Alert,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { COLORS, FONT_FAMILY, RADIUS, SPACE } from '../constants/theme';
import { OPEN_STRINGS, SCALES, CHORDS } from '../constants/music';
import { useStore } from '../store/useStore';
import { useProGate } from '../hooks/useProGate';
import {
  type FretMap, type MapDot, MAP_PALETTE,
  diagramGeometry, renderDiagramSvg, demoMap,
} from '../utils/diagramSvg';
import {
  getScaleNotes, scaleDegreeIdxAt, scaleRootLetter, spellNoteAt,
  symbolToDegreeIdx, chordRootLetter, scaleRootName, chordRootName,
} from '../utils/theory';

// Fret windows the builder offers. Maps store raw numbers (not the preset
// key), so future custom ranges won't invalidate saved maps.
const WINDOWS: { label: string; start: number; end: number }[] = [
  { label: '0–5',  start: 0, end: 5 },
  { label: '0–7',  start: 0, end: 7 },
  { label: '5–12', start: 5, end: 12 },
  { label: '7–15', start: 7, end: 15 },
  { label: 'Full', start: 0, end: 15 },
];

function newId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

// Interval → seed color, matching the app's role colors (root yellow,
// 3rd red, 5th green, everything else blue).
function seedColor(semitone: number): string {
  if (semitone === 0) return MAP_PALETTE[0];
  if (semitone === 3 || semitone === 4) return MAP_PALETTE[1];
  if (semitone === 7) return MAP_PALETTE[2];
  return MAP_PALETTE[3];
}

export default function MapBuilder() {
  const { isPro, requirePro } = useProGate();
  const root = useStore(s => s.root);
  const scaleKey = useStore(s => s.scaleKey);
  const chordKey = useStore(s => s.chordKey);
  const savedMaps = useStore(s => s.savedMaps);
  const saveMap = useStore(s => s.saveMap);
  const deleteMap = useStore(s => s.deleteMap);

  const [dots, setDots] = useState<MapDot[]>([]);
  const [brush, setBrush] = useState<string>(MAP_PALETTE[0]);
  const [win, setWin] = useState(4); // index into WINDOWS, default Full
  const [showLabels, setShowLabels] = useState(true);
  const [vertical, setVertical] = useState(false);
  const [name, setName] = useState('');
  const [mapId, setMapId] = useState<string>(() => newId());
  const [createdAt, setCreatedAt] = useState<number>(() => Date.now());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { start: fretStart, end: fretEnd } = WINDOWS[win];

  const draft: FretMap = useMemo(() => ({
    id: mapId, name: name.trim() || 'Fretboard map', dots,
    fretStart, fretEnd, showLabels,
    orientation: vertical ? 'vertical' : 'horizontal',
    createdAt, updatedAt: Date.now(),
  }), [mapId, name, dots, fretStart, fretEnd, showLabels, vertical, createdAt]);

  const geo = useMemo(
    () => diagramGeometry(fretStart, fretEnd, vertical ? 'vertical' : 'horizontal'),
    [fretStart, fretEnd, vertical],
  );
  const svg = useMemo(() => renderDiagramSvg(draft, 'dark'), [draft]);

  // ── Editing ───────────────────────────────────────────────────────────────

  // Tap rules, Guitar-Scientist style: empty cell → place a dot in the brush
  // color; dot in the brush color → remove it; dot in another color →
  // repaint it. One gesture covers add, delete, and recolor.
  function handleTap(x: number, y: number) {
    const cell = geo.cellForPoint(x, y);
    if (!cell) return;
    setDots(prev => {
      const hit = prev.find(d => d.s === cell.s && d.f === cell.f);
      if (!hit) return [...prev, { s: cell.s, f: cell.f, color: brush }];
      if (hit.color === brush) return prev.filter(d => d !== hit);
      return prev.map(d => (d === hit ? { ...d, color: brush, label: d.label } : d));
    });
  }

  // Seed the window from the currently-selected scale/chord (the ones on the
  // Fretboard tab), colored by interval role and spelled with the same
  // enharmonics the rest of the app now uses. Answers "build my own scales":
  // start from a real one, then edit.
  function seedFromScale() {
    const notes = getScaleNotes(root, scaleKey);
    const rl = scaleRootLetter(root, scaleKey);
    const seeded: MapDot[] = [];
    for (let s = 0; s < 6; s++) {
      for (let f = fretStart; f <= fretEnd; f++) {
        const pc = (OPEN_STRINGS[s] + f) % 12;
        const idx = notes.indexOf(pc);
        if (idx < 0) continue;
        seeded.push({
          s, f,
          color: seedColor((pc - root + 12) % 12),
          label: spellNoteAt(root, scaleDegreeIdxAt(scaleKey, idx), pc, rl),
        });
      }
    }
    setDots(seeded);
    if (!name.trim()) setName(`${scaleRootName(root, scaleKey)} ${scaleKey}`);
  }

  function seedFromChord() {
    const ch = CHORDS[chordKey];
    if (!ch) return;
    const rl = chordRootLetter(root, chordKey);
    const seeded: MapDot[] = [];
    for (let s = 0; s < 6; s++) {
      for (let f = fretStart; f <= fretEnd; f++) {
        const pc = (OPEN_STRINGS[s] + f) % 12;
        const iv = (pc - root + 12) % 12;
        const pos = ch.intervals.map(i => i % 12).indexOf(iv);
        if (pos < 0) continue;
        seeded.push({
          s, f,
          color: seedColor(iv),
          label: spellNoteAt(root, symbolToDegreeIdx(ch.intervalNames[pos]), pc, rl),
        });
      }
    }
    setDots(seeded);
    if (!name.trim()) setName(`${chordRootName(root, chordKey)} ${chordKey}`);
  }

  function resetDraft() {
    setDots([]); setName(''); setMapId(newId()); setCreatedAt(Date.now());
  }

  function loadMap(m: FretMap) {
    setDots(m.dots); setName(m.name); setMapId(m.id); setCreatedAt(m.createdAt);
    setShowLabels(m.showLabels);
    // Maps saved before orientation existed have no field → horizontal.
    setVertical(m.orientation === 'vertical');
    const wi = WINDOWS.findIndex(w => w.start === m.fretStart && w.end === m.fretEnd);
    setWin(wi >= 0 ? wi : 4);
    setSheetOpen(false);
  }

  // Clear empties the board but keeps the map's identity (name, id, window) —
  // unlike New, which starts a fresh map. Confirmed because there's no undo,
  // and a seeded full-neck map is ~90 dots of work to lose to a stray tap.
  function handleClear() {
    if (dots.length === 0) return;
    Alert.alert('Clear all notes?', `Remove all ${dots.length} notes from the board.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setDots([]) },
    ]);
  }

  function handleSave() {
    if (dots.length === 0) {
      Alert.alert('Nothing to save', 'Tap the fretboard to place some notes first.');
      return;
    }
    saveMap(draft);
    if (!name.trim()) setName(draft.name);
    Alert.alert('Saved', `“${draft.name}” is in My Maps.`);
  }

  // ── Export ────────────────────────────────────────────────────────────────

  async function handleExport() {
    if (dots.length === 0) {
      Alert.alert('Nothing to export', 'Tap the fretboard to place some notes first.');
      return;
    }
    setExporting(true);
    try {
      // Lazy-required, not imported at module scope: expo-print/expo-sharing
      // are native modules that only exist in builds made after they were
      // added. A top-level import would crash this whole screen on an older
      // binary running new JS (dev client mid-update, or a stale OTA pairing);
      // requiring here confines the failure to the Export button.
      const Print: typeof import('expo-print') = require('expo-print');
      const Sharing: typeof import('expo-sharing') = require('expo-sharing');
      // Same renderer as the on-screen preview, light theme for paper.
      const lightSvg = renderDiagramSvg(draft, 'light');
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
        body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#26221B;margin:32px}
        h1{font-size:22px;margin:0 0 4px;letter-spacing:-0.2px}
        .sub{color:#8A857C;font-size:12px;margin:0 0 24px}
        svg{max-width:100%;height:auto}
        .foot{margin-top:28px;color:#B4AFA6;font-size:11px}
      </style></head><body>
        <h1>${draft.name.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</h1>
        <p class="sub">Frets ${fretStart}–${fretEnd}</p>
        ${lightSvg}
        <p class="foot">Made with Fretionary</p>
      </body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('Saved to file', uri);
      }
    } catch (e) {
      Alert.alert(
        'Export failed',
        'Could not create the PDF. If the app was just updated, PDF export needs the newest app version from the store.',
      );
    } finally {
      setExporting(false);
    }
  }

  // ── Non-Pro preview ───────────────────────────────────────────────────────
  // A real render of the demo map — the preview IS the feature, not a mockup.

  if (!isPro) {
    const demo = renderDiagramSvg(demoMap(), 'dark');
    return (
      <View style={{ gap: SPACE.lg }}>
        <View style={styles.previewCard}>
          <Text style={styles.previewEyebrow}>PRO FEATURE</Text>
          <Text style={styles.previewTitle}>Custom fretboard maps</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: SPACE.md }}>
            <SvgXml xml={demo} />
          </ScrollView>
          <Text style={styles.previewDesc}>
            Tap any note on the neck, color it, name the diagram, and share it
            as a PDF. Build your own scales, chord maps, and lesson handouts.
          </Text>
          <TouchableOpacity
            style={styles.unlockBtn}
            onPress={() => requirePro(() => {})}
            activeOpacity={0.85}
          >
            <Text style={styles.unlockBtnText}>Unlock with Pro</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Builder ───────────────────────────────────────────────────────────────

  return (
    <View style={{ gap: SPACE.md }}>
      {/* Diagram — tap targets come from the same geometry the SVG renders
          with, so hits can't drift from the drawing. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.boardWrap}>
        <Pressable onPress={e => handleTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}>
          <SvgXml xml={svg} width={geo.width} height={geo.height} />
        </Pressable>
      </ScrollView>
      <Text style={styles.hint}>
        Tap to place a note · tap again to remove · other color repaints
      </Text>

      {/* Brush palette */}
      <View style={styles.paletteRow}>
        {MAP_PALETTE.map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => setBrush(c)}
            style={[styles.chip, { backgroundColor: c }, brush === c && styles.chipActive]}
            activeOpacity={0.8}
          />
        ))}
      </View>

      {/* Window + labels */}
      <View style={styles.rowWrap}>
        {WINDOWS.map((w, i) => (
          <TouchableOpacity key={w.label} onPress={() => setWin(i)}
            style={[styles.pill, win === i && styles.pillActive]} activeOpacity={0.7}>
            <Text style={[styles.pillText, win === i && styles.pillTextActive]}>{w.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => setShowLabels(v => !v)}
          style={[styles.pill, showLabels && styles.pillActive]} activeOpacity={0.7}>
          <Text style={[styles.pillText, showLabels && styles.pillTextActive]}>Labels</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setVertical(v => !v)}
          style={[styles.pill, vertical && styles.pillActive]} activeOpacity={0.7}>
          <Text style={[styles.pillText, vertical && styles.pillTextActive]}>Vertical</Text>
        </TouchableOpacity>
      </View>

      {/* Seeds */}
      <View style={styles.rowWrap}>
        <TouchableOpacity onPress={seedFromScale} style={styles.seedBtn} activeOpacity={0.7}>
          <Text style={styles.seedText}>Seed: {scaleRootName(root, scaleKey)} {scaleKey}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={seedFromChord} style={styles.seedBtn} activeOpacity={0.7}>
          <Text style={styles.seedText}>Seed: {chordRootName(root, chordKey)} {chordKey}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={resetDraft} style={styles.seedBtn} activeOpacity={0.7}>
          <Text style={styles.seedText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Name + actions */}
      <TextInput
        style={styles.nameInput}
        placeholder="Name this map (e.g. Blues lick in A)"
        placeholderTextColor={COLORS.textFaint}
        value={name}
        onChangeText={setName}
        returnKeyType="done"
      />
      <View style={styles.rowWrap}>
        <TouchableOpacity onPress={handleSave} style={styles.actionBtn} activeOpacity={0.85}>
          <Text style={styles.actionText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleExport} disabled={exporting}
          style={[styles.actionBtn, styles.actionPrimary]} activeOpacity={0.85}>
          <Text style={[styles.actionText, styles.actionPrimaryText]}>
            {exporting ? 'Exporting…' : 'Export PDF'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSheetOpen(true)} style={styles.actionBtn} activeOpacity={0.85}>
          <Text style={styles.actionText}>My Maps ({savedMaps.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Saved maps sheet */}
      <Modal visible={sheetOpen} animationType="slide" transparent>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetCard}>
            <View style={styles.sheetHdr}>
              <Text style={styles.sheetTitle}>My Maps</Text>
              <TouchableOpacity onPress={() => setSheetOpen(false)} activeOpacity={0.7}>
                <Text style={styles.sheetClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {savedMaps.length === 0 && (
                <Text style={styles.sheetEmpty}>No saved maps yet — build one and hit Save.</Text>
              )}
              {savedMaps.map(m => (
                <View key={m.id} style={styles.sheetRow}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => loadMap(m)} activeOpacity={0.7}>
                    <Text style={styles.sheetName} numberOfLines={1}>{m.name}</Text>
                    <Text style={styles.sheetMeta}>
                      {m.dots.length} notes · frets {m.fretStart}–{m.fretEnd}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Delete map?', `“${m.name}” will be removed.`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteMap(m.id) },
                    ])}
                    style={styles.sheetDelete} activeOpacity={0.7}>
                    <Text style={styles.sheetDeleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  boardWrap: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACE.md,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textFaint,
    textAlign: 'center',
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACE.sm,
  },
  chip: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 2, borderColor: 'transparent',
  },
  chipActive: {
    borderColor: '#FFFFFF',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: 'rgba(122,90,248,0.18)',
    borderColor: '#7A5AF8',
  },
  pillText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  pillTextActive: { color: COLORS.text },
  seedBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(232,212,77,0.08)',
    borderWidth: 1, borderColor: 'rgba(232,212,77,0.3)',
  },
  seedText: { fontSize: 12, color: '#E8D44D', fontWeight: '600' },
  // Red-tinted so the destructive action doesn't read as just another seed.
  clearBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(226,75,74,0.08)',
    borderWidth: 1, borderColor: 'rgba(226,75,74,0.3)',
  },
  clearText: { fontSize: 12, color: '#E24B4A', fontWeight: '600' },
  nameInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    color: COLORS.text,
    paddingHorizontal: SPACE.md, paddingVertical: 10,
    fontSize: 14,
  },
  actionBtn: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  actionPrimary: {
    backgroundColor: '#7A5AF8',
    borderColor: '#7A5AF8',
  },
  actionText: { fontSize: 13, color: COLORS.text, fontWeight: '700' },
  actionPrimaryText: { color: '#fff' },

  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACE.lg,
  },
  previewEyebrow: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    color: '#7A5AF8', fontFamily: FONT_FAMILY.mono, marginBottom: 4,
  },
  previewTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  previewDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19, marginBottom: SPACE.md },
  unlockBtn: {
    backgroundColor: '#7A5AF8',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  unlockBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  sheetOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheetCard: {
    backgroundColor: COLORS.bgElevated,
    borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg,
    maxHeight: '70%',
    padding: SPACE.lg,
  },
  sheetHdr: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACE.md,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  sheetClose: { fontSize: 14, color: '#7A5AF8', fontWeight: '600' },
  sheetEmpty: { fontSize: 13, color: COLORS.textFaint, paddingVertical: SPACE.lg, textAlign: 'center' },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE.md,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sheetName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  sheetMeta: { fontSize: 11, color: COLORS.textFaint, marginTop: 2 },
  sheetDelete: { padding: 8 },
  sheetDeleteText: { color: COLORS.textFaint, fontSize: 14 },
});
