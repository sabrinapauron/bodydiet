import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORE_KEY = "FITSCAN_V1";

/* =========================
   TYPES
========================= */

export type Goal = "gain" | "cut" | "maintain";

export type LogEntry = {
  t: number;
  foods: string[];
  p: number;
  carb: number;
  f: number;
  c: number;
  photo?: string;
  title?: string;
};

export type StoredState = {
  day: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  log: LogEntry[];
  weightKg: string;
  goal: Goal;

  streak: number;
  lastPerfectDay: string | null;
  graceUsed: boolean;

  points: number;
  savePhotos?: boolean; // switch album ON/OFF
  lastGoalRewardDay: string | null;
    shareFrame?: boolean; // ✅ cadre baroque sur les partages
  shareFilter?: boolean; // ✅ overlay premium sur les partages
};

/* =========================
   LOAD / SAVE GLOBAL STATE
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

export async function saveState(state: StoredState) {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(state));
}

/* =========================
   UPDATE HELPER
========================= */

async function updateState(
  updater: (prev: StoredState) => StoredState
): Promise<StoredState | null> {
  const prev = await loadState();
  if (!prev) return null;
  const next = updater(prev);
  await saveState(next);
  return next;
}

/* =========================
   LOG HELPERS
========================= */

export async function loadLog(): Promise<LogEntry[]> {
  const state = await loadState();
  if (!state || !Array.isArray(state.log)) return [];
  return state.log;
}

/* =========================
   SETTINGS (Album ON/OFF)
========================= */

export async function setSavePhotosEnabled(enabled: boolean) {
  return updateState((prev) => ({
    ...prev,
    savePhotos: !!enabled,
  }));
}

/* =========================
   ALBUM ACTIONS
========================= */

// ✅ Vider l’album : on enlève uniquement les photos (on garde macros & historique)
export async function clearMealPhotos() {
  return updateState((prev) => ({
    ...prev,
    log: Array.isArray(prev.log)
      ? prev.log.map((e) => {
          if (!e?.photo) return e;
          const { photo, ...rest } = e;
          return rest;
        })
      : [],
  }));
}

export async function setShareFrameEnabled(v: boolean) {
  return updateState((prev) => ({ ...prev, shareFrame: !!v }));
}

export async function setShareFilterEnabled(v: boolean) {
  return updateState((prev) => ({ ...prev, shareFilter: !!v }));
}
// ✅ “Supprimer” 1 élément de l’album : on retire la photo de cette entrée
export async function removeMealPhoto(t: number) {
  return updateState((prev) => ({
    ...prev,
    log: Array.isArray(prev.log)
      ? prev.log.map((e) => {
          if (!e || e.t !== t) return e;
          const { photo, ...rest } = e;
          return rest;
        })
      : [],
  }));
}

// ✅ Renommer une entrée (titre affiché dans l’album)
export async function renameMeal(t: number, title: string) {
  const clean = String(title ?? "").trim().slice(0, 60);
  return updateState((prev) => ({
    ...prev,
    log: Array.isArray(prev.log)
      ? prev.log.map((e) => (e && e.t === t ? { ...e, title: clean } : e))
      : [],
  }));
}