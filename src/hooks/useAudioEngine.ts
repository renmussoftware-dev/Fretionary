import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';

// ── String open-string MIDI notes (standard tuning) ──────────────────────────
// String 0 = low E = MIDI 40, String 5 = high e = MIDI 64
const OPEN_MIDI: number[] = [40, 45, 50, 55, 59, 64];

// ── Map MIDI note → filename ──────────────────────────────────────────────────
// Files use: C D Db E Eb F Gb G Ab A Bb B + octave
const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function midiToFilename(midi: number): string {
  const noteClass = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteClass]}${octave}`;
}

// Preload only the guitar range: E2 (MIDI 40) to E5 (MIDI 64) + a few above
const GUITAR_MIDI_MIN = 40; // E2 — low E open
const GUITAR_MIDI_MAX = 76; // E5 — high e at fret 12

// Build the require map statically — Metro bundler needs static requires
const AUDIO_FILES: Record<string, any> = {
  'A0':  require('../../assets/audio/A0.mp3'),
  'A1':  require('../../assets/audio/A1.mp3'),
  'A2':  require('../../assets/audio/A2.mp3'),
  'A3':  require('../../assets/audio/A3.mp3'),
  'A4':  require('../../assets/audio/A4.mp3'),
  'A5':  require('../../assets/audio/A5.mp3'),
  'A6':  require('../../assets/audio/A6.mp3'),
  'Ab1': require('../../assets/audio/Ab1.mp3'),
  'Ab2': require('../../assets/audio/Ab2.mp3'),
  'Ab3': require('../../assets/audio/Ab3.mp3'),
  'Ab4': require('../../assets/audio/Ab4.mp3'),
  'Ab5': require('../../assets/audio/Ab5.mp3'),
  'Ab6': require('../../assets/audio/Ab6.mp3'),
  'B1':  require('../../assets/audio/B1.mp3'),
  'B2':  require('../../assets/audio/B2.mp3'),
  'B3':  require('../../assets/audio/B3.mp3'),
  'B4':  require('../../assets/audio/B4.mp3'),
  'B5':  require('../../assets/audio/B5.mp3'),
  'B6':  require('../../assets/audio/B6.mp3'),
  'Bb1': require('../../assets/audio/Bb1.mp3'),
  'Bb2': require('../../assets/audio/Bb2.mp3'),
  'Bb3': require('../../assets/audio/Bb3.mp3'),
  'Bb4': require('../../assets/audio/Bb4.mp3'),
  'Bb5': require('../../assets/audio/Bb5.mp3'),
  'Bb6': require('../../assets/audio/Bb6.mp3'),
  'C2':  require('../../assets/audio/C2.mp3'),
  'C3':  require('../../assets/audio/C3.mp3'),
  'C4':  require('../../assets/audio/C4.mp3'),
  'C5':  require('../../assets/audio/C5.mp3'),
  'C6':  require('../../assets/audio/C6.mp3'),
  'D2':  require('../../assets/audio/D2.mp3'),
  'D3':  require('../../assets/audio/D3.mp3'),
  'D4':  require('../../assets/audio/D4.mp3'),
  'D5':  require('../../assets/audio/D5.mp3'),
  'D6':  require('../../assets/audio/D6.mp3'),
  'Db2': require('../../assets/audio/Db2.mp3'),
  'Db3': require('../../assets/audio/Db3.mp3'),
  'Db4': require('../../assets/audio/Db4.mp3'),
  'Db5': require('../../assets/audio/Db5.mp3'),
  'Db6': require('../../assets/audio/Db6.mp3'),
  'E2':  require('../../assets/audio/E2.mp3'),
  'E3':  require('../../assets/audio/E3.mp3'),
  'E4':  require('../../assets/audio/E4.mp3'),
  'E5':  require('../../assets/audio/E5.mp3'),
  'E6':  require('../../assets/audio/E6.mp3'),
  'Eb2': require('../../assets/audio/Eb2.mp3'),
  'Eb3': require('../../assets/audio/Eb3.mp3'),
  'Eb4': require('../../assets/audio/Eb4.mp3'),
  'Eb5': require('../../assets/audio/Eb5.mp3'),
  'Eb6': require('../../assets/audio/Eb6.mp3'),
  'F2':  require('../../assets/audio/F2.mp3'),
  'F3':  require('../../assets/audio/F3.mp3'),
  'F4':  require('../../assets/audio/F4.mp3'),
  'F5':  require('../../assets/audio/F5.mp3'),
  'F6':  require('../../assets/audio/F6.mp3'),
  'G2':  require('../../assets/audio/G2.mp3'),
  'G3':  require('../../assets/audio/G3.mp3'),
  'G4':  require('../../assets/audio/G4.mp3'),
  'G5':  require('../../assets/audio/G5.mp3'),
  'G6':  require('../../assets/audio/G6.mp3'),
  'Gb2': require('../../assets/audio/Gb2.mp3'),
  'Gb3': require('../../assets/audio/Gb3.mp3'),
  'Gb4': require('../../assets/audio/Gb4.mp3'),
  'Gb5': require('../../assets/audio/Gb5.mp3'),
  'Gb6': require('../../assets/audio/Gb6.mp3'),
};

export function fretToMidi(stringIdx: number, fret: number): number {
  return OPEN_MIDI[stringIdx] + fret;
}

// Convert a ChordVoicing frets array to MIDI notes
// frets[0]=low E string, frets[5]=high e string
export function fretstToMidiNotes(frets: (number | null)[]): number[] {
  const notes: number[] = [];
  for (let s = 0; s < 6; s++) {
    const f = frets[s];
    if (f !== null && f >= 0) {
      notes.push(fretToMidi(s, f));
    }
  }
  return notes;
}

export function useAudioEngine() {
  const soundsRef = useRef<Record<string, Sound>>({});
  const loadedRef = useRef(false);
  const progressionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Android only: tracks the Sound that's currently ringing out during scale
  // playback, so the next note's start can stop it. Without this, multiple
  // samples overlap and Android's audio backend silently drops new playback
  // calls once a few voices are active simultaneously. Reset by stopProgression
  // and by playScale's onFinish.
  const lastPlayingSoundRef = useRef<Sound | null>(null);

  useEffect(() => {
    async function loadAll() {
      // Set audio mode first and wait for it to be fully active
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Small delay to let audio session fully activate on iPad
      await new Promise(resolve => setTimeout(resolve, 100));

      const loaded: Record<string, Sound> = {};

      // Load in small batches to avoid overwhelming iPad audio session
      const entries = Object.entries(AUDIO_FILES);
      const BATCH_SIZE = 10;
      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = entries.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async ([name, src]) => {
            try {
              const { sound } = await Audio.Sound.createAsync(
                src,
                { shouldPlay: false, volume: 1.0, progressUpdateIntervalMillis: 100 }
              );
              loaded[name] = sound;
            } catch {
              // skip missing files silently
            }
          })
        );
      }
      soundsRef.current = loaded;
      loadedRef.current = true;
    }
    loadAll();

    return () => {
      // Unload all sounds on unmount
      Object.values(soundsRef.current).forEach(s => s.unloadAsync());
      if (progressionTimerRef.current) clearTimeout(progressionTimerRef.current);
    };
  }, []);

  // stopPrevious: only set by playScale. Tells the Android path to hard-stop
  // the previously-played sound before starting this one, so notes don't
  // overlap and saturate Android's concurrent-voice limit. playChord leaves
  // it false so the 18ms-spaced strum notes still ring together.
  const playMidi = useCallback(async (midi: number, stopPrevious = false) => {
    const name = midiToFilename(midi);
    let sound = soundsRef.current[name];

    // If sound wasn't loaded (iPad race condition), try loading it now
    if (!sound && AUDIO_FILES[name]) {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false, staysActiveInBackground: false });
        const { sound: newSound } = await Audio.Sound.createAsync(
          AUDIO_FILES[name], { shouldPlay: false, volume: 1.0 }
        );
        soundsRef.current[name] = newSound;
        sound = newSound;
      } catch {
        return;
      }
    }

    if (!sound) return;
    try {
      if (Platform.OS === 'android') {
        // Android-specific concurrency management. iOS AVPlayer handles many
        // overlapping samples cleanly; Android's audio backend doesn't, and
        // a few notes into a scale run new playback calls start getting
        // silently dropped (the user's pattern: "C plays, D-E-F skipped,
        // G-A-B plays, then more skips at octave change"). Stopping the
        // previous note frees its voice slot before the next one starts.
        // Fire-and-forget — we don't await the stop so it doesn't add
        // bridge latency to the new note kicking off.
        if (stopPrevious) {
          const prev = lastPlayingSoundRef.current;
          lastPlayingSoundRef.current = sound;
          if (prev && prev !== sound) {
            prev.stopAsync().catch(() => {});
          }
        }
        // replayAsync is a single native stop+rewind+play call, more reliable
        // on Android than setPositionAsync followed by playAsync (which races
        // across two bridge crossings).
        await sound.replayAsync();
      } else {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch {
      // ignore playback errors
    }
  }, []);

  const playChord = useCallback(async (frets: (number | null)[]) => {
    const notes = fretstToMidiNotes(frets);
    // Strum effect: slight delay between strings (low to high)
    await Promise.all(
      notes.map((midi, i) =>
        new Promise<void>(resolve => {
          setTimeout(() => { playMidi(midi).then(resolve); }, i * 18);
        })
      )
    );
  }, [playMidi]);

  const stopProgression = useCallback(() => {
    if (progressionTimerRef.current) {
      clearTimeout(progressionTimerRef.current);
      progressionTimerRef.current = null;
    }
    // Android only: stop whatever's currently ringing out so the user gets
    // immediate silence when they tap Stop, instead of the last note
    // continuing its decay. iOS never sets this ref, so this is a no-op there
    // (and iOS already feels right with the natural decay continuing briefly).
    const last = lastPlayingSoundRef.current;
    lastPlayingSoundRef.current = null;
    if (last) last.stopAsync().catch(() => {});
  }, []);

  // Play a sequence of chord fret arrays at a given BPM
  // onStep(index) called as each chord plays
  const playProgression = useCallback((
    chordFretsList: (number | null)[][],
    bpm: number,
    onStep: (index: number) => void,
    onFinish: () => void,
  ) => {
    stopProgression();
    const msPerBeat = (60 / bpm) * 1000 * 2; // 2 beats per chord
    let idx = 0;

    function step() {
      if (idx >= chordFretsList.length) {
        onFinish();
        return;
      }
      onStep(idx);
      playChord(chordFretsList[idx]);
      idx++;
      progressionTimerRef.current = setTimeout(step, msPerBeat);
    }
    step();
  }, [playChord, stopProgression]);

  // Play a sequence of single MIDI notes — used for scale playback. Shares
  // the same timer + stopProgression() with playProgression, so starting a
  // scale cleanly cancels a running progression and vice versa.
  const playScale = useCallback((
    midiNotes: number[],
    msPerNote: number,
    onStep: (index: number) => void,
    onFinish: () => void,
  ) => {
    stopProgression();
    let idx = 0;

    function step() {
      if (idx >= midiNotes.length) {
        // Clear the last-playing ref so a future single-note playMidi doesn't
        // try to stop a sound that's already finished naturally. The last
        // note's natural decay is preserved (we don't stop it here).
        lastPlayingSoundRef.current = null;
        onFinish();
        return;
      }
      onStep(idx);
      playMidi(midiNotes[idx], /* stopPrevious */ true);
      idx++;
      progressionTimerRef.current = setTimeout(step, msPerNote);
    }
    step();
  }, [playMidi, stopProgression]);

  return { playMidi, playChord, playProgression, playScale, stopProgression };
}
