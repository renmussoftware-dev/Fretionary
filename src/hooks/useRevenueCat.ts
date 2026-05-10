import { useEffect, useState } from 'react';
import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import { useStore } from '../store/useStore';

const REVENUECAT_API_KEY_IOS = 'appl_RISKMtoBkVaaMekfALDreNUNBRd';
const REVENUECAT_API_KEY_ANDROID = 'goog_YTZzYwiWGFshnxkHZSAyNLckZQb';
const ENTITLEMENT_ID = 'Renmus Software LLC Pro';

export interface PurchaseState {
  isLoading: boolean;
  isPro: boolean;
  packages: PurchasesPackage[];
  customerInfo: CustomerInfo | null;
}

export function useRevenueCat() {
  const setIsPro = useStore(s => s.setIsPro);
  const [state, setState] = useState<PurchaseState>({
    isLoading: true,
    isPro: false,
    packages: [],
    customerInfo: null,
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

        const customerInfo = await Purchases.getCustomerInfo();
        const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        const offerings = await Purchases.getOfferings();
        const packages = offerings.current?.availablePackages ?? [];

        setIsPro(isPro);
        setState({ isLoading: false, isPro, packages, customerInfo });
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
