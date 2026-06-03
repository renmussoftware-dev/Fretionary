import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { PACKAGE_TYPE, INTRO_ELIGIBILITY_STATUS } from 'react-native-purchases';
import type { PurchasesPackage } from 'react-native-purchases';
import { COLORS, SPACE, RADIUS } from '../constants/theme';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { logPaywallView, logInitiateCheckout } from '../utils/analytics';

interface Props {
  onClose?: () => void;
  onSuccess?: () => void;
}

/**
 * Returns the trial length in days for a package, or 0 if none.
 *
 * iOS uses `product.introPrice` (free trial = price === 0).
 * Android Billing v5+ exposes the trial as `product.defaultOption.freePhase`
 * with an ISO-8601 billing period like "P7D" or "P1W". We parse both shapes
 * so the same paywall code works on both stores.
 */
function getTrialDays(pkg: PurchasesPackage): number {
  const product = pkg.product as any;

  // iOS-style intro offer
  const intro = product.introPrice;
  if (intro && intro.price === 0 && intro.periodNumberOfUnits > 0) {
    const n: number = intro.periodNumberOfUnits;
    switch (intro.periodUnit) {
      case 'DAY':   return n;
      case 'WEEK':  return n * 7;
      case 'MONTH': return n * 30;
      case 'YEAR':  return n * 365;
    }
  }

  // Android Google Play Billing v5+ default-offer free phase
  const period: string | undefined = product.defaultOption?.freePhase?.billingPeriod;
  if (period) {
    const m = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/.exec(period);
    if (m) {
      const y = +(m[1] || 0), mo = +(m[2] || 0), w = +(m[3] || 0), d = +(m[4] || 0);
      return y * 365 + mo * 30 + w * 7 + d;
    }
  }

  return 0;
}

/**
 * Whether to actually advertise a trial on this package. We don't promise a
 * trial to users we know are ineligible (already used theirs). UNKNOWN status
 * is treated leniently — same as eligible — so a transient network failure
 * doesn't hide the offer from new users.
 */
function showTrialFor(pkg: PurchasesPackage, eligibility: Record<string, INTRO_ELIGIBILITY_STATUS>): boolean {
  if (getTrialDays(pkg) === 0) return false;
  const status = eligibility[pkg.product.identifier];
  return status !== INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE;
}

