import Purchases from "react-native-purchases";
import { Platform } from "react-native";

/**
 * 🔑 Clés RevenueCat (SDK API keys)
 * -> celles visibles dans RevenueCat dashboard
 */

const RC_API_KEY_ANDROID = "rc_public_xxxxxxxxxxxxx";
const RC_API_KEY_IOS = "appl_public_xxxxxxxxxxxxx";

/**
 * 🎯 Entitlement créé dans RevenueCat
 */
export const ENTITLEMENT_ID = "pro";

/**
 * ✅ Initialisation RevenueCat
 */
export const initRevenueCat = async () => {
  try {
    const apiKey =
      Platform.OS === "android"
        ? RC_API_KEY_ANDROID
        : RC_API_KEY_IOS;

    await Purchases.configure({ apiKey });

    console.log("✅ RevenueCat initialisé");
  } catch (e) {
    console.log("❌ RevenueCat init error", e);
  }
};

/**
 * ✅ Vérifie si utilisateur Pro
 */
export async function getIsPro(): Promise<boolean> {
  const info = await Purchases.getCustomerInfo();
  return !!info.entitlements.active[ENTITLEMENT_ID];
}

/**
 * ✅ Récupère abonnement disponible
 */
export async function getMonthlyPackage() {
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;

  if (!current) return null;

  return current.availablePackages?.[0] ?? null;
}

/**
 * ✅ Achat abonnement
 */
export async function purchasePackage(pkg: any) {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
}

/**
 * ✅ Restaurer achats
 */
export async function restorePurchases() {
  const info = await Purchases.restorePurchases();
  return !!info.entitlements.active[ENTITLEMENT_ID];
}