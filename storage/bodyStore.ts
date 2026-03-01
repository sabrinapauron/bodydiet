import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORE_KEY = "FITSCAN_V1";

/* =========================
   TYPES
========================= */

export type LogEntry = {
  t: number;
  foods: string[];
  p: number;
  carb: number;
  f: number;
  c: number;
  photo?: string;
};

export type StoredState = {
  day: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  log: LogEntry[];
  weightKg: string;
  goal: "gain" | "cut" | "maintain";

  streak: number;
  lastPerfectDay: string | null;
  graceUsed: boolean;

  points: number;
  lastGoalRewardDay: string | null;
};

/* =========================
   LOAD GLOBAL STATE
========================= */

export async function loadState(): Promise<StoredState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredState;
  } catch {
    return null;
  }
}

/* =========================
   SAVE GLOBAL STATE
========================= */

export async function saveState(state: StoredState) {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(state));
}

/* =========================
   LOAD LOG ONLY
========================= */

export async function loadLog(): Promise<LogEntry[]> {
  const state = await loadState();
  if (!state || !Array.isArray(state.log)) return [];
  return state.log;
}