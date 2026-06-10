/**
 * Shared support contact helpers — used by the Support tab in Tools and the
 * "Contact support" link in the paywall.
 *
 * Bug reports come in pre-tagged with app version + platform info so we never
 * have to follow up asking "what version are you on?"
 */

import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';

export const SUPPORT_EMAIL = 'renmussoftware@gmail.com';

// App Store / Play Store identifiers — used for the rate-app deep links.
const IOS_APP_ID = '6761344883';
const ANDROID_PACKAGE = 'com.renmussoftware.nodi';

/**
 * Build a mailto: URL with device + app context auto-attached at the bottom
 * of the body. The cursor lands above the divider so the user types their
 * issue in the empty space; the diagnostics are filled in for them.
 */
function buildSupportMailto(): string {
  const appVersion = Constants.expoConfig?.version ?? 'unknown';
  const platform = Platform.OS;
  const osVersion = String(Platform.Version);
  const subject = 'Fretionary Support';
  const body = [
    '',
    '',
    '— — — — — — — — — — —',
    'Describe what you were doing and what went wrong above.',
    '',
    `App version: ${appVersion}`,
    `Platform: ${platform} ${osVersion}`,
  ].join('\n');
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Open the user's mail client with a pre-filled support email. Falls back to
 * an Alert with the plain-text address if no mail app is configured on the
 * device (rare but possible — some users have removed Mail.app).
 */
export async function openSupportEmail(): Promise<void> {
  const url = buildSupportMailto();
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
      return;
    }
  } catch {
    // fall through to fallback alert
  }
  Alert.alert(
    'No email app found',
    `Please email us at:\n\n${SUPPORT_EMAIL}\n\nInclude your device and app version if you're reporting a bug.`,
    [{ text: 'OK' }],
  );
}

/**
 * Manually-triggered review prompt. Tries the inline iOS/Android system
 * review dialog first (best UX — no app switch). If unavailable OR if the
 * OS silently throttles (Apple caps at 3 prompts per user per year), the
 * user gets nothing visible, so we ALSO offer a store-URL fallback below.
 *
 * `requestReview()` is fire-and-forget from our side — there's no way to
 * know whether the system actually displayed the dialog due to OS throttling.
 */
export async function requestInlineReview(): Promise<void> {
  try {
    const available = await StoreReview.isAvailableAsync();
    if (available) {
      await StoreReview.requestReview();
    }
  } catch {
    // swallow — the deep-link fallback in the UI is the alternative
  }
}

/**
 * Open the App Store / Play Store page for Fretionary, scrolled to the
 * write-a-review surface where possible. Used as a manual fallback when the
 * inline review prompt may have been throttled.
 */
export async function openStoreReview(): Promise<void> {
  const url = Platform.OS === 'ios'
    ? `itms-apps://itunes.apple.com/app/id${IOS_APP_ID}?action=write-review`
    : `market://details?id=${ANDROID_PACKAGE}`;
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
      return;
    }
  } catch {
    // fall through to https fallback
  }
  // Plain https fallback if the store-app scheme isn't supported (sim, etc.)
  const httpsUrl = Platform.OS === 'ios'
    ? `https://apps.apple.com/app/id${IOS_APP_ID}`
    : `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
  Linking.openURL(httpsUrl);
}
