import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PACKAGE_TYPE } from 'react-native-purchases';
import type { PurchasesPackage } from 'react-native-purchases';
import { COLORS, SPACE, RADIUS } from '../constants/theme';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { logPaywallView, logInitiateCheckout } from '../utils/analytics';
import { openSupportEmail } from '../utils/support';
import { useStore } from '../store/useStore';

interface Props {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function Paywall({ onClose, onSuccess }: Props) {
  const { isLoading, isPro, packages, purchasePackage, restorePurchases } = useRevenueCat();
  const recordPositiveAction = useStore(s => s.recordPositiveAction);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const didInitSelection = useRef(false);

  // Fire Meta ViewedContent funnel event the first time the paywall mounts
  // for this user session. Pairs with the server-side Subscribe/Purchase
  // events that RevenueCat sends after a successful purchase.
  useEffect(() => {
    logPaywallView();
  }, []);

  // Monetization model is monthly subscription + lifetime one-time purchase.
  // Filter out any other package types defensively — if Annual is still in
  // the RevenueCat offering during the transition, it won't render here.
  // Monthly first (lower-commitment entry point), Lifetime second
  // (featured with "BEST VALUE" badge for users ready to commit).
  const sorted = [...packages]
    .filter(p => p.packageType === PACKAGE_TYPE.MONTHLY || p.packageType === PACKAGE_TYPE.LIFETIME)
    .sort((a, b) => {
      const order = [PACKAGE_TYPE.MONTHLY, PACKAGE_TYPE.LIFETIME];
      return order.indexOf(a.packageType) - order.indexOf(b.packageType);
    });

