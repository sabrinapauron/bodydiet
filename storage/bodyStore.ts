import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORE_KEY = "FITSCAN_V1";
const BODY_PROFILE_KEY = "body_profile_v1";
/* =========================
   TYPES
========================= */

export type Goal = "gain" | "cut" | "maintain";
// ===== Effort du jour =====
export type EffortIntensity = "light" | "moderate" | "intense";
export type EffortLinearType = "walk" | "run" | "bike";

export type EffortEntry =
  | {
      kind: "linear";
      km: number; // ex 3.2
      type: EffortLinearType; // walk/run/bike
      intensity: EffortIntensity;
      ts: number;
    }
  | {
      kind: "gym";
      minutes: number; // ex 60
      intensity: EffortIntensity;
      ts: number;
    };

// petit helper date du jour
export const todayKey = () => new Date().toISOString().slice(0, 10);
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

export type BodyProfile = {
  heightCm: number;           // obligatoire pour analyse scan
  weightKg?: number | null;   // optionnel
  goal?: "gain" | "cut" | "maintain"; // optionnel
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


// Charge tout le dictionnaire (jour -> effort)
async function loadEffortsMap(): Promise<Record<string, EffortEntry>> {
  try {
    const raw = await AsyncStorage.getItem(EFFORTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function saveEffortsMap(map: Record<string, EffortEntry>) {
  await AsyncStorage.setItem(EFFORTS_KEY, JSON.stringify(map));
}

export async function loadEffort(day: string): Promise<EffortEntry | null> {
  const map = await loadEffortsMap();
  return map[day] ?? null;
}

export async function setEffort(day: string, effort: EffortEntry | null): Promise<void> {
  const map = await loadEffortsMap();
  if (!effort) delete map[day];
  else map[day] = effort;
  await saveEffortsMap(map);
}

export async function clearEffort(day: string): Promise<void> {
  await setEffort(day, null);
}

const EFFORTS_KEY = "body_efforts_by_day_v1";
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
export async function loadBodyProfile(): Promise<BodyProfile | null> {
  const raw = await AsyncStorage.getItem(BODY_PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveBodyProfile(profile: BodyProfile): Promise<void> {
  await AsyncStorage.setItem(BODY_PROFILE_KEY, JSON.stringify(profile));
}

export async function getHeightCmOrNull(): Promise<number | null> {
  const p = await loadBodyProfile();
  const h = p?.heightCm;
  return typeof h === "number" && h > 0 ? h : null;
}

// ==============================
// ✅ HISTORIQUE (progression)
// ==============================


const HISTORY_KEY = "@body:history:v1";

export type DaySummary = {
  day: string; // "YYYY-MM-DD"
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  streak?: number;
  points?: number;
  goal?: Goal;
  weightKg?: string;
  // ✅ on met true UNIQUEMENT quand on valide perfectDay (au bon moment)
  perfect?: boolean;

  // optionnel (pour plus tard)
  effort?: any | null;
};



export type BodyScan = {
  day: string; // YYYY-MM-DD
  frontUri: string;
  threeUri: string;
  sideUri: string;
  createdAt: number;
};

const KEY_BODY_SCANS = "BODY_SCANS_V1";
const BODY_SCAN_COMMENTS_KEY = "body_scan_comments_v1";

export async function loadBodyScans(): Promise<BodyScan[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_BODY_SCANS);
    const parsed = raw ? JSON.parse(raw) : [];
    const arr: BodyScan[] = Array.isArray(parsed) ? parsed : [];
    // tri récent -> ancien
    return arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch {
    return [];
  }
}

export async function upsertBodyScan(scan: BodyScan): Promise<BodyScan[]> {
  const scans = await loadBodyScans();
  const next: BodyScan[] = [scan, ...scans.filter((s) => s.day !== scan.day)];
  await AsyncStorage.setItem(KEY_BODY_SCANS, JSON.stringify(next));
  return next;
}

export async function saveHistory(history: DaySummary[]) {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export async function loadHistory(): Promise<DaySummary[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function upsertDaySummary(summary: DaySummary, keepDays = 60) {
  const history = await loadHistory();
  const next = history.filter((h) => h?.day !== summary.day);
  next.unshift(summary);

  // tri desc (au cas où)
  next.sort((a, b) => String(b.day).localeCompare(String(a.day)));

  // limite
  const trimmed = next.slice(0, keepDays);
  await saveHistory(trimmed);
}

export async function getLastDays(n = 7): Promise<DaySummary[]> {
  const history = await loadHistory();
  return history.slice(0, n);
}
export type BodyScanCommentary = {
  title: string;
  summary: string;
  wins: string[];
  work: string[];
  focus7: string[];
  closing: string;
};

type CommentaryMap = Record<string, BodyScanCommentary>; 
// clé: "single:YYYY-MM-DD" ou "compare:after|before"

const keySingle = (day: string) => `single:${day}`;
const keyCompare = (after: string, before: string) => `compare:${after}|${before}`;

export async function loadBodyScanCommentaryMap(): Promise<CommentaryMap> {
  const raw = await AsyncStorage.getItem(BODY_SCAN_COMMENTS_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function saveBodyScanCommentary(
  mode: "single" | "compare",
  afterDay: string,
  beforeDay: string | null,
  data: BodyScanCommentary
) {
  const map = await loadBodyScanCommentaryMap();
  const k = mode === "single" ? keySingle(afterDay) : keyCompare(afterDay, beforeDay || "");
  map[k] = data;
  await AsyncStorage.setItem(BODY_SCAN_COMMENTS_KEY, JSON.stringify(map));
}

export async function getBodyScanCommentary(
  mode: "single" | "compare",
  afterDay: string,
  beforeDay: string | null
): Promise<BodyScanCommentary | null> {
  const map = await loadBodyScanCommentaryMap();
  const k = mode === "single" ? keySingle(afterDay) : keyCompare(afterDay, beforeDay || "");
  return map[k] || null;
}