import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from '../src/components/Onboarding';

const ONBOARDING_KEY = 'fretionary_onboarded_v1';

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // Set audio mode at app root so it's active before any tab loads
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {});

    // Check if onboarding has been completed
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setShowOnboarding(val === null);
    }).catch(() => setShowOnboarding(false));
  }, []);

  async function finishOnboarding() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'done').catch(() => {});
    setShowOnboarding(false);
  }

  // Wait until we know whether to show onboarding
  if (showOnboarding === null) return null;

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
