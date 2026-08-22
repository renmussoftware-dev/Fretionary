import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

// The one audio-mode config for the whole app. It used to be spelled out
// inline in three places (root layout, audio engine, metronome) with slight
// differences — and none of them set interruptionModeIOS, silently relying
// on the expo-av default. Centralized so every re-assert applies the same
// session category and options.
//
// MixWithOthers, deliberately: Hear Scale over the user's own music should
// layer on top of it, not stop it. DoNotMix would make our session
// "primary" and pause Spotify every time a note plays.
export const AUDIO_MODE = {
  playsInSilentModeIOS: true,
  allowsRecordingIOS: false,
  staysActiveInBackground: false,
  interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
  shouldDuckAndroid: true,
  interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  playThroughEarpieceAndroid: false,
} as const;

/**
 * (Re)assert the audio session. Safe to call often — it's idempotent and
 * cheap — and it's the fix for the most common "no sound" report on iOS:
 * with staysActiveInBackground off, iOS deactivates our AVAudioSession
 * whenever the app leaves the foreground or another app takes audio. A
 * later playAsync() can resolve successfully while the player runs into a
 * dead session. Re-asserting right before playback re-activates it.
 *
 * Returns false when iOS refuses (e.g. during a phone call) so callers can
 * decide whether to retry; never throws.
 */
export async function ensureAudioSession(): Promise<boolean> {
  try {
    await Audio.setAudioModeAsync(AUDIO_MODE);
    return true;
  } catch (e) {
    if (__DEV__) console.warn('[audio] setAudioModeAsync failed', e);
    return false;
  }
}
