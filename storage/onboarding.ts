import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "bodydiet_onboarding_seen";

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    console.log("📦 hasSeenOnboarding =", value);
    return value === "true";
  } catch (e) {
    console.log("❌ hasSeenOnboarding error", e);
    return false;
  }
}

export async function setOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    const check = await AsyncStorage.getItem(ONBOARDING_KEY);
    console.log("✅ setOnboardingSeen saved =", check);
  } catch (e) {
    console.log("❌ setOnboardingSeen error", e);
  }
}

export async function resetOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    console.log("🗑️ onboarding reset");
  } catch (e) {
    console.log("❌ resetOnboardingSeen error", e);
  }
}