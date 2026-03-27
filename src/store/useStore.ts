import { create } from 'zustand';

export type AppMode = 'scales' | 'chords' | 'caged';
export type LabelMode = 'name' | 'degree' | 'interval' | 'none';

interface AppState {
  root: number;
  scaleKey: string;
  chordKey: string;
  mode: AppMode;
  labelMode: LabelMode;
  activePosition: number | null;   // for scales mode
  activeCaged: string | null;      // for caged mode
  showAllFrets: boolean;

  setRoot: (r: number) => void;
  setScaleKey: (k: string) => void;
  setChordKey: (k: string) => void;
  setMode: (m: AppMode) => void;
  setLabelMode: (l: LabelMode) => void;
  setActivePosition: (p: number | null) => void;
  setActiveCaged: (c: string | null) => void;
  setShowAllFrets: (v: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  root: 0,
  scaleKey: 'Major',
  chordKey: 'Major',
  mode: 'scales',
  labelMode: 'name',
  activePosition: null,
  activeCaged: null,
  showAllFrets: false,

  setRoot: (root) => set({ root }),
  setScaleKey: (scaleKey) => set({ scaleKey, activePosition: null }),
  setChordKey: (chordKey) => set({ chordKey }),
  setMode: (mode) => set({ mode, activePosition: null, activeCaged: null }),
  setLabelMode: (labelMode) => set({ labelMode }),
  setActivePosition: (activePosition) => set({ activePosition }),
  setActiveCaged: (activeCaged) => set({ activeCaged }),
  setShowAllFrets: (showAllFrets) => set({ showAllFrets }),
}));
