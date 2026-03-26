import Purchases, {
  PurchasesPackage,
  LOG_LEVEL,
  CustomerInfo,
  PACKAGE_TYPE,
} from "react-native-purchases";
import { Platform } from "react-native";

const RC_API_KEY_ANDROID = "goog_aYUOMVsfDoVLwzORZxkMgIgieFm";
const RC_API_KEY_IOS = "test_fzsebNzeBOlLVYJwDDYQJpXnyum";

export const ENTITLEMENT_ID = "FITNESS DIET Pro";

function getRevenueCatApiKey() {
  const key = Platform.OS === "android" ? RC_API_KEY_ANDROID : RC_API_KEY_IOS;
  console.log("RC PLATFORM =", Platform.OS);
  console.log("RC KEY USED =", key);
  return key;
}

export async function initRevenueCat() {
  const apiKey = getRevenueCatApiKey();

  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  await Purchases.configure({ apiKey });

  console.log("✅ RevenueCat initialisé");
}

export async function getCustomerInfoSafe(): Promise<CustomerInfo | null> {
  try {
    const info = await Purchases.getCustomerInfo();
    return info;
  } catch (e) {
    console.log("❌ getCustomerInfo error", e);
    return null;
  }
}

export async function getIsPro(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    console.log("ENTITLEMENTS:", info.entitlements.active);
    return !!info.entitlements.active?.[ENTITLEMENT_ID];
  } catch (e) {
    console.log("❌ getIsPro error", e);
    return false;
  }
}

export async function getPremiumPackages(): Promise<{
  annual: PurchasesPackage | null;
  lifetime: PurchasesPackage | null;
}> {
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;

    if (!current) {
      console.log("❌ Aucune offering courante RevenueCat");
      return { annual: null, lifetime: null };
    }

    console.log("✅ Current offering =", current.identifier);

    console.log(
      "📦 Packages disponibles =",
      current.availablePackages.map((p) => ({
        identifier: p.identifier,
        packageType: p.packageType,
        productId: p.product.identifier,
        title: p.product.title,
        price: p.product.priceString,
      }))
    );

 const annual =
  current.annual ??
  current.availablePackages.find(
    (p) =>
      p.packageType === PACKAGE_TYPE.ANNUAL ||
      p.identifier.toLowerCase().includes("annual")
  ) ??
  null;

const lifetime =
  current.lifetime ??
  current.availablePackages.find(
    (p) =>
      p.packageType === PACKAGE_TYPE.LIFETIME ||
      p.identifier.toLowerCase().includes("lifetime")
  ) ??
  null;
    console.log("✅ annual retenu =", {
      identifier: annual?.identifier,
      packageType: annual?.packageType,
      productId: annual?.product?.identifier,
      price: annual?.product?.priceString,
    });

    console.log("✅ lifetime retenu =", {
      identifier: lifetime?.identifier,
      packageType: lifetime?.packageType,
      productId: lifetime?.product?.identifier,
      price: lifetime?.product?.priceString,
    });

    return { annual, lifetime };
  } catch (e) {
    console.log("❌ getPremiumPackages error", e);
    return { annual: null, lifetime: null };
  }
}

export async function getAnnualPackage(): Promise<PurchasesPackage | null> {
  try {
    const { annual } = await getPremiumPackages();
    return annual;
  } catch (e) {
    console.log("❌ getAnnualPackage error", e);
    return null;
  }
}

export async function getLifetimePackage(): Promise<PurchasesPackage | null> {
  try {
    const { lifetime } = await getPremiumPackages();
    return lifetime;
  } catch (e) {
    console.log("❌ getLifetimePackage error", e);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return !!customerInfo.entitlements.active?.[ENTITLEMENT_ID];
  } catch (e: any) {
    if (e?.userCancelled) {
      console.log("ℹ️ Achat annulé par l'utilisateur");
      return false;
    }

    console.log("❌ purchasePackage error", e);
    return false;
  }
}

export async function restorePurchases() {
  try {
    const info = await Purchases.restorePurchases();
    return !!info.entitlements.active?.[ENTITLEMENT_ID];
  } catch (e) {
    console.log("❌ restorePurchases error", e);
    return false;
  }
}