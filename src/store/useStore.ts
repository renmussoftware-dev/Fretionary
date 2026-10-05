import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import type { FretMap } from '../utils/diagramSvg';
import { getTuning, tuningNoteClasses } from '../constants/tunings';

const DAY_MS = 24 * 60 * 60 * 1000;
const REVIEW_MIN_ACTIONS = 3;
const REVIEW_MIN_DAYS_INSTALLED = 2;
const REVIEW_MIN_DAYS_SINCE_LAST = 60;

/**
 * Threshold for the proactive paywall. When a non-Pro user has favorited
 * this many items (a genuine engagement signal), present the paywall once.
 * Reuses positiveActionCount — the same engagement counter that throttles the
 * App Store review prompt — because it correlates with users who've already
 * gotten value from the app and are likely to convert.
 */
export const PAYWALL_PROMPT_MIN_ACTIONS = 3;

// ── Streak helpers ──────────────────────────────────────────────────────────
// Date keys are local-time YYYY-MM-DD strings so day boundaries match the
// user's wall clock (a New Yorker and a Tokyoite both get credit at their
// own midnight, not UTC's). Compare strings == strings — no timezone math
// once you're in the YYYY-MM-DD format.

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayKey(): string {
  return dateKey(new Date());
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

export type AppMode = 'scales' | 'chords' | 'caged' | 'custom';
export type LabelMode = 'name' | 'degree' | 'interval' | 'none';
export type ScalePlaybackSpeed = 'slow' | 'normal' | 'fast';
export type LabelSize = 'sm' | 'md' | 'lg';
export type FretRange = 'all' | 'open' | 'low' | 'mid' | 'high' | 'extended';

// Inclusive start/end frets for each FretRange preset. Centralized here so
// Fretboard.tsx and the UI picker stay in sync. Beyond raw range, anything
// outside [start, end] is hidden entirely (frets, notes, inlays) and the
// remaining range fills the available width so the user can actually focus.
//
// Default is 15 frets ('all') — the standard "acoustic-to-electric" neck
// that fits phone screens without crowding. The extended 2-octave 24-fret
// range is available as its own preset for users who play modern electrics
// (Ibanez, PRS, etc.) or who want to see the full upper-fret neighborhood.
export const FRET_RANGES: Record<FretRange, { start: number; end: number; label: string }> = {
  all:      { start: 0,  end: 15, label: 'All' },
  open:     { start: 0,  end: 5,  label: '0–5' },
  low:      { start: 0,  end: 7,  label: '0–7' },
  mid:      { start: 5,  end: 12, label: '5–12' },
  high:     { start: 12, end: 15, label: '12+' },
  extended: { start: 0,  end: 24, label: '24' },
};

// Per-step delay (ms) for scale playback. Slow is for students who want
// to track each highlighted note; fast is for fluent practice. Normal
// matches the original hardcoded value, so existing users hear no change.
export const SCALE_SPEED_MS: Record<ScalePlaybackSpeed, number> = {
  slow:   500,
  normal: 280,
  fast:   150,
};

export type SavedItem =
  | { kind: 'scale';       root: number; scaleKey: string;     addedAt: number }
  | { kind: 'chord';       root: number; chordKey: string;     addedAt: number }
  | { kind: 'progression'; root: number; progName: string;     addedAt: number };

// Distributive Omit so the discriminated union survives the omission of `addedAt`.
type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
export type SavedItemInput = DistributiveOmit<SavedItem, 'addedAt'>;

const RECENTS_MAX = 20;

// Highest fret a tapped Identify position can live on (the 24-fret range).
const CUSTOM_MAX_FRET = 24;

// Pitch class (0-11) of a "string:fret" Identify cell under the given tuning.
export function cellPitch(key: string, noteClasses: number[]): number {
  const [s, f] = key.split(':').map(Number);
  return (noteClasses[s] + f) % 12;
}

// Every pitch class selected in Identify mode — pill picks plus the pitches
// of individually tapped positions — sorted and de-duplicated. This is what
// the chord/interval identifier and the info panel read.
export function identifyPitchClasses(
  customNotes: number[], customCells: string[], noteClasses: number[],
): number[] {
  const set = new Set(customNotes);
  for (const k of customCells) set.add(cellPitch(k, noteClasses));
  return Array.from(set).sort((a, b) => a - b);
}

// Hook form of identifyPitchClasses, bound to the active tuning.
export function useIdentifyNotes(): number[] {
  const customNotes = useStore(s => s.customNotes);
  const customCells = useStore(s => s.customCells);
  const tuningId = useStore(s => s.tuningId);
  return useMemo(
    () => identifyPitchClasses(customNotes, customCells, tuningNoteClasses(getTuning(tuningId))),
    [customNotes, customCells, tuningId],
  );
}

function itemKey(it: SavedItemInput): string {
  switch (it.kind) {
    case 'scale':       return `s:${it.root}:${it.scaleKey}`;
    case 'chord':       return `c:${it.root}:${it.chordKey}`;
    case 'progression': return `p:${it.root}:${it.progName}`;
  }
}

interface AppState {
  root: number;
  scaleKey: string;
  chordKey: string;
  mode: AppMode;
  labelMode: LabelMode;
  activePosition: number | null;
  activeCaged: string | null;
  showAllFrets: boolean;
  isPro: boolean;
  tuningId: string;
  // Identify mode has two kinds of selection. customNotes are pitch classes
  // picked from the note pills — every instance lights up across the neck.
  // customCells are individual "string:fret" positions tapped on the
  // fretboard — only that one spot lights up, so the user can fill in the
  // neck themselves (note memorization) or build a specific voicing.
  // Identification runs on the union of both.
  customNotes: number[];
  customCells: string[];

  favorites: SavedItem[];
  recents: SavedItem[];

  // Review-prompt state — persisted, used to throttle the system rating dialog
  // so we only ask after the user has been actively engaged for a while.
  installedAt: number;          // ms epoch; 0 until first lazy init
  positiveActionCount: number;
  lastPromptedAt: number | null;
  recordPositiveAction: () => void;

  // Proactive paywall state — persisted, single-shot per install. Set when
  // the proactive paywall has been presented so we never present it twice.
  // The trigger lives in app/_layout.tsx; this just persists the flag.
  paywallPromptShownAt: number | null;
  markPaywallPromptShown: () => void;

  // Streak state — counts consecutive days of app activity. lastActivityDate
  // is a local-time YYYY-MM-DD string so we compare days, not timestamps
  // (a 7am open followed by an 11pm open on the same day is still one day).
  // Driven by recordActivity(), called from app/_layout.tsx on app launch.
  lastActivityDate: string | null;
  currentStreak: number;
  longestStreak: number;
  recordActivity: () => void;

  // Practice progress — arrays of scale/chord/progression keys the user has
  // actively engaged with (played the audio for, not just viewed). Powers
  // the Progress screen in Tools. Idempotent recorders — adding an item
  // that's already in the list is a no-op, so it's safe to call from every
  // playback trigger without dedupe logic at the call site.
  scalesExplored: string[];
  chordsLearned: string[];
  progressionsPlayed: string[];
  recordScaleExplored: (scaleKey: string) => void;
  recordChordLearned: (chordKey: string) => void;
  recordProgressionPlayed: (name: string) => void;

  // Transient pitch class (0-11) of the currently-playing note during scale
  // playback. The Fretboard reads this to render an extra glow + larger dot
  // on every matching position. null when nothing is playing. Not persisted —
  // resets to null on app launch.
  playbackHighlight: number | null;
  setPlaybackHighlight: (pitchClass: number | null) => void;

  // User-selected playback speed for the scale Play button. Persisted —
  // sticks across launches the way the user's tuning/labels do.
  scalePlaybackSpeed: ScalePlaybackSpeed;
  setScalePlaybackSpeed: (speed: ScalePlaybackSpeed) => void;

  // Note-label readability + neck range. Both persisted. The 'sm' preset
  // matches the old baseline so existing users don't see a surprise jump
  // in label size unless they opt in; 'md' is the new default for fresh
  // installs (slightly bigger + brighter scale-tone text).
  labelSize: LabelSize;
  setLabelSize: (size: LabelSize) => void;
  fretRange: FretRange;
  setFretRange: (range: FretRange) => void;

  // Transient: set by the Saved sheet so a tab screen can apply its local
  // selection on next render. The screen clears it after consuming.
  pendingNav: SavedItem | null;
  setPendingNav: (item: SavedItem | null) => void;

  setRoot: (r: number) => void;
  setScaleKey: (k: string) => void;
  setChordKey: (k: string) => void;
  setMode: (m: AppMode) => void;
  setLabelMode: (l: LabelMode) => void;
  setActivePosition: (p: number | null) => void;
  setActiveCaged: (c: string | null) => void;
  setShowAllFrets: (v: boolean) => void;
  setIsPro: (v: boolean) => void;
  setTuningId: (id: string) => void;
  toggleCustomNote: (n: number) => void;
  toggleCustomCell: (string: number, fret: number, noteClasses: number[]) => void;
  clearCustomNotes: () => void;
  setCustomNotes: (notes: number[]) => void;

  toggleFavorite: (item: SavedItemInput) => void;
  isFavorite: (item: SavedItemInput) => boolean;
  addRecent: (item: SavedItemInput) => void;
  clearRecents: () => void;

  // Custom fretboard maps (the Maps builder in Tools). Persisted. saveMap
  // upserts by id so "save again" updates in place instead of duplicating.
  savedMaps: FretMap[];
  saveMap: (map: FretMap) => void;
  deleteMap: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      root: 0,
      scaleKey: 'Major',
      chordKey: 'Major',
      mode: 'scales',
      labelMode: 'name',
      activePosition: null,
      activeCaged: null,
      showAllFrets: false,
      isPro: false,
      tuningId: 'standard',
      customNotes: [],
      customCells: [],

      favorites: [],
      recents: [],
      installedAt: 0,
      positiveActionCount: 0,
      lastPromptedAt: null,
      paywallPromptShownAt: null,
      lastActivityDate: null,
      currentStreak: 0,
      longestStreak: 0,
      scalesExplored: [],
      chordsLearned: [],
      progressionsPlayed: [],
      playbackHighlight: null,
      scalePlaybackSpeed: 'normal',
      labelSize: 'md',
      fretRange: 'all',
      pendingNav: null,

      setPendingNav: (pendingNav) => set({ pendingNav }),

      markPaywallPromptShown: () => set({ paywallPromptShownAt: Date.now() }),

      setPlaybackHighlight: (playbackHighlight) => set({ playbackHighlight }),

      setScalePlaybackSpeed: (scalePlaybackSpeed) => set({ scalePlaybackSpeed }),
      setLabelSize: (labelSize) => set({ labelSize }),
      setFretRange: (fretRange) => set({ fretRange }),

      recordActivity: () => {
        const today = todayKey();
        const state = get();
        if (state.lastActivityDate === today) return; // already counted today
        // Carry the streak forward if yesterday was active; otherwise reset to 1.
        const newStreak = state.lastActivityDate === yesterdayKey()
          ? state.currentStreak + 1
          : 1;
        const newLongest = Math.max(state.longestStreak, newStreak);
        set({
          lastActivityDate: today,
          currentStreak: newStreak,
          longestStreak: newLongest,
        });
      },

      // Idempotent — arrays act as Sets, adding a duplicate is a no-op so
      // callers can safely fire on every play without dedupe.
      recordScaleExplored: (scaleKey) => {
        const list = get().scalesExplored;
        if (list.includes(scaleKey)) return;
        set({ scalesExplored: [...list, scaleKey] });
      },
      recordChordLearned: (chordKey) => {
        const list = get().chordsLearned;
        if (list.includes(chordKey)) return;
        set({ chordsLearned: [...list, chordKey] });
      },
      recordProgressionPlayed: (name) => {
        const list = get().progressionsPlayed;
        if (list.includes(name)) return;
        set({ progressionsPlayed: [...list, name] });
      },

      recordPositiveAction: () => {
        const now = Date.now();
        const state = get();
        const installedAt = state.installedAt || now;
        if (state.installedAt === 0) set({ installedAt: now });
        const nextCount = state.positiveActionCount + 1;
        set({ positiveActionCount: nextCount });

        // Throttle: enough actions, enough time installed, enough time since last
        const enoughActions = nextCount >= REVIEW_MIN_ACTIONS;
        const enoughInstalled = (now - installedAt) >= REVIEW_MIN_DAYS_INSTALLED * DAY_MS;
        const enoughSinceLast =
          state.lastPromptedAt === null ||
          (now - state.lastPromptedAt) >= REVIEW_MIN_DAYS_SINCE_LAST * DAY_MS;
        if (!enoughActions || !enoughInstalled || !enoughSinceLast) return;

        // iOS still throttles globally to 3 prompts/year — this is best-effort.
        StoreReview.isAvailableAsync()
          .then(available => {
            if (!available) return;
            return StoreReview.requestReview();
          })
          .catch(() => {})
          .finally(() => {
            set({ lastPromptedAt: now });
          });
      },

      setRoot: (root) => set({ root }),
      setScaleKey: (scaleKey) => set({ scaleKey, activePosition: null }),
      setChordKey: (chordKey) => set({ chordKey }),
      setMode: (mode) => set({ mode, activePosition: null, activeCaged: null }),
      setLabelMode: (labelMode) => set({ labelMode }),
      setActivePosition: (activePosition) => set({ activePosition }),
      setActiveCaged: (activeCaged) => set({ activeCaged }),
      setShowAllFrets: (showAllFrets) => set({ showAllFrets }),
      setIsPro: (isPro) => set({ isPro }),
      setTuningId: (tuningId) => set({ tuningId }),

      // Pill tap. Removing a note clears it entirely — both the neck-wide
      // pill selection and any individually tapped positions of that pitch —
      // so the pill's "off" state always matches what's on the neck.
      toggleCustomNote: (n) => {
        const { customNotes, customCells, tuningId } = get();
        const noteClasses = tuningNoteClasses(getTuning(tuningId));
        const present = customNotes.includes(n)
          || customCells.some(k => cellPitch(k, noteClasses) === n);
        if (present) {
          set({
            customNotes: customNotes.filter(x => x !== n),
            customCells: customCells.filter(k => cellPitch(k, noteClasses) !== n),
          });
        } else {
          set({ customNotes: [...customNotes, n].sort((a, b) => a - b) });
        }
      },
      // Fretboard tap — toggles just this position. If the dot is showing
      // because its pitch was picked neck-wide via a pill, expand that pill
      // into individual positions minus this one, so tapping still removes
      // exactly the dot the user touched.
      toggleCustomCell: (string, fret, noteClasses) => {
        const { customNotes, customCells } = get();
        const key = `${string}:${fret}`;
        const pc = (noteClasses[string] + fret) % 12;
        if (customNotes.includes(pc)) {
          const expanded: string[] = [];
          for (let s = 0; s < noteClasses.length; s++) {
            for (let f = 0; f <= CUSTOM_MAX_FRET; f++) {
              if ((noteClasses[s] + f) % 12 === pc && !(s === string && f === fret)) {
                expanded.push(`${s}:${f}`);
              }
            }
          }
          set({
            customNotes: customNotes.filter(x => x !== pc),
            customCells: Array.from(new Set([...customCells, ...expanded])),
          });
          return;
        }
        set({
          customCells: customCells.includes(key)
            ? customCells.filter(k => k !== key)
            : [...customCells, key],
        });
      },
      clearCustomNotes: () => set({ customNotes: [], customCells: [] }),
      setCustomNotes: (customNotes) => set({ customNotes }),

      toggleFavorite: (item) => {
        const k = itemKey(item);
        const current = get().favorites;
        const exists = current.some(f => itemKey(f) === k);
        if (exists) {
          set({ favorites: current.filter(f => itemKey(f) !== k) });
        } else {
          set({ favorites: [{ ...item, addedAt: Date.now() } as SavedItem, ...current] });
          // Adding a favorite is a positive action. Un-hearting isn't.
          get().recordPositiveAction();
        }
      },

      isFavorite: (item) => {
        const k = itemKey(item);
        return get().favorites.some(f => itemKey(f) === k);
      },

      addRecent: (item) => {
        const k = itemKey(item);
        const filtered = get().recents.filter(r => itemKey(r) !== k);
        const next = [{ ...item, addedAt: Date.now() } as SavedItem, ...filtered].slice(0, RECENTS_MAX);
        set({ recents: next });
      },

      clearRecents: () => set({ recents: [] }),

      savedMaps: [],
      saveMap: (map) => {
        const rest = get().savedMaps.filter(m => m.id !== map.id);
        set({ savedMaps: [map, ...rest] });
        // Saving a map is engagement of the same kind as favoriting.
        get().recordPositiveAction();
      },
      deleteMap: (id) => set({ savedMaps: get().savedMaps.filter(m => m.id !== id) }),
    }),
    {
      name: 'fretionary-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        tuningId: s.tuningId,
        favorites: s.favorites,
        recents: s.recents,
        customNotes: s.customNotes,
        customCells: s.customCells,
        installedAt: s.installedAt,
        positiveActionCount: s.positiveActionCount,
        lastPromptedAt: s.lastPromptedAt,
        paywallPromptShownAt: s.paywallPromptShownAt,
        lastActivityDate: s.lastActivityDate,
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
        scalePlaybackSpeed: s.scalePlaybackSpeed,
        labelSize: s.labelSize,
        fretRange: s.fretRange,
        scalesExplored: s.scalesExplored,
        chordsLearned: s.chordsLearned,
        progressionsPlayed: s.progressionsPlayed,
        savedMaps: s.savedMaps,
      }),
    },
  ),
);
