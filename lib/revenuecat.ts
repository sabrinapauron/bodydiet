import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PACKAGE_TYPE,
  PurchasesPackage,
} from "react-native-purchases";

const RC_API_KEY_ANDROID = "goog_aYUOMVsfDoVLwzORZxkMgIgieFm";
const RC_API_KEY_IOS = "test_fzsebNzeBOlLVYJwDDYQJpXnyum";

export const ENTITLEMENT_ID = "FITNESS DIET Pro";

let rcConfigured = false;

function getRevenueCatApiKey() {
  const key = Platform.OS === "android" ? RC_API_KEY_ANDROID : RC_API_KEY_IOS;

  if (__DEV__) {
    console.log("RC PLATFORM =", Platform.OS);
    console.log("RC KEY USED =", key);
  }

  return key;
}

export async function initRevenueCat(): Promise<void> {
  try {
    if (rcConfigured) {
      if (__DEV__) {
        console.log("ℹ️ RevenueCat déjà configuré");
      }
      return;
    }

    const apiKey = getRevenueCatApiKey();

    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    await Purchases.configure({ apiKey });

    rcConfigured = true;

    if (__DEV__) {
      const appUserId = await Purchases.getAppUserID();
      console.log("✅ RevenueCat initialisé");
      console.log("🧾 USER ID =", appUserId);
    }
  } catch (e) {
    console.log("❌ initRevenueCat error", e);
    throw e;
  }
}

export async function getRevenueCatUserId(): Promise<string | null> {
  try {
    await initRevenueCat();
    const appUserId = await Purchases.getAppUserID();
    return appUserId || null;
  } catch (e) {
    console.log("❌ getRevenueCatUserId error", e);
    return null;
  }
}

export async function loginRevenueCat(appUserId: string): Promise<boolean> {
  try {
    await initRevenueCat();

    const cleanId = appUserId.trim().toLowerCase();
    if (!cleanId) {
      throw new Error("appUserId vide");
    }

    const currentId = await Purchases.getAppUserID();

    if (__DEV__) {
      console.log("🧾 RC current user before login =", currentId);
      console.log("🧾 RC target login user =", cleanId);
    }

    if (currentId !== cleanId) {
      const { customerInfo, created } = await Purchases.logIn(cleanId);

      if (__DEV__) {
        console.log("🧾 RC logIn user =", cleanId);
        console.log("🧾 RC created =", created);
        console.log(
          "🧾 RC entitlements after login =",
          customerInfo.entitlements.active
        );
      }

      return !!customerInfo.entitlements.active?.[ENTITLEMENT_ID];
    }

    const info = await Purchases.getCustomerInfo();

    if (__DEV__) {
      console.log("ℹ️ RC déjà connecté au bon user =", cleanId);
      console.log("🧾 RC entitlements current =", info.entitlements.active);
    }

    return !!info.entitlements.active?.[ENTITLEMENT_ID];
  } catch (e) {
    console.log("❌ loginRevenueCat error", e);
    throw e;
  }
}

export async function logoutRevenueCat(): Promise<void> {
  try {
    await initRevenueCat();
    await Purchases.logOut();

    if (__DEV__) {
      const newId = await Purchases.getAppUserID();
      console.log("🧾 RC logged out");
      console.log("🧾 RC user after logout =", newId);
    }
  } catch (e) {
    console.log("❌ logoutRevenueCat error", e);
    throw e;
  }
}

export async function getCustomerInfoSafe(): Promise<CustomerInfo | null> {
  try {
    await initRevenueCat();
    const info = await Purchases.getCustomerInfo();

    if (__DEV__) {
      console.log("🧾 CustomerInfo OK");
      console.log("🧾 Active entitlements =", info.entitlements.active);
    }

    return info;
  } catch (e) {
    console.log("❌ getCustomerInfo error", e);
    return null;
  }
}

export async function getIsPro(): Promise<boolean> {
  try {
    await initRevenueCat();
    const info = await Purchases.getCustomerInfo();

    if (__DEV__) {
      console.log("🧾 ENTITLEMENTS =", info.entitlements.active);
      console.log(
        "🧾 ENTITLEMENT KEYS =",
        Object.keys(info.entitlements.active || {})
      );
      console.log("🧾 ENTITLEMENT_ID USED =", ENTITLEMENT_ID);
    }

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
    await initRevenueCat();

    const offerings = await Purchases.getOfferings();
    const current = offerings.current;

    if (!current) {
      console.log("❌ Aucune offering courante RevenueCat");
      return { annual: null, lifetime: null };
    }

    if (__DEV__) {
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
    }

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

    if (__DEV__) {
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
    }

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
    await initRevenueCat();

    const { customerInfo } = await Purchases.purchasePackage(pkg);

    if (__DEV__) {
      console.log(
        "🧾 purchasePackage entitlements =",
        customerInfo.entitlements.active
      );
    }

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
    await initRevenueCat();

    const info = await Purchases.restorePurchases();

    if (__DEV__) {
      console.log("🧾 restorePurchases entitlements =", info.entitlements.active);
    }

    return !!info.entitlements.active?.[ENTITLEMENT_ID];
  } catch (e) {
    console.log("❌ restorePurchases error", e);
    return false;
  }
}