import Purchases, { PurchasesPackage } from "react-native-purchases";
import { Platform } from "react-native";

// ⚠️ Mets tes vraies clés RevenueCat ici (Project settings > API keys)
const RC_API_KEY_ANDROID = "test_fzsebNzeBOlLVYJwDDYQJpXnyum";
const RC_API_KEY_IOS = "appl_public_xxxxxxxxxxxxx";

export const ENTITLEMENT_ID = "pro";

/**
 * ✅ Initialisation RevenueCat
 */
export async function initRevenueCat() {
  try {
    const apiKey = Platform.OS === "android" ? RC_API_KEY_ANDROID : RC_API_KEY_IOS;

    await Purchases.configure({ apiKey });

    // Optionnel (utile en debug)
    // Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

    console.log("✅ RevenueCat initialisé");
  } catch (e) {
    console.log("❌ RevenueCat init error", e);
  }
}

/**
 * ✅ Vérifie si utilisateur Pro
 */
export async function getIsPro(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active?.[ENTITLEMENT_ID];
  } catch (e) {
    console.log("❌ getIsPro error", e);
    return false;
  }
}

/**
 * ✅ Récupère l'offre "monthly" (si elle existe)
 */
export async function getMonthlyPackage(): Promise<PurchasesPackage | null> {
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return null;

    // Cherche explicitement le package mensuel
    const monthly =
      current.availablePackages.find((p) => p.packageType === "MONTHLY") ?? null;

    return monthly;
  } catch (e) {
    console.log("❌ getMonthlyPackage error", e);
    return null;
  }
}

/**
 * ✅ Achat abonnement
 */
export async function purchasePackage(pkg: PurchasesPackage) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return !!customerInfo.entitlements.active?.[ENTITLEMENT_ID];
  } catch (e) {
    console.log("❌ purchasePackage error", e);
    return false;
  }
}

/**
 * ✅ Restaurer achats
 */
export async function restorePurchases() {
  try {
    const info = await Purchases.restorePurchases();
    return !!info.entitlements.active?.[ENTITLEMENT_ID];
  } catch (e) {
    console.log("❌ restorePurchases error", e);
    return false;
  }
}