import AsyncStorage from "@react-native-async-storage/async-storage";

const MEAL_SCAN_COUNT_KEY = "bodydiet_meal_scan_count";
const BODYMIND_COUNT_KEY = "bodydiet_bodymind_count";

export const FREE_MEAL_SCAN_LIMIT = 10;
export const FREE_BODYMIND_LIMIT = 3;

async function getNumber(key: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(key);
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

async function setNumber(key: string, value: number): Promise<void> {
  try {
    await AsyncStorage.setItem(key, String(value));
  } catch {}
}

export async function getMealScanCount(): Promise<number> {
  return getNumber(MEAL_SCAN_COUNT_KEY);
}

export async function incrementMealScanCount(): Promise<number> {
  const current = await getNumber(MEAL_SCAN_COUNT_KEY);
  const next = current + 1;
  await setNumber(MEAL_SCAN_COUNT_KEY, next);
  return next;
}

export async function canUseMealScan(isPremium: boolean): Promise<boolean> {
  if (isPremium) return true;
  const count = await getMealScanCount();
  return count < FREE_MEAL_SCAN_LIMIT;
}

export async function getBodyMindCount(): Promise<number> {
  return getNumber(BODYMIND_COUNT_KEY);
}

export async function incrementBodyMindCount(): Promise<number> {
  const current = await getNumber(BODYMIND_COUNT_KEY);
  const next = current + 1;
  await setNumber(BODYMIND_COUNT_KEY, next);
  return next;
}

export async function canUseBodyMind(isPremium: boolean): Promise<boolean> {
  if (isPremium) return true;
  const count = await getBodyMindCount();
  return count < FREE_BODYMIND_LIMIT;
}

export async function resetUsageLimits(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([MEAL_SCAN_COUNT_KEY, BODYMIND_COUNT_KEY]);
  } catch {}
}