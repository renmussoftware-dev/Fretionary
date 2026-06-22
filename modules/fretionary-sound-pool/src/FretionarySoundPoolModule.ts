import { Platform } from 'react-native';
import { requireNativeModule } from 'expo';

interface FretionarySoundPoolNative {
  loadFromUri(name: string, uri: string): Promise<void>;
  play(name: string): boolean;
  stopAll(): void;
  unloadAll(): void;
}

// The native module exists only on Android (expo-module.config.json restricts
// platforms to ["android"]). On iOS, requireNativeModule would throw because
// nothing is registered — we shouldn't even invoke it. Each exported helper
// below short-circuits when the module is null so callers can stay
// platform-agnostic.
const nativeModule: FretionarySoundPoolNative | null =
  Platform.OS === 'android'
    ? requireNativeModule<FretionarySoundPoolNative>('FretionarySoundPool')
    : null;

export function loadSound(name: string, uri: string): Promise<void> {
  return nativeModule ? nativeModule.loadFromUri(name, uri) : Promise.resolve();
}

export function playSound(name: string): boolean {
  return nativeModule ? nativeModule.play(name) : false;
}

export function stopAllSounds(): void {
  nativeModule?.stopAll();
}

export function unloadAllSounds(): void {
  nativeModule?.unloadAll();
}

export default nativeModule;
