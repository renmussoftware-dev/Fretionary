# Nodi

A guitar learning app for iOS and Android. Interactive fretboard visualizer covering all major/minor scales, modes, chords, extended voicings, and the CAGED system.

**Every note on the neck is a node. Nodi shows you all of them.**

Built with Expo (React Native) + TypeScript.

---

## Quick start

```bash
npm install
npx expo start --tunnel --clear
```

Scan the QR code with **Expo Go** on your phone (iOS or Android).

### Run on simulator

```bash
npx expo start --ios       # requires macOS + Xcode
npx expo start --android   # requires Android Studio
```

---

## Project structure

```
nodi/
├── app/                        # expo-router screens
│   ├── _layout.tsx             # Root layout (GestureHandler, StatusBar)
│   └── (tabs)/
│       ├── _layout.tsx         # Bottom tab navigator
│       ├── index.tsx           # Fretboard tab (main interactive view)
│       ├── chords.tsx          # Chord library + box diagrams
│       ├── scales.tsx          # Scale reference browser
│       └── caged.tsx           # CAGED system guide
│
└── src/
    ├── constants/
    │   ├── music.ts            # All theory data (scales, chords, CAGED shapes, colors)
    │   └── theme.ts            # Dark theme tokens (colors, spacing, radius, fonts)
    │
    ├── store/
    │   └── useStore.ts         # Zustand global state (root, scale, mode, position)
    │
    ├── components/
    │   ├── Fretboard.tsx       # SVG fretboard — core visual component
    │   ├── ChordBox.tsx        # Box chord diagram (6-string grid)
    │   ├── TopBar.tsx          # Mode tabs + root note selector
    │   ├── InfoPanel.tsx       # Notes / formula / degrees info strip
    │   └── PillSelector.tsx    # Reusable scrollable pill chip row
    │
    └── utils/
        └── theory.ts           # Music theory logic (scale/chord math, positions, CAGED)
```

---

## Features

### Fretboard tab
- **Scales mode** — 14 scales (major, all 7 modes, pentatonic major/minor, blues, harmonic minor, melodic minor, whole tone, diminished)
- **Chords mode** — 25 chord types (triads, sixths, sevenths, ninths, elevenths, thirteenths, sus, power)
- **CAGED mode** — All 5 shapes with position highlight, caret line, and fret range overlay
- Color-coded notes: root (yellow), 3rd (red), 5th (green), extensions (blue), scale tones (gray)
- Note labels switchable: note name / scale degree / interval / none
- Position highlighting: up to 5 auto-detected scale positions per key

### Chords tab
- Browse all 25 chord types by category (triads, sevenths, extended, sus)
- Live box chord diagram updates as you change root or chord type
- Interval structure badges with color-coded dots (root / 3rd / 5th / extension)

### Scales tab
- Full scale reference with notes, formula (W/H steps), and degree breakdown
- Filter by category: major, minor, pentatonic, modes, other
- Note grid showing each scale tone with its degree

### CAGED tab
- Full written explanation of the CAGED system
- Per-shape detail: root string, caret fret for current key, tips
- Live cycle diagram showing all 5 shapes at their fret positions for the selected key
- "View on fretboard" button navigates to fretboard tab with that shape highlighted

---

## Music theory data

All theory is in `src/constants/music.ts`:

- **14 scales** with step patterns, degrees, formulas, categories, descriptions
- **25 chords** with interval arrays, interval names, categories, descriptions
- **5 CAGED shapes** with root string, fret span offsets, open shape name
- Color constants for note types and position/CAGED highlighting

All math (scale note generation, chord note generation, position detection, CAGED caret calculation) lives in `src/utils/theory.ts` — pure functions, fully testable.

---

## State management

Zustand store (`src/store/useStore.ts`):

| State | Type | Description |
|---|---|---|
| `root` | `number` | Root note index 0–11 |
| `scaleKey` | `string` | Key into SCALES object |
| `chordKey` | `string` | Key into CHORDS object |
| `mode` | `AppMode` | `'scales' \| 'chords' \| 'caged'` |
| `labelMode` | `LabelMode` | `'name' \| 'degree' \| 'interval' \| 'none'` |
| `activePosition` | `number \| null` | Scale position index (0–4) |
| `activeCaged` | `string \| null` | CAGED shape letter or null |

---

## Building for release

### Prerequisites
```bash
npm install -g eas-cli
eas login
```

### Configure
```bash
eas build:configure
```

### Build
```bash
eas build --platform ios      # iOS .ipa
eas build --platform android  # Android .aab
eas build --platform all      # Both
```

### Submit to stores
```bash
eas submit --platform ios
eas submit --platform android
```

---

## Roadmap (v1.1+)

- [ ] **Audio playback** — tap any note to hear it (expo-av + sampled audio)
- [ ] **Chord voicing engine** — multiple voicings per chord, swipeable
- [ ] **Practice mode** — flash cards, quiz on note positions
- [ ] **Custom tunings** — drop D, open G, DADGAD, etc.
- [ ] **Favorites** — save scale/chord combos
- [ ] **iPad layout** — split view with fretboard always visible
- [ ] **Metronome** — built-in for practice sessions

---

## App store info

- **Bundle ID (iOS):** `com.renmussoftware.nodi`
- **Package (Android):** `com.renmussoftware.nodi`
- **Scheme:** `nodi`
- **Slug:** `nodi`

---

## Dependencies

| Package | Purpose |
|---|---|
| `expo` ~55 | Runtime and SDK |
| `expo-router` | File-based navigation |
| `react-native-svg` | Fretboard and chord box rendering |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-gesture-handler` | Gesture support |
| `react-native-reanimated` | Animation foundation |
| `zustand` | Global state management |
| `@expo/vector-icons` | Tab bar icons |
