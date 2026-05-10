# Data Safety form — answers

> **Be honest.** Google penalizes inaccurate data-safety declarations with app removal. Below reflects the actual data flows in Fretionary.

## Section 1 — Does your app collect or share any of the required user data types?

**Answer: Yes**

(Even though we collect almost nothing, we still need to declare the purchase data flowing through Google Play Billing → RevenueCat for subscription validation.)

## Section 2 — Is all of the user data collected by your app encrypted in transit?

**Answer: Yes**

Both Google Play Billing (Google's own infrastructure) and RevenueCat use HTTPS for all server communication.

## Section 3 — Do you provide a way for users to request that their data be deleted?

**Answer: Yes**

Users can:
- Cancel their subscription via the Google Play Store → Subscriptions
- Request RevenueCat data deletion by emailing the support address listed in the app
- Uninstalling the app removes all locally-stored data (favorites, recents, settings) since it's all in AsyncStorage on the device

---

## Section 4 — Data types collected

### Financial info → **Purchase history** ✅
- **Collected**: Yes
- **Shared with third parties**: No (RevenueCat is a service provider, not a third-party recipient)
- **Optional or required**: Required (subscription Pro tier requires purchase history)
- **Why collected**: App functionality (validating active Pro subscription)
- **Processed ephemerally**: No (subscription state is persistent)

### Everything else
- **No**: Personal info (name, email, address, IDs, phone, race/ethnicity, sexual orientation, religion, political views, etc.)
- **No**: Location (precise or approximate)
- **No**: Web browsing history
- **No**: App activity (interactions, in-app search history, installed apps, other user-generated content)
- **No**: App info and performance (crash logs, diagnostics, other app performance data)
   - *Note: Verify this once before submitting. If you've enabled Sentry, EAS Insights, or any analytics SDK at any point, declare it. As of the current package.json there's no analytics or crash-reporting SDK installed.*
- **No**: Device or other IDs (advertising ID, device ID)
- **No**: Photos, videos, audio (we play sampled audio assets bundled in the app — that's not "user data")
- **No**: Files and docs
- **No**: Calendar
- **No**: Contacts
- **No**: Health and fitness
- **No**: Messages
- **No**: Microphone (we removed the mic-based tuner)
- **No**: User-generated content
- **No**: Other types

---

## Quick check before submitting

Run a quick mental audit:
1. ✅ No mic permission in app.json (we removed it)
2. ✅ No location permission
3. ✅ No camera permission
4. ✅ Only purchase data via Google Play Billing
5. ✅ AsyncStorage data is local-only (favorites, recents, etc.) — not "collected" in Google's definition