export default function Paywall({ onClose, onSuccess }: Props) {
  const { isLoading, isPro, packages, eligibility, purchasePackage, restorePurchases } = useRevenueCat();
  // `?context=proactive` is passed when the paywall is presented by the
  // single-shot engagement trigger in _layout.tsx (rather than by the user
  // tapping a Pro-gated feature). Softens the headline from "Unlock" wall
  // to "Try Pro free" invitation — same screen, more inviting framing.
  const { context } = useLocalSearchParams<{ context?: string }>();
  const isProactive = context === 'proactive';
  const [purchasing, setPurchasing] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const didInitSelection = useRef(false);

  // Fire Meta ViewedContent funnel event the first time the paywall mounts
  // for this user session. Pairs with the server-side StartTrial/Subscribe
  // events that RevenueCat sends after a successful purchase.
  useEffect(() => {
    logPaywallView();
  }, []);

  // Sort packages: monthly, annual, lifetime
  const sorted = [...packages].sort((a, b) => {
    const order = [PACKAGE_TYPE.MONTHLY, PACKAGE_TYPE.ANNUAL, PACKAGE_TYPE.LIFETIME];
    return order.indexOf(a.packageType) - order.indexOf(b.packageType);
  });

  // Default the selected card to whichever package carries the free trial
  // (so users land on the trial-eligible option), falling back to Annual,
  // then the first package. Runs once after packages load; manual taps after
  // that are respected. This makes the default follow the store config —
  // move the trial between tiers and the default follows automatically.
  useEffect(() => {
    if (didInitSelection.current || sorted.length === 0) return;
    didInitSelection.current = true;
    const trialIdx = sorted.findIndex(p => showTrialFor(p, eligibility));
    const annualIdx = sorted.findIndex(p => p.packageType === PACKAGE_TYPE.ANNUAL);
    setSelectedIdx(trialIdx >= 0 ? trialIdx : annualIdx >= 0 ? annualIdx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, eligibility]);

  async function handlePurchase(pkg: PurchasesPackage) {
    const trialDays = showTrialFor(pkg, eligibility) ? getTrialDays(pkg) : 0;
    // Fire Meta InitiatedCheckout BEFORE the StoreKit/Play sheet appears — if
    // the user cancels at the system sheet we still want Meta to know they
    // intended to convert. The revenue event itself comes from RevenueCat.
    logInitiateCheckout({
      productId: pkg.product.identifier,
      price: pkg.product.price,
      currency: pkg.product.currencyCode,
      packageType: String(pkg.packageType).toLowerCase(),
    });
    setPurchasing(true);
    const success = await purchasePackage(pkg);
    setPurchasing(false);
    if (success) {
      const title = trialDays > 0 ? 'Your free trial has started! 🎸' : 'Welcome to Fretionary Pro! 🎸';
      const account = Platform.OS === 'ios' ? 'Apple ID' : 'Google';
      const body = trialDays > 0
        ? `Full access for ${trialDays} days. Cancel anytime in your ${account} settings before the trial ends to avoid being charged.`
        : 'You now have full access to all features.';
      Alert.alert(
        title,
        body,
        [{ text: 'Let\'s go!', onPress: () => {
          onSuccess?.();
          router.back(); // dismiss paywall — global isPro already updated
        }}]
      );
    }
  }

  async function handleRestore() {
    setPurchasing(true);
    const success = await restorePurchases();
    setPurchasing(false);
    if (success) {
      Alert.alert(
        'Purchases Restored',
        'Your Pro access has been restored.',
        [{ text: 'Let\'s go!', onPress: () => {
          onSuccess?.();
          router.back();
        }}]
      );
    } else {
      const account = Platform.OS === 'ios' ? 'Apple ID' : 'Google account';
      Alert.alert('No Purchases Found', `No previous purchases were found for this ${account}.`);
    }
  }

  function getPackageLabel(pkg: PurchasesPackage) {
    // Trial badge takes priority on whichever tier carries the offer — so the
    // "N-DAY FREE TRIAL" chip follows the store config without code changes.
    const trialDays = showTrialFor(pkg, eligibility) ? getTrialDays(pkg) : 0;
    const trialBadge = trialDays > 0 ? `${trialDays}-DAY FREE TRIAL` : null;
    switch (pkg.packageType) {
      case PACKAGE_TYPE.MONTHLY:  return { title: 'Monthly',  badge: trialBadge,             highlight: false };
      case PACKAGE_TYPE.ANNUAL:   return { title: 'Annual',   badge: trialBadge ?? 'BEST VALUE', highlight: true };
      case PACKAGE_TYPE.LIFETIME: return { title: 'Lifetime', badge: 'ONE TIME',             highlight: false };
      default:                    return { title: pkg.identifier, badge: trialBadge, highlight: false };
    }
  }

  function getFeatures(pkg: PurchasesPackage): string[] {
    const trialDays = showTrialFor(pkg, eligibility) ? getTrialDays(pkg) : 0;
    let base: string[];
    switch (pkg.packageType) {
      case PACKAGE_TYPE.MONTHLY:
        base = ['All 14 scales & modes', 'Full chord library (36 types)', 'All progressions', 'Real guitar audio'];
        break;
      case PACKAGE_TYPE.ANNUAL:
        base = ['Everything in Monthly', 'Save 48% vs monthly', 'Diatonic chord explorer', 'Custom progression builder'];
        break;
      case PACKAGE_TYPE.LIFETIME:
        base = ['Everything in Annual', 'Pay once, own forever', 'All future updates', 'No recurring charge'];
        break;
      default:
        base = [];
    }
    // Prepend the trial bullet to whichever tier currently carries the trial.
    return trialDays > 0 ? [`Free for ${trialDays} days, then auto-renews`, ...base] : base;
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.accent} size="large" />
          <Text style={styles.loadingText}>Loading offers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isPro) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.proWrap}>
          <Text style={styles.proEmoji}>🎸</Text>
          <Text style={styles.proTitle}>You're on Pro!</Text>
          <Text style={styles.proSub}>Full access to all Fretionary features.</Text>
          {onClose && (
            <TouchableOpacity style={styles.closeBtnPro} onPress={onClose}>
              <Text style={styles.closeBtnProText}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headline}>
          {isProactive && sorted.some(p => showTrialFor(p, eligibility))
            ? 'Try Pro free for 7 days.'
            : 'Unlock the full neck.'}
        </Text>
        <Text style={styles.subheadline}>
          {sorted.some(p => showTrialFor(p, eligibility))
            ? 'Try it free for 7 days. All scales. All chords. Real guitar audio.'
            : 'All scales. All chords. Real guitar audio.'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Package cards */}
        {sorted.length === 0 ? (
          <Text style={styles.noPackages}>No packages available. Check your RevenueCat configuration.</Text>
        ) : (
          sorted.map((pkg, i) => {
            const { title, badge, highlight } = getPackageLabel(pkg);
            const features = getFeatures(pkg);
            const selected = selectedIdx === i;

            return (
              <TouchableOpacity
                key={pkg.identifier}
                style={[styles.card, highlight && styles.cardHighlight, selected && styles.cardSelected]}
                onPress={() => setSelectedIdx(i)}
                activeOpacity={0.8}
              >
                {badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                )}
                <View style={styles.cardTop}>
                  <Text style={[styles.cardTitle, highlight && styles.cardTitleHighlight]}>{title}</Text>
                  <View style={styles.priceWrap}>
                    <Text style={[styles.price, highlight && styles.priceHighlight]}>
                      {pkg.product.priceString}
                    </Text>
                    <Text style={styles.pricePer}>
                      {pkg.packageType === PACKAGE_TYPE.MONTHLY ? '/month'
                        : pkg.packageType === PACKAGE_TYPE.ANNUAL ? '/year'
                        : ' one time'}
                    </Text>
                  </View>
                </View>
                <View style={styles.divider} />
                {features.map((f, fi) => (
                  <View key={fi} style={styles.featureRow}>
                    <Text style={[styles.check, highlight && styles.checkHighlight]}>✓</Text>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
                {selected && (
                  <View style={styles.selectedDot} />
                )}
              </TouchableOpacity>
            );
          })
        )}

        {/* Free tier note */}
        <View style={styles.freeNote}>
          <Text style={styles.freeNoteText}>✓  Free tier always available — no credit card required</Text>
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={[styles.ctaBtn, purchasing && styles.ctaBtnDisabled]}
          onPress={() => sorted[selectedIdx] && handlePurchase(sorted[selectedIdx])}
          disabled={purchasing || sorted.length === 0}
          activeOpacity={0.85}
        >
          {purchasing
            ? <ActivityIndicator color="#1a1400" />
            : <Text style={styles.ctaText}>
                {(() => {
                  const pkg = sorted[selectedIdx];
                  if (!pkg) return 'Subscribe';
                  if (showTrialFor(pkg, eligibility)) {
                    const d = getTrialDays(pkg);
                    return `Start ${d}-Day Free Trial`;
                  }
                  if (pkg.packageType === PACKAGE_TYPE.LIFETIME)  return 'Buy Lifetime Access';
                  if (pkg.packageType === PACKAGE_TYPE.MONTHLY)   return 'Subscribe Monthly';
                  if (pkg.packageType === PACKAGE_TYPE.ANNUAL)    return 'Subscribe Annually';
                  return 'Subscribe';
                })()}
              </Text>
          }
        </TouchableOpacity>

        {/* Restore + legal */}
        <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn} disabled={purchasing}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          {(() => {
            const hasTrial = sorted.some(p => showTrialFor(p, eligibility));
            const trialSentence = hasTrial
              ? ' Plans with a free trial are free for the trial period; the subscription then automatically converts to the standard recurring price unless cancelled at least 24 hours before the trial ends. No charge is made during the trial if cancelled in time.'
              : '';
            return Platform.OS === 'ios'
              ? `Fretionary Pro — Monthly or Annual auto-renewable subscription.${trialSentence} Payment will be charged to your Apple ID at confirmation of purchase. Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. Manage or cancel subscriptions in your App Store account settings after purchase.`
              : `Fretionary Pro — Monthly or Annual auto-renewing subscription.${trialSentence} Payment will be charged to your Google account at confirmation of purchase. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. Manage or cancel subscriptions in the Google Play Store under Subscriptions after purchase.`;
          })()}
        </Text>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('https://fretionary.com/privacy')}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}> · </Text>
          <TouchableOpacity onPress={() => Linking.openURL(
            Platform.OS === 'ios'
              ? 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
              : 'https://fretionary.com/terms'
          )}>
            <Text style={styles.legalLink}>Terms of Use</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACE.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.bg },
  loadingWrap:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText:      { color: COLORS.textMuted, fontSize: 14 },
  proWrap:          { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: SPACE.xl },
  proEmoji:         { fontSize: 64 },
  proTitle:         { fontSize: 28, fontWeight: '700', color: COLORS.text },
  proSub:           { fontSize: 15, color: COLORS.textMuted, textAlign: 'center' },
  closeBtnPro:      { marginTop: SPACE.xl, backgroundColor: COLORS.accent, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 100 },
  closeBtnProText:  { color: '#1a1400', fontWeight: '700', fontSize: 15 },

  header:           { padding: SPACE.lg, paddingBottom: SPACE.md, alignItems: 'center', position: 'relative' },
  closeBtn:         { position: 'absolute', right: SPACE.lg, top: SPACE.lg, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeBtnText:     { color: COLORS.textMuted, fontSize: 18 },
  headline:         { fontSize: 28, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 6 },
  subheadline:      { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },

  scroll:           { padding: SPACE.lg },

  noPackages:       { color: COLORS.textMuted, textAlign: 'center', padding: SPACE.xl, lineHeight: 22 },

  card:             { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, padding: SPACE.lg, marginBottom: SPACE.md, position: 'relative' },
  cardHighlight:    { borderColor: COLORS.accent, backgroundColor: '#18160a' },
  cardSelected:     { borderWidth: 2 },

  badge:            { position: 'absolute', top: -14, alignSelf: 'center', backgroundColor: COLORS.accent, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 100 },
  badgeText:        { fontSize: 10, fontWeight: '800', color: '#1a1400', letterSpacing: 1 },

  cardTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE.md },
  cardTitle:        { fontSize: 18, fontWeight: '700', color: COLORS.text },
  cardTitleHighlight: { color: COLORS.accent },
  priceWrap:        { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  price:            { fontSize: 24, fontWeight: '800', color: COLORS.text },
  priceHighlight:   { color: COLORS.accent },
  pricePer:         { fontSize: 12, color: COLORS.textMuted },

  divider:          { height: 1, backgroundColor: COLORS.border, marginBottom: SPACE.md },

  featureRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  check:            { color: COLORS.textMuted, fontWeight: '700', fontSize: 13 },
  checkHighlight:   { color: COLORS.accent },
  featureText:      { fontSize: 13, color: COLORS.textMuted, flex: 1 },

  selectedDot:      { position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },

  freeNote:         { alignItems: 'center', paddingVertical: SPACE.md },
  freeNoteText:     { fontSize: 12, color: COLORS.textMuted },

  ctaBtn:           { backgroundColor: COLORS.accent, borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginBottom: SPACE.md },
  ctaBtnDisabled:   { opacity: 0.6 },
  ctaText:          { color: '#1a1400', fontWeight: '700', fontSize: 16 },

  restoreBtn:       { alignItems: 'center', paddingVertical: SPACE.sm },
  restoreText:      { color: COLORS.textMuted, fontSize: 13 },

  legal:            { fontSize: 10, color: COLORS.textFaint, textAlign: 'center', lineHeight: 15, marginTop: SPACE.lg, paddingHorizontal: SPACE.md },
  legalLinks:       { flexDirection: 'row', justifyContent: 'center', marginTop: SPACE.sm },
  legalLink:        { fontSize: 11, color: COLORS.textMuted },
  legalDot:         { fontSize: 11, color: COLORS.textFaint },
});
