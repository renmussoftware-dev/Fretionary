import { useEffect, useState } from 'react';
import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY_IOS = 'appl_RISKMtoBkVaaMekfALDreNUNBRd'; // appl_...
const ENTITLEMENT_ID = 'Renmus Software LLC Pro';

export interface PurchaseState {
  isLoading: boolean;
  isPro: boolean;
  packages: PurchasesPackage[];
  customerInfo: CustomerInfo | null;
}

export function useRevenueCat() {
  const [state, setState] = useState<PurchaseState>({
    isLoading: true,
    isPro: false,
    packages: [],
    customerInfo: null,
  });

  useEffect(() => {
    async function init() {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        if (Platform.OS === 'ios') {
          Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });
        }

        // Get current customer info (checks if they already have pro)
        const customerInfo = await Purchases.getCustomerInfo();
        const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

        // Fetch available packages
        const offerings = await Purchases.getOfferings();
        const packages = offerings.current?.availablePackages ?? [];

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
      setState(s => ({ ...s, isPro, customerInfo }));
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
      setState(s => ({ ...s, isPro, customerInfo }));
      return isPro;
    } catch (e) {
      console.warn('Restore error:', e);
      return false;
    }
  }

  return { ...state, purchasePackage, restorePurchases };
}
