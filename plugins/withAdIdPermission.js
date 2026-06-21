// Force the com.google.android.gms.permission.AD_ID permission into the
// merged AndroidManifest with tools:node="replace". Background:
// react-native-fbsdk-next 13.x bundles a manifest that declares this same
// permission with tools:node="remove" (to let apps opt out by default), so
// the standard Expo `android.permissions` array gets stripped during merge.
// With tools:node="replace", our declaration wins the merge and the Meta
// SDK can read the Advertising ID on Android 13+ for ad attribution.
//
// Without this, Play Console raises:
//   "A manifest file in one of your active artifacts doesn't include the
//    com.google.android.gms.permission.AD_ID permission."
// and the advertising identifier gets zeroed out, silently breaking
// attribution.
const { withAndroidManifest } = require('@expo/config-plugins');

const AD_ID = 'com.google.android.gms.permission.AD_ID';
const TOOLS_NS = 'http://schemas.android.com/tools';

function withAdIdPermission(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    manifest.$ = manifest.$ || {};
    if (!manifest.$['xmlns:tools']) manifest.$['xmlns:tools'] = TOOLS_NS;

    manifest['uses-permission'] = manifest['uses-permission'] || [];

    const existing = manifest['uses-permission'].find(
      (p) => p && p.$ && p.$['android:name'] === AD_ID,
    );

    if (existing) {
      existing.$['tools:node'] = 'replace';
    } else {
      manifest['uses-permission'].push({
        $: {
          'android:name': AD_ID,
          'tools:node': 'replace',
        },
      });
    }

    return cfg;
  });
}

module.exports = withAdIdPermission;
