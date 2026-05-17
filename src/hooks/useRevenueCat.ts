import { useEffect, useState } from 'react';
import Purchases, {
  LOG_LEVEL,
  PurchasesPackage,
  CustomerInfo,
  INTRO_ELIGIBILITY_STATUS,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { useStore } from '../store/useStore';
import { linkFacebookAnonymousIDToRevenueCat } from '../utils/analytics';

const REVENUECAT_API_KEY_IOS = 'appl_RISKMtoBkVaaMekfALDreNUNBRd';
const REVENUECAT_API_KEY_ANDROID = 'goog_YTZzYwiWGFshnxkHZSAyNLckZQb';
const ENTITLEMENT_ID = 'Renmus Software LLC Pro';

export interface PurchaseState {
  isLoading: boolean;
  isPro: boolean;
  packages: PurchasesPackage[];
  customerInfo: CustomerInfo | null;
  /**
   * Per-product trial/intro-offer eligibility. Keyed by store product
   * identifier. Falsy/missing entries should be treated as "unknown" — paywall
   * UI is lenient and still shows trial copy when unknown so a transient
   * network issue doesn't hide the offer from new users.
   */
  eligibility: Record<string, INTRO_ELIGIBILITY_STATUS>;
}

export function useRevenueCat() {
  const setIsPro = useStore(s => s.setIsPro);
  const [state, setState] = useState<PurchaseState>({
    isLoading: true,
    isPro: false,
    packages: [],
    customerInfo: null,
    eligibility: {},
  });

  function updatePro(isPro: boolean, customerInfo: CustomerInfo) {
    setIsPro(isPro); // sync to global store immediately
    setState(s => ({ ...s, isPro, customerInfo }));
  }

  useEffect(() => {
    async function init() {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        if (Platform.OS === 'ios') {
          Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });
        } else if (Platform.OS === 'android') {
          Purchases.configure({ apiKey: REVENUECAT_API_KEY_ANDROID });
        }

        // Pass the Facebook SDK's anonymous ID through so RevenueCat can
        // tag the server-side subscription events it forwards to Meta with
        // the same install identifier as our SDK funnel events. Improves
        // match rate dramatically for users who decline ATT. Fire-and-forget
        // — we don't want this to delay paywall package loading.
        linkFacebookAnonymousIDToRevenueCat();

        const customerInfo = await Purchases.getCustomerInfo();
        const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        const offerings = await Purchases.getOfferings();
        const packages = offerings.current?.availablePackages ?? [];

        // Eligibility — used to gate "free trial" copy in the paywall so that
        // users who've already used their intro offer don't see a misleading
        // promise. Defensive: if this fails or returns nothing, the paywall
        // falls back to showing trial copy anyway.
        let eligibility: Record<string, INTRO_ELIGIBILITY_STATUS> = {};
        try {
          const productIds = packages.map(p => p.product.identifier);
          if (productIds.length > 0) {
            const map = await Purchases.checkTrialOrIntroductoryPriceEligibility(productIds);
            eligibility = Object.fromEntries(
              Object.entries(map).map(([id, info]) => [id, info.status]),
            );
          }
        } catch (e) {
          console.warn('Eligibility check failed:', e);
        }

        setIsPro(isPro);
        setState({ isLoading: false, isPro, packages, customerInfo, eligibility });
      } catch (e) {
        console.warn('RevenueCat init error:', e);
        setState(s => ({ ...s, isLoading: false }));
      }
    }

    init();
  }, []);

  async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      updatePro(isPro, customerInfo);
      return isPro;
    } catch (e: any) {
      if (!e.userCancelled) {
        console.warn('Purchase error:', e);
      }
      return false;
    }
  }

  async function restorePurchases(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      updatePro(isPro, customerInfo);
      return isPro;
    } catch (e) {
      console.warn('Restore error:', e);
      return false;
    }
  }

  return { ...state, purchasePackage, restorePurchases };
}
