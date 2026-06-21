// Enable R8 minification in Android release builds.
//
// Why this isn't just `expo-build-properties.android.enableProguardInReleaseBuilds`:
// that plugin still writes the legacy Gradle property name
// `android.enableProguardInReleaseBuilds`, but Expo SDK 54's bundled React
// Native 0.81 template renamed the property to
// `android.enableMinifyInReleaseBuilds`. The legacy key is read by nothing,
// so the plugin's flag is a silent no-op. This plugin writes the new key
// directly via withGradleProperties, which is what build.gradle actually
// reads when wiring `minifyEnabled`.
//
// Keep this in app.json's plugins alongside expo-build-properties — the
// latter still does useful work (compileSdkVersion, shrinkResources, etc.).
const { withGradleProperties } = require('@expo/config-plugins');

const KEY = 'android.enableMinifyInReleaseBuilds';

function withMinifyRelease(config) {
  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const existing = props.find((p) => p.type === 'property' && p.key === KEY);
    if (existing) {
      existing.value = 'true';
    } else {
      props.push({ type: 'property', key: KEY, value: 'true' });
    }
    return cfg;
  });
}

module.exports = withMinifyRelease;