  // Default the selected card to Monthly (lower commitment = better
  // conversion for low-conviction users). Lifetime is visually featured
  // via the "BEST VALUE" badge as a soft signal of the better long-term
  // value, but we don't pre-select it — that would feel pushy. Runs once
  // after packages load; manual taps after that are respected.
  useEffect(() => {
    if (didInitSelection.current || sorted.length === 0) return;
    didInitSelection.current = true;
    const monthlyIdx = sorted.findIndex(p => p.packageType === PACKAGE_TYPE.MONTHLY);
    setSelectedIdx(monthlyIdx >= 0 ? monthlyIdx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted]);

  async function handlePurchase(pkg: PurchasesPackage) {
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
      // Successful purchase is a strong engagement signal — bump the counter
      // so the system review prompt fires sooner on a subsequent launch
      // (still subject to the install-age + last-prompted throttles in
      // recordPositiveAction; we never prompt for a review *during* the
      // celebration moment itself).
      recordPositiveAction();
      Alert.alert(
        'Welcome to Fretionary Pro! 🎸',
        'You now have full access to all features.',
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
    switch (pkg.packageType) {
      case PACKAGE_TYPE.MONTHLY:  return { title: 'Monthly',  badge: null,         highlight: false };
      case PACKAGE_TYPE.LIFETIME: return { title: 'Lifetime', badge: 'BEST VALUE', highlight: true };
      default:                    return { title: pkg.identifier, badge: null, highlight: false };
    }
  }

  function getFeatures(pkg: PurchasesPackage): string[] {
    switch (pkg.packageType) {
      case PACKAGE_TYPE.MONTHLY:
        return [
          'All 14 scales & modes',
          'Full chord library (36 types)',
          'All progressions',
          'Real guitar audio',
          'Cancel anytime',
        ];
      case PACKAGE_TYPE.LIFETIME:
        return [
          'Everything in Monthly',
          'Pay once, own forever',
          'All future updates',
          'No recurring charge',
        ];
      default:
        return [];
    }
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
        <Text style={styles.headline}>Unlock the full neck.</Text>
        <Text style={styles.subheadline}>All scales. All chords. Real guitar audio.</Text>
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
                style={[styles.card, selected && styles.cardSelected]}
                onPress={() => setSelectedIdx(i)}
                activeOpacity={0.8}
              >
                {badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                )}
                <View style={styles.cardTop}>
                  {/* Radio indicator + title share the left side. The radio is
                      the unambiguous "this is selected" affordance — replaces
                      the old tiny corner dot, which read as decoration. */}
                  <View style={styles.titleRow}>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.cardTitle, highlight && styles.cardTitleHighlight]}>{title}</Text>
                  </View>
                  <View style={styles.priceWrap}>
                    <Text style={[styles.price, highlight && styles.priceHighlight]}>
                      {pkg.product.priceString}
                    </Text>
                    <Text style={styles.pricePer}>
                      {pkg.packageType === PACKAGE_TYPE.MONTHLY ? '/month' : ' one time'}
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
                  if (pkg.packageType === PACKAGE_TYPE.LIFETIME) return 'Buy Lifetime Access';
                  if (pkg.packageType === PACKAGE_TYPE.MONTHLY)  return 'Subscribe Monthly';
                  return 'Subscribe';
                })()}
              </Text>
          }
        </TouchableOpacity>

        {/* Restore + support + legal */}
        <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn} disabled={purchasing}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={openSupportEmail} style={styles.supportLink} activeOpacity={0.7}>
          <Text style={styles.supportLinkText}>
            Questions? <Text style={styles.supportLinkAccent}>Contact support</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          {Platform.OS === 'ios'
            ? 'Fretionary Pro — Monthly auto-renewable subscription or one-time Lifetime purchase. Payment will be charged to your Apple ID at confirmation of purchase. Monthly subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. Manage or cancel subscriptions in your App Store account settings after purchase.'
            : 'Fretionary Pro — Monthly auto-renewing subscription or one-time Lifetime purchase. Payment will be charged to your Google account at confirmation of purchase. Monthly subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. Manage or cancel subscriptions in the Google Play Store under Subscriptions after purchase.'}
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

  // Default border is already 2px so selection toggles only color, not width
  // (no layout shift when the user taps between cards).
  card:             { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 2, borderColor: COLORS.border, padding: SPACE.lg, marginBottom: SPACE.md, position: 'relative' },
  // Selection is the single dominant visual signal — accent border + soft
  // accent tint. Lifetime keeps the BEST VALUE badge and accent-colored
  // title/price/checks as softer "recommended" cues, but no static border
  // override (which used to outweigh the actual selection state).
  cardSelected:     { borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },

  badge:            { position: 'absolute', top: -14, alignSelf: 'center', backgroundColor: COLORS.accent, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 100 },
  badgeText:        { fontSize: 10, fontWeight: '800', color: '#1a1400', letterSpacing: 1 },

  cardTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE.md },
  titleRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radio:            { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.borderLight, alignItems: 'center', justifyContent: 'center' },
  radioSelected:    { borderColor: COLORS.accent },
  radioDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
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

  freeNote:         { alignItems: 'center', paddingVertical: SPACE.md },
  freeNoteText:     { fontSize: 12, color: COLORS.textMuted },

  ctaBtn:           { backgroundColor: COLORS.accent, borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginBottom: SPACE.md },
  ctaBtnDisabled:   { opacity: 0.6 },
  ctaText:          { color: '#1a1400', fontWeight: '700', fontSize: 16 },

  restoreBtn:       { alignItems: 'center', paddingVertical: SPACE.sm },
  restoreText:      { color: COLORS.textMuted, fontSize: 13 },

  supportLink:      { alignItems: 'center', paddingVertical: 4 },
  supportLinkText:  { color: COLORS.textMuted, fontSize: 12 },
  supportLinkAccent:{ color: COLORS.accent, fontWeight: '600' },

  legal:            { fontSize: 10, color: COLORS.textFaint, textAlign: 'center', lineHeight: 15, marginTop: SPACE.lg, paddingHorizontal: SPACE.md },
  legalLinks:       { flexDirection: 'row', justifyContent: 'center', marginTop: SPACE.sm },
  legalLink:        { fontSize: 11, color: COLORS.textMuted },
  legalDot:         { fontSize: 11, color: COLORS.textFaint },
});
