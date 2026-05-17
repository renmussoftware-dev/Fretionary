import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import Onboarding from '../src/components/Onboarding';
import { initAnalytics, maybePromptATT, logTutorialComplete } from '../src/utils/analytics';

const ONBOARDING_KEY = 'fretionary_onboarded_v1';

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [fontsLoaded] = useFonts({
    // Map all four weights to a single family alias matching FONT_FAMILY.mono
    // in theme.ts. RN picks the right weight via the `fontWeight` style.
    JetBrainsMono: JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    // Set audio mode at app root so it's active before any tab loads
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {});

    // Initialize Meta SDK (syncs advertiser-tracking with current ATT status —
    // does NOT prompt). Safe to call before ATT decision; we re-sync after.
    initAnalytics();

    // Check if onboarding has been completed
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setShowOnboarding(val === null);
    }).catch(() => setShowOnboarding(false));
  }, []);

  // For existing users who already completed onboarding before the SDK
  // shipped, prompt ATT on first launch of the new app version. New users
  // hit this same code path via finishOnboarding(). maybePromptATT is
  // single-flight + idempotent so calling it from both places is safe.
  useEffect(() => {
    if (showOnboarding === false) {
      maybePromptATT();
    }
  }, [showOnboarding]);

  async function finishOnboarding() {
    // Prompt ATT now — user has just seen the value, this is the natural
    // moment per Apple's guidance. Then log the tutorial-completion funnel
    // event before transitioning to the main app.
    await maybePromptATT();
    logTutorialComplete();
    await AsyncStorage.setItem(ONBOARDING_KEY, 'done').catch(() => {});
    setShowOnboarding(false);
  }

  // Wait until we know whether to show onboarding AND fonts have loaded
  if (showOnboarding === null || !fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      {showOnboarding ? (
        <Onboarding onDone={finishOnboarding} />
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="paywall"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
