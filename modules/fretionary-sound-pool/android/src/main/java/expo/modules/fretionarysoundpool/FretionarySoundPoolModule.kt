package expo.modules.fretionarysoundpool

import android.media.AudioAttributes
import android.media.SoundPool
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.ConcurrentHashMap

/**
 * Android-only low-latency polyphonic audio playback via SoundPool.
 *
 * Why this exists: every other RN audio backend (expo-av, react-native-sound)
 * wraps MediaPlayer on Android, which is built for media-track playback and
 * silently drops new playback calls once a few voices overlap. SoundPool is
 * Android's purpose-built primitive for short audio samples — up to 16
 * concurrent voices, low latency, no audio-focus contention between voices.
 * That's what Fretionary needs for scale playback and chord strumming.
 *
 * iOS already works correctly with expo-av (AVPlayer handles polyphony fine),
 * so we keep iOS on that path and only swap Android over via this module.
 *
 * JS API:
 *   - loadFromUri(name, uri): preload a sample from a file URI. Returns a
 *     promise that resolves when SoundPool has finished decoding (async).
 *   - play(name): fire the named sample. Synchronous, no callbacks — returns
 *     true if the sample was loaded and dispatched, false otherwise.
 *   - stopAll(): pause all currently-playing voices (e.g. when the user
 *     taps Stop during scale playback).
 *   - unloadAll(): release all SoundPool resources (called rarely).
 */
class FretionarySoundPoolModule : Module() {
  private var soundPool: SoundPool? = null
  private val nameToSoundId = ConcurrentHashMap<String, Int>()
  private val pendingLoads = ConcurrentHashMap<Int, Promise>()
  private val loadedIds = java.util.Collections.synchronizedSet(mutableSetOf<Int>())

  override fun definition() = ModuleDefinition {
    Name("FretionarySoundPool")

    OnCreate {
      // USAGE_MEDIA + CONTENT_TYPE_MUSIC gives normal music routing
      // (respects volume rocker, plays through speakers/headphones).
      val attrs = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_MEDIA)
        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
        .build()

      val pool = SoundPool.Builder()
        // 16 = SoundPool's recommended cap. Fretionary needs <= 6 concurrent
        // (6-string chord strum) so 16 is comfortable headroom for any
        // overlap between strum decay and the next strum/scale note.
        .setMaxStreams(16)
        .setAudioAttributes(attrs)
        .build()

      pool.setOnLoadCompleteListener { _, soundId, status ->
        if (status == 0) loadedIds.add(soundId)
        val promise = pendingLoads.remove(soundId)
        if (promise != null) {
          if (status == 0) promise.resolve(null)
          else promise.reject("ERR_LOAD", "SoundPool load failed: status=$status", null)
        }
      }

      soundPool = pool
    }

    OnDestroy {
      releaseInternal()
    }

    AsyncFunction("loadFromUri") { name: String, uri: String, promise: Promise ->
      val pool = soundPool ?: run {
        promise.reject("ERR_NOT_READY", "SoundPool not initialized", null)
        return@AsyncFunction
      }
      // Expo Asset.localUri comes through as file:///path/to/file.mp3.
      // SoundPool.load(String, int) expects a bare filesystem path.
      val path = if (uri.startsWith("file://")) uri.removePrefix("file://") else uri
      val soundId = try {
        pool.load(path, 1)
      } catch (e: Exception) {
        promise.reject("ERR_LOAD", "Failed to load: ${e.message}", e)
        return@AsyncFunction
      }
      if (soundId == 0) {
        promise.reject("ERR_LOAD", "SoundPool.load returned 0 for $path", null)
        return@AsyncFunction
      }
      nameToSoundId[name] = soundId
      // The listener (registered in OnCreate) resolves this promise when
      // SoundPool finishes decoding the sample on its background thread.
      pendingLoads[soundId] = promise
    }

    Function("play") { name: String ->
      val pool = soundPool ?: return@Function false
      val soundId = nameToSoundId[name] ?: return@Function false
      if (!loadedIds.contains(soundId)) return@Function false
      // Args: soundID, leftVolume, rightVolume, priority, loop, rate.
      // priority 1 (low) — SoundPool reclaims oldest voice if all 16 are
      // active. loop 0 = play once. rate 1.0 = normal pitch.
      val streamId = pool.play(soundId, 1.0f, 1.0f, 1, 0, 1.0f)
      return@Function streamId != 0
    }

    Function("stopAll") {
      // autoPause halts every active voice in one call. We never call
      // autoResume — the next playback round starts fresh notes, and the
      // paused voices' slots get reclaimed by SoundPool's voice manager.
      soundPool?.autoPause()
    }

    Function("unloadAll") {
      releaseInternal()
    }
  }

  private fun releaseInternal() {
    soundPool?.release()
    soundPool = null
    nameToSoundId.clear()
    pendingLoads.clear()
    loadedIds.clear()
  }
}
