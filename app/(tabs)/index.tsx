import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
  Modal,
  Pressable,
  Image,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { saveState, loadState, upsertDaySummary,  } from "../../storage/bodyStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Animated } from "react-native";
import EffortModal from "../../components/EffortModal";
import { loadEffort, setEffort, type EffortEntry } from "../../storage/bodyStore";
import { applyEffortToTargets, formatEffortLabel } from "../../lib/effort";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { saveBodyProfile, loadCoachWeeklyMission,loadCoachWeeklyChallenge,
setCoachWeeklyChallengeDone,
type CoachWeeklyChallenge,  } from "../../storage/bodyStore";
import {
  loadBodyScans,
  getBodyScanCommentary,
  loadCoachChallengeProgress,
saveCoachChallengeProgress,
markCoachChallengeDayValidated, 
type CoachChallengeProgress,
  type BodyScan,
  type BodyScanCommentary,
} from "../../storage/bodyStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  canUseMealScan,
  incrementMealScanCount,
  getMealScanCount,
  FREE_MEAL_SCAN_LIMIT,
} from "../../storage/usageLimits";


import { getIsPro } from "../../lib/revenuecat";

import {
  getPremiumPackages,
  purchasePackage,
  restorePurchases,
} from "../../lib/revenuecat";



const API_URL = "https://monaserver.onrender.com/analyze-meal"; 
const REVIEW_ACCESS_STORAGE_KEY = "bodydiet_review_access_unlocked";
const REVIEW_ACCESS_CODE = "BODYDIET-REVIEW-2026";

type Goal = "gain" | "cut" | "maintain";

type LogEntry = {
  t: number;
  foods: string[];
  p: number; // protein
  carb: number; // carbs
  f: number; // fat
  c: number; // calories
   photo?: string;
   title?: string; 
};

type StoredState = {
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
  savePhotos?: boolean;

  points: number;
  lastGoalRewardDay: string | null;

    // ✅ historique léger (pas les photos, juste stats)
  history?: Record<
    string,
    {
      protein: number;
      carbs: number;
      fat: number;
      calories: number;
      perfectDay: boolean;
      effort?: any; // ou EffortEntry si tu veux typer proprement
      pointsEarned?: number;
      streak?: number;
    }
  >;
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const roundInt = (n: unknown) => Math.round(Number(n) || 0);

type BodyFocus =
  | "balanced"
  | "midsection"
  | "lower_body"
  | "upper_body"
  | "slim_legs"
  | "toning";

function normalizeBodyFocus(v: any): BodyFocus {
  const allowed: BodyFocus[] = [
    "balanced",
    "midsection",
    "lower_body",
    "upper_body",
    "slim_legs",
    "toning",
  ];
  return allowed.includes(v) ? v : "balanced";
}

const coachLibrary: Record<BodyFocus, string[]> = {
  balanced: [
    "20 min marche • gainage",
    "25 min marche • abdos",
    "20 min cardio doux",
    "Repos actif • marche 20 min",
    "Gainage • squats",
    "25 min marche rapide",
    "Pense à refaire un scan pour suivre ta progression",
  ],

  midsection: [
    "Marche 25 min • gainage",
    "Crunch • gainage • marche",
    "Cardio doux 30 min",
    "Repos actif • marche",
    "Gainage latéral • crunch",
    "Abdos • cardio",
    "Pense à refaire un scan pour suivre ta progression",
  ],

  lower_body: [
    "Squats • marche 20 min",
    "Fentes • pont fessier",
    "Montées de genoux • marche",
    "Repos actif • marche",
    "Squats tempo • gainage",
    "Fentes • cardio doux",
    "Pense à refaire un scan pour suivre ta progression",
  ],

  upper_body: [
    "Pompes • gainage",
    "Pompes inclinées • marche",
    "Gainage • bras",
    "Repos actif • marche",
    "Pompes • gainage",
    "Cardio doux • bras",
    "Pense à refaire un scan pour suivre ta progression",
  ],

  slim_legs: [
    "Squats • marche",
    "Fentes • pont fessier",
    "Squats tempo",
    "Repos actif",
    "Fentes • gainage",
    "Squats • marche rapide",
    "Pense à refaire un scan pour suivre ta progression",
  ],

  toning: [
    "20 min marche • gainage",
    "Cardio doux 25 min",
    "Abdos • marche",
    "Repos actif",
    "Gainage • squats",
    "Marche rapide 30 min",
    "Pense à refaire un scan pour suivre ta progression",
  ],
};

function getCoachMission(
  profile: BodyFocus,
  dayIndex: number,
  progress: "stable" | "improving" | "strong_progress" = "stable"
) {
  const safeIndex = Math.max(0, Math.min(dayIndex, 6));
  const base = coachLibrary[profile]?.[safeIndex] || coachLibrary.balanced[safeIndex];

  if (progress === "strong_progress") {
    return base + " • +1 série";
  }

  if (progress === "improving") {
    return base + " • tempo contrôlé";
  }

  return base;
}
const DAY_MS = 24 * 60 * 60 * 1000;


function parseDayKey(day?: string | null) {
  if (!day) return null;
  const d = new Date(day + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function diffDaysFrom(startDay?: string | null, endDay?: string | null) {
  const a = parseDayKey(startDay);
  const b = parseDayKey(endDay || todayKey());
  if (!a || !b) return null;
  return Math.floor((b.getTime() - a.getTime()) / DAY_MS);
}

function parseFocus7Days(text: string | null | undefined): string[] {
  if (!text) return [];

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const dayLines = lines.filter((l) => /^[-•]?\s*Jour\s*[1-7]\s*:/i.test(l));

  return dayLines.map((l) =>
    l
      .replace(/^[-•]?\s*Jour\s*[1-7]\s*:\s*/i, "")
      .trim()
  );
}

function daysBetween(fromDay: string, toDay: string): number {
  const a = new Date(fromDay + "T00:00:00");
  const b = new Date(toDay + "T00:00:00");
  const diff = b.getTime() - a.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
export default function HomeScreen() {
  const ENABLE_BODY_CHALLENGE = false;
  const router = useRouter();
 

  const [loaded, setLoaded] = useState(false);

const [effortOpen, setEffortOpen] = useState(false);
const [effort, setEffortState] = useState<EffortEntry | null>(null);
const [coachWeeklyMission, setCoachWeeklyMission] = useState<string | null>(null);
 const [coachChallengeProgress, setCoachChallengeProgress] = useState<CoachChallengeProgress | null>(null);
const [coachChallengeDayNumber, setCoachChallengeDayNumber] = useState<number>(0);
const [coachChallengeTodayText, setCoachChallengeTodayText] = useState<string | null>(null);
const [coachChallengeTodayDone, setCoachChallengeTodayDone] = useState(false); 
// Profil
  const [weightKg, setWeightKg] = useState("75");
  const [heightCm, setHeightCm] = useState("175");
  const [goal, setGoal] = useState<Goal>("gain");
const profileIncomplete =
  (!heightCm || heightCm === "175") && !weightKg;
  // Journée
  const [day, setDay] = useState(todayKey());
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [calories, setCalories] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);

  const [busy, setBusy] = useState(false);

  // Ajout perso
  const [manualOpen, setManualOpen] = useState(false);
  const [manualP, setManualP] = useState("0");
  const [manualCarb, setManualCarb] = useState("0");
  const [manualF, setManualF] = useState("0");
  const [manualC, setManualC] = useState("0");

  // Série / points
  const [streak, setStreak] = useState(0);
  const [lastPerfectDay, setLastPerfectDay] = useState<string | null>(null);
  const [graceUsed, setGraceUsed] = useState(false);
  const [showStreakUp, setShowStreakUp] = useState(false);

  // Premium (mock)
  
  const [bodyScanPremiumOpen, setBodyScanPremiumOpen] = useState(false);

  const [points, setPoints] = useState(0);
  const [savePhotos, setSavePhotos] = useState(true);
  const [lastGoalRewardDay, setLastGoalRewardDay] = useState<string | null>(null);
const [coachChallenge, setCoachChallenge] = useState<CoachWeeklyChallenge | null>(null);
const [showCoachBravo, setShowCoachBravo] = useState(false);
const [bodyScans, setBodyScans] = useState<BodyScan[]>([]);
const [latestBodyCommentary, setLatestBodyCommentary] = useState<BodyScanCommentary | null>(null);
const [mealsPremiumOpen, setMealsPremiumOpen] = useState(false);
const [mealScanCount, setMealScanCount] = useState(0);
const [premiumLoading, setPremiumLoading] = useState(true);
const [isPro, setIsPro] = useState(false);
const [buying, setBuying] = useState(false);
const [annualPackage, setAnnualPackage] = useState<any | null>(null);
const [lifetimePackage, setLifetimePackage] = useState<any | null>(null);
const [menuOpen, setMenuOpen] = useState(false);
const [reviewAccessUnlocked, setReviewAccessUnlocked] = useState(false);
const [reviewCodeInput, setReviewCodeInput] = useState("");

  const scrollRef = useRef<ScrollView | null>(null);
  const jokerPulse = useRef(new Animated.Value(1)).current;
 const scanPulse = useRef(new Animated.Value(1)).current;


const handleScanMealPress = () => {
  if (isPro) {
    scanMeal();
   } else if (Math.max(0, FREE_MEAL_SCAN_LIMIT - mealScanCount) > 0) {
    scanMeal();
  } else {
    setMealsPremiumOpen (true);
  }
};

const isPremium = isPro || reviewAccessUnlocked;


const latestBodyScan = bodyScans[0] || null;

const challengeStartDay = latestBodyScan?.day || null;

const daysSinceChallengeStart = diffDaysFrom(
  challengeStartDay,
  todayKey()
);

const challengeActive =
  daysSinceChallengeStart !== null &&
  daysSinceChallengeStart >= 0 &&
  daysSinceChallengeStart <= 6;

const challengeDayIndex =
  challengeActive && daysSinceChallengeStart !== null
    ? daysSinceChallengeStart
    : 0;

const coachMissionText =
  latestBodyCommentary?.bodyFocus
    ? getCoachMission(
        normalizeBodyFocus(latestBodyCommentary.bodyFocus),
        challengeDayIndex,
        latestBodyCommentary?.progressLevel ?? "stable"
      )
    : "Fais un scan body pour lancer ta semaine Coach BodyDiet.";

  const toggleCoachChallenge = async () => {
  if (!coachChallenge) return;

  const nextDone = !coachChallenge.done;
  await setCoachWeeklyChallengeDone(nextDone);

  const next = {
    ...coachChallenge,
    done: nextDone,
  };

  setCoachChallenge(next);

  if (nextDone) {
    setShowCoachBravo(true);
    setTimeout(() => setShowCoachBravo(false), 1800);
  }
};

  const persist = async (next: Partial<StoredState>) => {
    const payload: StoredState = {
      day,
      protein,
      carbs,
      fat,
      calories,
      log,
      weightKg,
      goal,

      streak,
      lastPerfectDay,
      graceUsed,

      points,
      lastGoalRewardDay,

      ...next,
      savePhotos: next.savePhotos ?? savePhotos,
    };

    await saveState(payload);
await saveBodyProfile({
  heightCm: Number(heightCm) || 175,
  weightKg: Number(weightKg) || null,
  goal,
  completed: true,
});

  };

  

  // Objectifs macros complets

  
  const targets = useMemo(() => {
    const w = Number(weightKg) || 0;

    if (!w) {
      return {
        protein: 150,
        carbs: 250,
        fat: 70,
        calories: 2200,
      };
    }

    if (goal === "gain") {
      return {
        protein: Math.round(w * 2.0),
        carbs: Math.round(w * 4.0),
        fat: Math.round(w * 1.0),
        calories: Math.round(w * 35),
      };
    }

    if (goal === "cut") {
      return {
        protein: Math.round(w * 2.2),
        carbs: Math.round(w * 2.2),
        fat: Math.round(w * 0.9),
        calories: Math.round(w * 28),
      };
    }

    return {
      protein: Math.round(w * 1.8),
      carbs: Math.round(w * 3.0),
      fat: Math.round(w * 1.0),
      calories: Math.round(w * 32),
    };
  }, [weightKg, goal]);

  const adjustedTargets = applyEffortToTargets(targets, effort);

  const remainingP = Math.max(0, adjustedTargets.protein - protein);
  const remainingG = Math.max(0, adjustedTargets.carbs - carbs);
  const remainingL = Math.max(0, adjustedTargets.fat - fat);

const handleValidateCoachChallengeDay = async () => {
  if (!coachChallengeProgress) return;
  if (coachTodayValidated) return;

  await markCoachChallengeDayValidated(today);

  const updated = await loadCoachChallengeProgress();
  setCoachChallengeProgress(updated);

  // ici tu pourras remettre ton confetti si tu veux
  // ex: triggerConfetti?.();
};

  const proteinProgress = Math.min(1, protein / Math.max(1,adjustedTargets .protein));
  const carbProgress = Math.min(1, carbs / Math.max(1,adjustedTargets .carbs));
  const fatProgress = Math.min(1, fat / Math.max(1, adjustedTargets.fat));
const dayScore = Math.round(
  ((proteinProgress + carbProgress + fatProgress) / 3) * 100
);
  const perfectDay = proteinProgress >= 1 && carbProgress >= 1 && fatProgress >= 1;
const today = todayKey();

const coachFocusDays = useMemo(() => {
  return latestBodyCommentary?.focus7 ?? [];
}, [latestBodyCommentary]);

const challengeUnlocked = !!coachChallengeProgress?.scanDay;

const challengeDayNumber = useMemo(() => {
  if (!coachChallengeProgress?.scanDay) return 0;

  
  const diff = daysBetween(coachChallengeProgress.scanDay, today);
  const dayNum = diff + 1;

  if (dayNum < 1) return 1;
  if (dayNum > 7) return 7;
  return dayNum;
}, [coachChallengeProgress, today]);

const coachTodayMission = useMemo(() => {
  if (!challengeUnlocked) return null;

  if (!coachFocusDays || coachFocusDays.length === 0) {
    return "Programme en préparation.";
  }

  const index = challengeDayNumber - 1;

 if (index >= 0 && index < coachFocusDays.length)  {
    return coachFocusDays[index];
  }

  // si le programme est plus court que 7 jours
  return coachFocusDays[coachFocusDays.length - 1];
}, [challengeUnlocked, coachFocusDays, challengeDayNumber]);

const coachTodayValidated = useMemo(() => {
  if (!coachChallengeProgress) return false;
  return coachChallengeProgress.validatedDays.includes(today);
}, [coachChallengeProgress, today]);

const challengeFinished = challengeUnlocked && challengeDayNumber >= 7;


  // Objectif de série progressif (1 / 3 / 7 / 14)
  const streakGoal =
    streak < 1 ? 1 : streak < 3 ? 3 : streak < 7 ? 7 : 14;

  const daysToGoal = Math.max(0, streakGoal - streak);
  const isLastDayBeforeGoal = daysToGoal === 1;

  // Récompenses points (paliers)
  const rewardSteps = [200, 600, 1000, 2000];
  const nextReward =
    rewardSteps.find((step) => points < step) ??
    rewardSteps[rewardSteps.length - 1];
// Coach gratuit : gap principal
const biggestGap: "P" | "G" | "L" =
  remainingP >= remainingG && remainingP >= remainingL
    ? "P"
    : remainingG >= remainingL
    ? "G"
    : "L";

const coachFreeLine =
  biggestGap === "P"
    ? `Tu manques surtout de PROTEINES (${remainingP}g).`
    : biggestGap === "G"
    ? `Tu manques surtout de GLUCIDES (${remainingG}g).`
    : `Tu manques surtout de LIPIDES (${remainingL}g).`;

const coachFreeAction =
  biggestGap === "P"
    ? "Action simple: ajoute 1 portion proteinee au prochain repas."
    : biggestGap === "G"
    ? "Action simple: ajoute 1 portion de glucides au prochain repas."
    : "Action simple: ajoute 1 source de bons lipides au prochain repas.";

const premiumTitle =
  goal === "cut"
    ? "Plan seche PERSONNALISE"
    : goal === "gain"
    ? "Plan masse PERSONNALISE"
    : "Plan maintien PERSONNALISE";

const premiumPreviewLines = [
  "📈 Visualise et comprend ta progression physique",
  "🍽 Améliore tes repas pour + de résultat",
  "🔥 Optimise ta vitesse de progression",
];
  
async function handleSubscribeAnnual() {
  try {
    setBuying(true);

    if (!annualPackage) {
      Alert.alert(
        "Offre indisponible",
        "Le plan annuel n'a pas été trouvé dans RevenueCat."
      );
      return;
    }

    const success = await purchasePackage(annualPackage);

    if (success) {
      setIsPro(true);
      Alert.alert("Abonnement activé", "Body Diet Premium annuel est maintenant débloqué.");
    } else {
      Alert.alert("Achat non finalisé", "L'accès Premium annuel n'a pas été activé.");
    }
  } catch (e) {
    Alert.alert("Erreur", "Impossible de lancer l'abonnement annuel pour le moment.");
  } finally {
    setBuying(false);
  }
}

async function handleSubscribeLifetime() {
  try {
    setBuying(true);

    if (!lifetimePackage) {
      Alert.alert(
        "Offre indisponible",
        "Le plan à vie n'a pas été trouvé dans RevenueCat."
      );
      return;
    }

    const success = await purchasePackage(lifetimePackage);

    if (success) {
      setIsPro(true);
      Alert.alert("Accès activé", "Body Diet Premium à vie est maintenant débloqué.");
    } else {
      Alert.alert("Achat non finalisé", "L'accès Premium à vie n'a pas été activé.");
    }
  } catch (e) {
    Alert.alert("Erreur", "Impossible de lancer l'achat à vie pour le moment.");
  } finally {
    setBuying(false);
  }
}

async function handleRestore() {
  try {
    setBuying(true);

    const restored = await restorePurchases();

    if (restored) {
      setIsPro(true);
      Alert.alert("Achats restaurés", "Votre accès Pro a bien été réactivé.");
    } else {
      Alert.alert("Aucun achat trouvé", "Aucun abonnement actif n'a été retrouvé.");
    }
  } catch (e) {
    Alert.alert("Erreur", "Impossible de restaurer les achats.");
  } finally {
    setBuying(false);
  }
}

async function handleApplyReviewCode() {
  const normalized = reviewCodeInput.trim();

  if (normalized !== REVIEW_ACCESS_CODE) {
    Alert.alert("Code invalide", "Le code d’accès premium n’est pas correct.");
    return;
  }

  await AsyncStorage.setItem(REVIEW_ACCESS_STORAGE_KEY, "true");
  setReviewAccessUnlocked(true);
  setReviewCodeInput("");
  Alert.alert("Accès activé", "Le mode premium de test a été débloqué sur cet appareil.");
}

async function handleRemoveReviewCode() {
  await AsyncStorage.removeItem(REVIEW_ACCESS_STORAGE_KEY);
  setReviewAccessUnlocked(false);
  setReviewCodeInput("");
  Alert.alert("Accès retiré", "Le déblocage premium de test a été supprimé.");
}

  // Auto-chargement
useFocusEffect(
  React.useCallback(() => {
    let alive = true;
    (async () => {
      const day = todayKey();
      const e = await loadEffort(day);
      const challenge = await loadCoachWeeklyChallenge();

      if (alive) {
        setEffortState(e);
        setCoachChallenge(challenge);
      }
    })();
    return () => {
      alive = false;
    };
  }, [])
);

useFocusEffect(
  React.useCallback(() => {
    let alive = true;

    (async () => {
      const pro = await getIsPro();
      if (alive) {
        setIsPro(pro);
      }
    })();

    return () => {
      alive = false;
    };
  }, [])
);
useEffect(() => {
  (async () => {
    try {
      const pro = await getIsPro();
      setIsPro(pro);

      const unlocked = await AsyncStorage.getItem(REVIEW_ACCESS_STORAGE_KEY);
      setReviewAccessUnlocked(unlocked === "true");

      const { annual, lifetime } = await getPremiumPackages();
      setAnnualPackage(annual);
      setLifetimePackage(lifetime);

      console.log("ANNUAL PACKAGE =", annual?.product?.identifier);
      console.log("LIFETIME PACKAGE =", lifetime?.product?.identifier);
    } finally {
      setPremiumLoading(false);
    }
  })();
}, []);



  useEffect(() => {
    (async () => {
      try {
        const s = await loadState();
        const tk = todayKey();
        const scans = await loadBodyScans();
setBodyScans(scans);

const latest = scans?.[0] || null;

if (!latest) {
  setLatestBodyCommentary(null);
} else {
  const commentary =
    (await getBodyScanCommentary("compare", latest.day, scans?.[1]?.day ?? null)) ||
    (await getBodyScanCommentary("single", latest.day, null));

  
  setLatestBodyCommentary(commentary || null);
}
const mission = await loadCoachWeeklyMission();
setCoachWeeklyMission(mission?.text ?? null);
const challengeProgress = await loadCoachChallengeProgress();
setCoachChallengeProgress(challengeProgress);
        if (!s) {
          
          setDay(tk);
          setLoaded(true);
          return;
        }


        setStreak(Number(s.streak) || 0);
        setLastPerfectDay(typeof s.lastPerfectDay === "string" ? s.lastPerfectDay : null);
        setLastGoalRewardDay(typeof s.lastGoalRewardDay === "string" ? s.lastGoalRewardDay : null);
        setGraceUsed(Boolean(s.graceUsed));
        setPoints(Number(s.points) || 0);
        setSavePhotos(typeof s.savePhotos === "boolean" ? s.savePhotos : true);
if (latest) {
  const existingProgress = await loadCoachChallengeProgress();

  // si aucun challenge en cours, on démarre celui du dernier scan
  if (!existingProgress) {
    const newProgress: CoachChallengeProgress = {
      scanDay: latest.day,
      validatedDays: [],
    };
    await saveCoachChallengeProgress(newProgress);
    setCoachChallengeProgress(newProgress);
  } else {
    // si un nouveau scan plus récent a été fait, on relance un nouveau challenge
    if (existingProgress.scanDay !== latest.day) {
      const restartedProgress: CoachChallengeProgress = {
        scanDay: latest.day,
        validatedDays: [],
      };
      await saveCoachChallengeProgress(restartedProgress);
      setCoachChallengeProgress(restartedProgress);
    }
  }
}



        // reset journalier
        if (s.day !== tk) {
          const prevDay = s.day; // la journée qu’on quitte
const prevHistory: Record<string, any> = ((s as any).history ?? {});

// ✅ on archive la journée précédente (si elle existe)
if (typeof prevDay === "string" && prevDay.length === 10) {
  prevHistory[prevDay] = {
    protein: Number(s.protein) || 0,
    carbs: Number(s.carbs) || 0,
    fat: Number(s.fat) || 0,
    calories: Number(s.calories) || 0,
    perfectDay: Boolean(
      (Number(s.protein) || 0) >= 1 && false // (on ne peut pas recalculer propreDay ici sans targets)
    ),
    // effort: (optionnel) si tu le stockes aussi
    streak: Number(s.streak) || 0,
  };
}

// ✅ on garde seulement les 30 derniers jours
const keys = Object.keys(prevHistory).sort(); // YYYY-MM-DD -> tri OK
while (keys.length > 30) {
  const k = keys.shift();
  if (k) delete prevHistory[k];
}

// ✅ archive la journée précédente (valeurs brutes)
// (perfect sera déjà true si la journée a été validée via le useEffect perfectDay)
await upsertDaySummary({
  day: String(s.day),
  protein: Number(s.protein) || 0,
  carbs: Number(s.carbs) || 0,
  fat: Number(s.fat) || 0,
  calories: Number(s.calories) || 0,
});
          const next: StoredState = {
            day: tk,
            protein: 0,
            carbs: 0,
            fat: 0,
            calories: 0,
            log: [],
            weightKg: String(s.weightKg ?? "75"),
            goal: (s.goal ?? "gain") as Goal,

            streak: Number(s.streak) || 0,
            lastPerfectDay: typeof s.lastPerfectDay === "string" ? s.lastPerfectDay : null,
            graceUsed: Boolean(s.graceUsed),
            savePhotos: typeof s.savePhotos === "boolean" ? s.savePhotos : true,
            points: Number(s.points) || 0,
            lastGoalRewardDay: typeof s.lastGoalRewardDay === "string" ? s.lastGoalRewardDay : null,
            history: prevHistory,
          };

         await saveState(next);

          setDay(tk);
          setProtein(0);
          setCarbs(0);
          setFat(0);
          setCalories(0);
          setLog([]);
          setWeightKg(next.weightKg);
          setGoal(next.goal);
        } else {
          setDay(s.day || tk);
          setProtein(Number(s.protein) || 0);
          setCarbs(Number(s.carbs) || 0);
          setFat(Number(s.fat) || 0);
          setCalories(Number(s.calories) || 0);
          setLog(Array.isArray(s.log) ? (s.log as LogEntry[]) : []);
          setWeightKg(String(s.weightKg ?? "75"));
          setGoal((s.goal ?? "gain") as Goal);
          setSavePhotos(typeof s.savePhotos === "boolean" ? s.savePhotos : true);
        }
      } catch {
        const tk = todayKey();
        setDay(tk);
        setProtein(0);
        setCarbs(0);
        setFat(0);
        setCalories(0);
        setLog([]);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const useJoker = async () => {
  // ✅ autorisé même si streak=0 (jour 1 du challenge)
  if (graceUsed) return;
  if (perfectDay) return;

  Alert.alert(
    "Utiliser le joker ?",
    "Ça protège ta série aujourd’hui (sans points).",
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "Utiliser",
        style: "default",
        onPress: async () => {
          const today = todayKey();
          setGraceUsed(true);
          setLastPerfectDay(today);
          const latestBodyScan = bodyScans[0] || null;

const activeBodyFocus: BodyFocus = normalizeBodyFocus(
  latestBodyCommentary?.bodyFocus
);


const activeBodyComment =
  typeof latestBodyCommentary?.bodyComment === "string" &&
  latestBodyCommentary.bodyComment.trim()
    ? latestBodyCommentary.bodyComment.trim()
    : "Ton dernier scan permet d’adapter légèrement ton challenge de la semaine.";
          await persist({
            graceUsed: true,
            lastPerfectDay: today,


          });
        },
      },
    ]
  );
};


const jokerLoopRef = useRef<Animated.CompositeAnimation | null>(null);
const scanLoopRef = useRef<Animated.CompositeAnimation | null>(null);
useEffect(() => {
  // stop loop précédente
  if (jokerLoopRef.current) {
    jokerLoopRef.current.stop();
    jokerLoopRef.current = null;
  }

  jokerPulse.setValue(1);

  const shouldPulse = !perfectDay && !graceUsed;

  if (shouldPulse) {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(jokerPulse, { toValue: 1.09, duration: 900, useNativeDriver: true }),
        Animated.timing(jokerPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );

    jokerLoopRef.current = loop;
    loop.start();
  }

  return () => {
    if (jokerLoopRef.current) {
      jokerLoopRef.current.stop();
      jokerLoopRef.current = null;
    }
  };
}, [perfectDay, graceUsed, jokerPulse]);


useEffect(() => {
  (async () => {
    const count = await getMealScanCount();
    setMealScanCount(count);
  })();
}, []);

useEffect(() => {
  if (scanLoopRef.current) {
    scanLoopRef.current.stop();
    scanLoopRef.current = null;
  }

  scanPulse.setValue(1);

  const loop = Animated.loop(
    Animated.sequence([
      Animated.timing(scanPulse, {
        toValue: 1.05,
        duration: 1100,
        useNativeDriver: true,
      }),
      Animated.timing(scanPulse, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      }),
    ])
  );

  scanLoopRef.current = loop;
  loop.start();

  return () => {
    if (scanLoopRef.current) {
      scanLoopRef.current.stop();
      scanLoopRef.current = null;
    }
  };
}, [scanPulse]);

  // Validation “perfect day” -> streak + points (et bonus 1/3/7/14)
  useEffect(() => {
    const today = todayKey();
    if (!perfectDay) return;
    if (lastPerfectDay === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);

    const nextStreak = lastPerfectDay === yesterdayKey ? streak + 1 : 1;

    const earnedPoints = 10;
    const goalBonus = nextStreak === 1 || nextStreak === 3 || nextStreak === 7 || nextStreak === 14 ? 50 : 0;

    const nextPoints = points + earnedPoints + goalBonus;

    setStreak(nextStreak);
    setLastPerfectDay(today);
// ✅ archive "validé" AU BON MOMENT (anti-piège)

// ✅ fire-and-forget (recommandé ici)
upsertDaySummary({
  day: today,
  streak: nextStreak,
  points: nextPoints,
  protein,
  carbs,
  fat,
  calories,
  goal,
  weightKg,
}).catch(() => {});
    setPoints(nextPoints);

    if (goalBonus > 0) setLastGoalRewardDay(today);

    setGraceUsed(false); // joker rechargé

    setShowStreakUp(true);
    setTimeout(() => setShowStreakUp(false), 1800);



    persist({
      day,
      protein,
      carbs,
      fat,
      calories,
      log,
      weightKg,
      goal,

      streak: nextStreak,
      lastPerfectDay: today,
      graceUsed: false,

      points: nextPoints,
      
      lastGoalRewardDay: goalBonus > 0 ? today : lastGoalRewardDay,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfectDay]);

 const addEntry = async ({
  foods = [],
  p = 0,
  carb = 0,
  f = 0,
  c = 0,
  photo,
   title,
}: Partial<LogEntry> & { foods?: string[]; photo?: string }) => {
  const nextProtein = protein + (p || 0);
  const nextCarbs = carbs + (carb || 0);
  const nextFat = fat + (f || 0);
  const nextCalories = calories + (c || 0);

  const newEntry: LogEntry = {
    t: Date.now(),
    foods: Array.isArray(foods) ? foods.filter(Boolean) : [],
    p: p || 0,
    carb: carb || 0,
    f: f || 0,
    c: c || 0,
    photo: photo || undefined, // ✅
    title,
  };

  const nextLog = [newEntry, ...log].slice(0, 50);

  setProtein(nextProtein);
  setCarbs(nextCarbs);
  setFat(nextFat);
  setCalories(nextCalories);
  setLog(nextLog);

  await persist({
    day,
    protein: nextProtein,
    carbs: nextCarbs,
    fat: nextFat,
    calories: nextCalories,
    log: nextLog,
  });
};

const handleDeleteLogEntry = async (entryTime: number) => {
  Alert.alert(
    "Supprimer cet ajout ?",
    "Cet apport sera retiré de ta journée.",
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          const nextLog = log.filter((item) => item.t !== entryTime);

          const totals = nextLog.reduce(
            (acc, item) => {
              acc.protein += Number(item.p || 0);
              acc.carbs += Number(item.carb || 0);
              acc.fat += Number(item.f || 0);
              acc.calories += Number(item.c || 0);
              return acc;
            },
            { protein: 0, carbs: 0, fat: 0, calories: 0 }
          );

          setLog(nextLog);
          setProtein(totals.protein);
          setCarbs(totals.carbs);
          setFat(totals.fat);
          setCalories(totals.calories);

          await persist({
            log: nextLog,
            protein: totals.protein,
            carbs: totals.carbs,
            fat: totals.fat,
            calories: totals.calories,
          });
        },
      },
    ]
  );
};

const resetDay = async () => {
  const tk = todayKey();

  setDay(tk);
  setProtein(0);
  setCarbs(0);
  setFat(0);
  setCalories(0);
  setLog([]);

  await persist({
    day: tk,
    protein: 0,
    carbs: 0,
    fat: 0,
    calories: 0,
    log: [],
  });
};
const scanMeal = async () => {
  let base64: string | undefined;

 const allowed = await canUseMealScan(isPremium);

if (!allowed) {
  setMealsPremiumOpen(true);
  return;
}

  const savePhotoOnly = async () => {
    if (!base64) return;
    await addEntry({
      foods: ["Photo repas (non analysé)"],
      p: 0,
      carb: 0,
      f: 0,
      c: 0,
      photo: savePhotos ? base64 : undefined,
      title: "Photo repas",
    });
  };

  try {
    setBusy(true);

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Caméra", "Permission caméra refusée.");
      return;
    }

    const shot = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
    });

    if (shot.canceled) return;
   

    const asset = (shot as any).assets?.[0];
base64 = asset?.base64;

if (!base64) {
  Alert.alert("Scan", "Image non exploitable.");
  return;
}

    // ✅ FETCH avec timeout (12s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let resp: Response;
    try {
      resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!resp.ok) {
      await savePhotoOnly();
      Alert.alert("Scan", `Serveur indisponible, ressayez (${resp.status}). Photo ajoutée à l’album.`);
      return;
    }

    const data = (await resp.json()) as any;
    if (!data?.ok) {
      await savePhotoOnly();
      Alert.alert("Scan", (data?.error || "Analyse interrompue, réessayez dans quelques instants") + " — Photo ajoutée à l’album.");
      return;
    }

   const autoTitle =
  Array.isArray(data.foods) && data.foods.length
    ? String(data.foods[0]) // 1er item comme “indice”
    : "Repas";

await addEntry({
   
  foods: Array.isArray(data.foods) ? data.foods : [],
  p: Math.max(0, roundInt(data.protein_g)),
  carb: Math.max(0, roundInt(data.carbs_g)),
  f: Math.max(0, roundInt(data.fat_g)),
  c: Math.max(0, roundInt(data.calories_kcal)),
  photo: savePhotos ? base64 : undefined,
  title: autoTitle, // ✅
}); 

if (!isPremium) {
  const nextCount = await incrementMealScanCount();
  setMealScanCount(nextCount);
}
  } catch {
    await savePhotoOnly();
    Alert.alert(
      "Scan",
      "Analyse impossible (serveur injoignable). La photo a été ajoutée à l’album."
    );
  } finally {
    setBusy(false);
  }
};


  const quickSupp = async (label: string, p: number, carb: number, f: number, c: number) => {
    await addEntry({ foods: [label], p, carb, f, c });
  };

  const status =
    remainingP === 0 ? "OBJECTIF ATTEINT" : remainingP <= 25 ? "PRESQUE" : "EN COURS";

  const showGoalReachedBanner = lastGoalRewardDay === day;
  const hasStartedToday =
  calories > 0 ||
  protein > 0 ||
  carbs > 0 ||
  fat > 0;

  const firstActionHint =
  !hasStartedToday
    ? "⚡ Scanne ton 1er repas pour lancer le suivi."
    : !perfectDay
    ? `⚡ Il te manque encore : ${biggestGap} (P ${remainingP} • G ${remainingG} • L ${remainingL}).`
    : "✅ Journée validée. Tu peux sécuriser ta série.";

if (!loaded || premiumLoading) return null;

  type MacroBarProps = {
    label: string;
    value: number;
    target: number;
    progress: number;
    color: string;
  };

  const MacroBar = ({ label, value, target, progress, color }: MacroBarProps) => {
    let dynamicColor = color;
    if (progress >= 1) dynamicColor = "#22c55e";
    else if (progress > 0.7) dynamicColor = "#f59e0b";

    return (
      <View style={{ marginTop: 10 }}>
        <Text style={{ color: "#fff", fontSize: 12, opacity: 0.8 }}>
          {label} {value}g / {target}g
        </Text>

        <View
          style={{
            height: 10,
            backgroundColor: "#111827",
            borderRadius: 999,
            overflow: "hidden",
            marginTop: 4,
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${Math.min(1, progress) * 100}%`,
              backgroundColor: dynamicColor,
            }}
          />
        </View>
      </View>
    );
  };
const sectionTitleStyle = {
  color: "#94a3b8" as const,
  fontSize: 11,
  fontWeight: "900" as const,
  letterSpacing: 1.4,
  marginBottom: 8,
};
return (

  
  <SafeAreaView style={{ flex: 1, backgroundColor: "#0a1235" }}>
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={{ padding: 16, paddingTop: 38, paddingBottom: 40 }}
    >
  <Modal
  visible={bodyScanPremiumOpen}
  transparent
  animationType="fade"
  onRequestClose={() => setBodyScanPremiumOpen(false)}
>
  <View
    style={{
      flex: 1,
      backgroundColor: "rgba(2,6,23,0.82)",
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
    }}
  >
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          borderRadius: 22,
          backgroundColor: "#020617",
          borderWidth: 1,
          borderColor: "#1c2fe2",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 22,
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          Body Diet Premium
        </Text>

       <Text
  style={{
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
    fontSize: 16,
  }}
>
  Accède au Body Scan 3D et découvre un univers unique
</Text>

<View
  style={{
    marginTop: 10,
    marginBottom: 8,
    flexDirection: "row",
    gap: 8,
  }}
>
  <View
    style={{
      flex: 1,
      borderRadius: 16,
      backgroundColor: "#08111f",
      borderWidth: 1,
      borderColor: "rgba(96,165,250,0.22)",
      overflow: "hidden",
    }}
  >
    <Image
      source={require("../../assets/images/onboarding-bodyscan.png")}
      resizeMode="contain"
      style={{
        width: "100%",
        height: 128,
        opacity: 0.98,
      }}
    />
  </View>

  <View
    style={{
      flex: 1,
      borderRadius: 16,
      backgroundColor: "#08111f",
      borderWidth: 1,
      borderColor: "rgba(96,165,250,0.22)",
      overflow: "hidden",
    }}
  >
    <Image
      source={require("../../assets/images/onboardingscanf.png")}
      resizeMode="contain"
      style={{
        width: "100%",
        height: 128,
        opacity: 0.98,
      }}
    />
  </View>
</View>

<View style={{ gap: 8 }}>
  <View
    style={{
      padding: 10,
      borderRadius: 12,
      backgroundColor: "rgba(28,47,226,0.12)",
      borderWidth: 1,
      borderColor: "rgba(28,47,226,0.35)",
    }}
  >
    <Text
      style={{
        color: "#fff",
        fontWeight: "800",
        fontSize: 16,
      }}
    >
      🧠 Analyse morphologique avancée
    </Text>
            <Text
              style={{
                color: "#dde3eb",
                marginTop: 3,
                lineHeight: 17,
                fontSize: 13,
              }}
            >
              BodyScan 3D étudie ta silhouette sous plusieurs angles pour identifier
              ta structure physique, ta posture et ton profil sportif probable.
            </Text>
          </View>

          <View
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.04)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "800",
                fontSize: 16,
              }}
            >
              🔬 Lecture de ton corps
            </Text>
            <Text
              style={{
                color: "#cfd5dd",
                marginTop: 3,
                lineHeight: 17,
                fontSize: 13,
              }}
            >
              Découvre les leviers physiques les plus pertinents pour améliorer ta
              silhouette : posture, équilibre musculaire et tonicité globale.
              Compare tes scans pour suivre l’évolution réelle de ta posture et de ta tonicité.
            </Text>
          </View>

          <View
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: "rgba(34,197,94,0.10)",
              borderWidth: 1,
              borderColor: "rgba(34,197,94,0.28)",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "800",
                fontSize: 13,
              }}
            >
              ⚡ Prix 19 € / an
            </Text>

            <Text
              style={{
                color: "#cbd5e1",
                marginTop: 3,
                lineHeight: 17,
                fontSize: 13,
              }}
            >
              ⭐ 39 € accès à vie (coût unique sans abonnement) • Recommandé
            </Text>
          </View>
        </View>

 <View style={{ marginTop: 12 }}>
  <TouchableOpacity
    onPress={() => router.push("/premium" as any)}
    activeOpacity={0.9}
    style={{
      backgroundColor: "#ffffff",
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Text style={{ textAlign: "center", color: "#0b1220", fontWeight: "900" }}>
      🔓 Activer Body Diet Premium
    </Text>
  </TouchableOpacity>


  <TouchableOpacity
    onPress={() => setBodyScanPremiumOpen(false)}
    activeOpacity={0.8}
    style={{
      alignItems: "center",
      paddingVertical: 6,
    }}
  >
    <Text
      style={{
        color: "#94a3b8",
        fontSize: 13,
        fontWeight: "700",
      }}
    >
      ← Retour
    </Text>
  </TouchableOpacity>
</View>
      </View>
    </ScrollView>
  </View>
</Modal>

<Modal
  visible={mealsPremiumOpen}
  transparent
  animationType="fade"
  onRequestClose={() => setMealsPremiumOpen(false)}
>
  <View
    style={{
      flex: 1,
      backgroundColor: "rgba(2,6,23,0.82)",
      justifyContent: "center",
      padding: 10,
    }}
  >
    <View
      style={{
        borderRadius: 24,
        backgroundColor: "#020617",
        borderWidth: 1,
        borderColor: "#1c2fe2",
        padding: 10,
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: 20,
          fontWeight: "900",
          textAlign: "center",
        }}
      >
        Body Repas- Premium
      </Text>

      <Text
        style={{
          color: "#ebeef3",
          textAlign: "center",
          marginTop: 8,
          lineHeight: 20,
        }}
      > Accéde au Scan Repas illimité, BodyScan3D Full options et
        Une sélection intelligente de repas :
      </Text>

      <Image
  source={require("../../assets/images/onboarding-assiette.png")}
  resizeMode="cover"
  style={{
    width: "100%",
    height: 120,
    borderRadius: 16,
    marginTop: 14,
    marginBottom: 10,
    opacity: 0.95,
  }}
/>

      <View style={{ marginTop: 18, gap: 10 }}>

        <View
          style={{
            padding: 12,
            borderRadius: 14,
            backgroundColor: "rgba(28,47,226,0.12)",
            borderWidth: 1,
            borderColor: "rgba(28,47,226,0.35)",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>
            🍽 Arrête de casser tes macros
          </Text>
          <Text style={{ color: "#dde3eb", marginTop: 4, lineHeight: 19 }}>
            Choisis plus facilement des repas cohérents avec ta sèche, ton maintien ou ta prise de masse.
          </Text>
        </View>

        <View
          style={{
            padding: 12,
            borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>
            📊 Mange utile au quotidien
          </Text>
          <Text style={{ color: "#94a3b8", marginTop: 4, lineHeight: 19 }}>
            Proteines, glucides, lipide mieux répartis pour respecter ton plan nutrition sans prise de tête.
          </Text>
        </View>

    

        <View
          style={{
            padding: 10,
            borderRadius: 14,
            backgroundColor: "rgba(34,197,94,0.10)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>
            💰 Garde le contrôle sur ton budget
          </Text>
          <Text style={{ color: "#cbd5e1", marginTop: 4, lineHeight: 19 }}>
            Choisis entre mode éco, standard ou bio pour optimiser ton alimentation sans exploser ton budget.
          </Text>

</View>
      <View
  style={{
    padding: 5,
    borderRadius: 14,
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.28)",
  }}
>
  <Text style={{ color: "#fff", fontWeight: "800" }}>
    ⚡ Body Diet Premium
  </Text>

  <Text style={{ color: "#cbd5e1", marginTop: 4 }}>
    19 € / an  - ou
  </Text>

  <Text style={{ color: "#cbd5e1", marginTop: 4 }}>
    ⭐ 39 € accès à vie (paiement unique)
  </Text>

  <Text
    style={{
      color: "#22c55e",
      marginTop: 1,
      fontWeight: "800",
      lineHeight: 10,
    }}
  >
  </Text>
</View>   

  </View>
<View style={{ marginTop: 15, gap: 14 }}>

  {/* BOUTON PREMIUM */}
<TouchableOpacity
  onPress={() => {
    setMealsPremiumOpen(false);
    router.push("/premium" as any);
  }}
  activeOpacity={0.9}
  style={{
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  }}
>
  <Text style={{ color: "#0b1220", fontWeight: "900", fontSize: 14 }}>
    🔓 Activer Body Diet Premium
  </Text>
</TouchableOpacity>

  {/* BOUTON RETOUR */}
  <TouchableOpacity
    onPress={() => setMealsPremiumOpen(false)}
    activeOpacity={0.8}
    style={{
      alignItems: "center",
      paddingVertical: 5,
    }}
  >
    <Text
      style={{
        color: "#94a3b8",
        fontSize: 14,
        fontWeight: "700",
      }}
    >
      ← Retour
    </Text>
  </TouchableOpacity>

</View>
    </View>
  </View>
</Modal>


 <View
  style={{
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 8,
  }}
>
  <TouchableOpacity
    onPress={() => setMenuOpen(true)}
    style={{
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: "#020617",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.10)",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Text style={{ color: "#cbd5e1", fontSize: 18, fontWeight: "900" }}>☰</Text>
  </TouchableOpacity>
</View>
      {/* HEADER JOUR */}
      <View
  style={{
    marginTop: 6,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#f2f7f3",

    shadowColor: "#000",
shadowOpacity: 0.10,
shadowRadius: 16,
shadowOffset: { width: 0, height: 6 },
elevation: 4,
  }}
>
      <Text style={{ color: "#fff", fontSize: 16, opacity: 0.9 }}>
  AUJOURD’HUI • {day}
</Text>
{/* PROGRESSION JOURNÉE */}
<View style={{ marginTop: 8 }}>
  <View
    style={{
      height: 3,
      borderRadius: 999,
      backgroundColor: "#1f2937",
      overflow: "hidden",
    }}
  >
    <View
      style={{
        width: `${dayScore}%`,
        height: "100%",
        backgroundColor: "#f31010",
      }}
    />
  </View>

  <Text style={{ color: "#94a3b8", marginTop: 4, fontSize: 12 }}>
    Progression nutrition : {dayScore}%
  </Text>
</View>

<View
  style={{
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  }}
>
  <Text style={{ color: "#e5e7eb", fontWeight: "800", fontSize: 12 }}>
    Challenge du jour actif
  </Text>
</View>
<Text style={{ color: "#e5e7eb", opacity: 0.75, fontSize: 12, marginTop: 8 }}>
  {firstActionHint}
</Text>
<View style={{ marginTop: 10 }}>
  <Text style={{ color: "#fad711", fontWeight: "700" }}>
    🏆{" "}
    {streak === 0
      ? "Série nutrition • Jour 1/1"
      : `Série repas équilibrés : ${streak} jour${streak > 1 ? "s" : ""}`}{" "}
    (Objectif : {streakGoal} jours)
  </Text>

  {/*{streak === 0 && (
  <Text style={{ color: "#fff", opacity: 0.6, fontSize: 12 }}>
    Valide aujourd’hui pour démarrer ta série.
  </Text>
)}

{streak > 0 && daysToGoal > 1 && (
  <Text style={{ color: "#fff", opacity: 0.6, fontSize: 12 }}>
    Encore {daysToGoal} jours pour valider l’objectif.
  </Text>
)}

{streak > 0 && daysToGoal === 1 && (
  <Text style={{ color: "#22c55e", fontSize: 12 }}>
    Dernier jour avant validation !
  </Text>
)}

  {/* ✅ Points + Joker sur une ligne (plus de chevauchement) */}
  <View
    style={{
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <View style={{ flex: 1 }}>
      <Text style={{ color: "#38BDF8", fontWeight: "700" }}>
        🎯 Points BODY : {points}
      </Text>

      <Text style={{ color: "#9CA3AF", marginTop: 4, fontSize: 12 }}>
        Prochaine recompense : {nextReward} pts
      </Text>
    </View>

    <Animated.View
      style={{
        transform: [{ scale: jokerPulse }],
        opacity: graceUsed || perfectDay ? 0.35 : 1,
      }}
    >
      <TouchableOpacity
        onPress={useJoker}
        disabled={graceUsed || perfectDay}
        style={{
          backgroundColor: "rgba(2,6,23,0.9)",
          borderWidth: 1,
          borderColor: graceUsed ? "#374151" : "#1C2FE2",
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 999,

          shadowColor: "#60a5fa",
          shadowOpacity: graceUsed ? 0 : 0.6,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 0 },
          elevation: graceUsed ? 0 : 10,
        }}
      >
        <Text style={{ color: "#60a5fa", fontWeight: "900" }}>🛟</Text>
      </TouchableOpacity>
    </Animated.View>
  </View>



{profileIncomplete && (
  <Text
    style={{
      marginTop: 10,
      color: "#fbbf24",
      fontSize: 13,
      textAlign: "center",
    }}
  >
    Complète ton profil (taille et poids) pour améliorer l’analyse BodyDiet.
  </Text>
)}

  {graceUsed && (
    <>
      <View
        style={{
          marginTop: 8,
          alignSelf: "flex-start",
          backgroundColor: "#0f172a",
          borderWidth: 1,
          borderColor: "#334155",
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
        }}
      >
        <Text style={{ color: "#cbd5e1", fontWeight: "900", fontSize: 12 }}>
          🛟 Joker utilise (1/1)
        </Text>
      </View>

      <Text style={{ color: "#fff", opacity: 0.55, marginTop: 6, fontSize: 12 }}>
        Ta serie est protegee pour aujourd hui.
      </Text>
    </>
  )}
</View> 
        

        {showGoalReachedBanner && (
          <View
            style={{
              marginTop: 10,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: "#052e16",
              borderWidth: 1,
              borderColor: "#22c55e",
            }}
          >
            <Text style={{ color: "#22c55e", fontWeight: "900" }}>🎉 Objectif valide !</Text>

            <Text style={{ color: "#bbf7d0", opacity: 0.9, marginTop: 4, fontSize: 12 }}>
              Bonus BODY debloque. Nouveau round jusqu’a {streakGoal} jours.
            </Text>
          </View>
        )}

        {/* animation si echec */}
       
        {hasStartedToday && !perfectDay && (
          <View
            style={{
              marginTop: 10,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: "#111827",
              borderWidth: 1,
              borderColor: "#1f2937",
            }}
            
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
               Repas contrôlé, effort récompensé ! 
            </Text>

            <Text style={{ color: "#fff", opacity: 0.65, marginTop: 4, fontSize: 12 }}>
              C'est la régularité qui donne les résultats, continue demain !
            </Text>
          </View>
        )}

        {/* animation streak */}
        {showStreakUp && (
          <View
            style={{
              marginTop: 10,
              alignSelf: "flex-start",
              backgroundColor: "#16a34a",
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>🏆 Série +1</Text>
          </View>
        )}
      </View>

      {/* ... ensuite tu reprends ton bloc MACROS ici ... */}

    
  {/* MACROS */}
<View
  style={{
    marginTop: 15,
    padding: 3,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#020617",
  }}
>
  <View
    style={{
      marginTop: 1,
      padding: 12,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "#1f2937",
      backgroundColor: "#020617",
    }}
  >
    <Text
      style={{
        color: "#fbfcfb",
        fontSize: 19,
        fontWeight: "900",
        letterSpacing: 1.2,
        opacity: 0.9,
        marginBottom: 8,
      }}
    >
      MACROS DU JOUR
    </Text>

    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
        <Text
          style={{
            color: "#fff",
            fontSize: 80,
            fontWeight: "900",
            letterSpacing: 2,
          }}
        >
          {protein}
        </Text>

        <Text
          style={{
            color: "#d1d5db",
            fontSize: 27,
            marginLeft: 6,
            marginBottom: 8,
            fontWeight: "700",
          }}
        >
          / {adjustedTargets.protein}g
        </Text>
      </View>

      <View
        style={{
          width: 74,
          height: 74,
          borderRadius: 22,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 1,
          marginLeft: "auto",
        }}
      >
        <Image
          source={require("../../assets/images/icon.png")}
          resizeMode="cover"
          style={{
            width: 60,
            height: 60,
            borderRadius: 22,
            opacity: 0.95,
          }}
        />
      </View>
    </View>

    {/* JAUGE PROT */}
    <View
      style={{
        marginTop: 10,
        height: 12,
        backgroundColor: "#33363d",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${Math.max(0, Math.min(1, proteinProgress)) * 100}%`,
          backgroundColor:
            proteinProgress >= 1
              ? "#16A34A"
              : proteinProgress > 0.6
              ? "#EA580C"
              : "#1C2FE2",
          borderRadius: 999,
        }}
      />
    </View>

    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>
        PROTÉINES
      </Text>
      <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>
        Encore {Math.max(0, adjustedTargets.protein - protein)}g
      </Text>
    </View>

    <View
      style={{
        height: 1,
        backgroundColor: "rgba(255,255,255,0.08)",
        marginVertical: 14,
      }}
    />

    <Text style={{ color: "#cbd5e1", fontSize: 15, marginBottom: 8 }}>
      Glucides {carbs}g / {adjustedTargets.carbs}g
    </Text>

    <View
      style={{
        height: 8,
        borderRadius: 999,
        backgroundColor: "#111827",
        overflow: "hidden",
        marginBottom: 14,
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${Math.max(0, Math.min(1, carbProgress)) * 100}%`,
          backgroundColor:
            carbProgress >= 1
              ? "#16A34A"
              : carbProgress > 0.6
              ? "#EA580C"
              : "#1C2FE2",
        }}
      />
    </View>

    <Text style={{ color: "#cbd5e1", fontSize: 15, marginBottom: 8 }}>
      Lipides {fat}g / {adjustedTargets.fat}g
    </Text>

    <View
      style={{
        height: 8,
        borderRadius: 999,
        backgroundColor: "#111827",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${Math.max(0, Math.min(1, fatProgress)) * 100}%`,
          backgroundColor:
            fatProgress >= 1
              ? "#16A34A"
              : fatProgress > 0.6
              ? "#EA580C"
              : "#1C2FE2",
        }}
      />
    </View>

    <Text
      style={{
        textAlign: "center",
        color: "#fff",
        fontWeight: "900",
        fontSize: 18,
        marginTop: 18,
      }}
    >
      🔥 {calories} kcal aujourd’hui
    </Text>
  </View>
</View>
          
{adjustedTargets.appliedKcal > 0 && (
  <Text style={{ color: "#94a3b8", marginTop: 6 }}>
    Macros ajustées : +{adjustedTargets.bonusCarbG}G / +{adjustedTargets.bonusFatG}L
  </Text>
)}

        

{ENABLE_BODY_CHALLENGE && (
<View
  style={{
    marginTop: 18,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(8, 47, 73, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.45)",
  }}
>
  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
    Challenge forme Coach BodyDiet • Cette semaine
  </Text>

  {!challengeUnlocked ? (
    <Text style={{ color: "#cbd5e1", fontSize: 14, marginTop: 10, lineHeight: 20 }}>
      Mission de départ : fais un scan body pour débloquer ton programme 7 jours.
    </Text>
  ) : (
    <View>
      <Text style={{ color: "#86efac", fontSize: 13, marginTop: 10, fontWeight: "800" }}>
        Jour {challengeDayNumber}/7
      </Text>

      <Text style={{ color: "#e2e8f0", fontSize: 14, marginTop: 8, lineHeight: 21 }}>
        Mission du jour : {coachTodayMission || "Programme en attente."}
      </Text>

      {challengeFinished ? (
        <Text style={{ color: "#facc15", fontSize: 13, marginTop: 10, lineHeight: 19 }}>
          Jour 7 atteint. Un nouveau body scan est conseillé pour suivre ta progression et débloquer un nouveau plan.
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={handleValidateCoachChallengeDay}
        disabled={coachTodayValidated}
        style={{
          marginTop: 14,
          alignSelf: "flex-start",
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 14,
          backgroundColor: coachTodayValidated ? "rgba(34,197,94,0.20)" : "#22c55e",
          borderWidth: 1,
          borderColor: coachTodayValidated ? "rgba(34,197,94,0.35)" : "#22c55e",
        }}
      >
        <Text
          style={{
            color: coachTodayValidated ? "#86efac" : "#062814",
            fontWeight: "900",
            fontSize: 14,
          }}
        >
          {coachTodayValidated ? "✅ Challenge validé aujourd’hui" : "Valider la mission du jour"}
        </Text>
      </TouchableOpacity>
    </View>
  )}
</View>
)}

{/* EFFORTS PHYSIQUES */}
<Text style={[sectionTitleStyle, { marginTop: 22 }]}>EFFORT</Text>

<View
  style={{
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  }}
>
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <View style={{ flex: 1, paddingRight: 10 }}>
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>
        🏃 Effort du jour
      </Text>
      <Text style={{ color: "#94a3b8", marginTop: 6, fontSize: 13 }}>
        {formatEffortLabel(effort)}
      </Text>
    </View>

    <TouchableOpacity
      onPress={() => setEffortOpen(true)}
      style={{
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>
        Ajouter
      </Text>
    </TouchableOpacity>
  </View>
</View>
<Text
  style={{
    color: "#ffffff",
    opacity: 0.35,
    fontSize: 11,
      marginTop: 4,
    marginBottom: -14,
    textAlign: "center",
  }}
>
  Ajoute ton effort pour ajuster tes macros.
</Text>

{/* SCAN */}
<View
  style={{
    marginTop: 1,

    // halo lumineux
    shadowColor: "#38bdf8",
    shadowOpacity: busy ? 0 : 1,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 0 },
    elevation: busy ? 0 : 50,
  }}
>
  <Text style={[sectionTitleStyle, { marginTop: 22 }]}>SCAN TES REPAS</Text>

  <Animated.View style={{ transform: [{ scale: scanPulse }] }}>
    <TouchableOpacity
        onPress={handleScanMealPress}
   
      disabled={busy}
      activeOpacity={0.9}
      style={{
        paddingVertical: 18,
        borderRadius: 14,
        backgroundColor: busy ? "#1f2937" : "#ffffff",
        alignItems: "center",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialCommunityIcons
          name="barcode-scan"
          size={20}
          color="#1b0b20"
          style={{ marginRight: 8 }}
        />

        <Text
          style={{
            textAlign: "center",
            fontSize: 16,
            fontWeight: "900",
            color: "#0b1220",
            letterSpacing: 0.8,
          }}
        >
          {busy ? "ANALYSE…" : "SCAN REPAS"}
          
 
        </Text>
      </View> 
    </TouchableOpacity>

     {!isPremium && (
  <Text
    style={{
      color: "#94a3b8",
      marginTop: 8,
      textAlign: "center",
      fontSize: 12,
      fontWeight: "700",
    }}
  >
    {Math.max(0, FREE_MEAL_SCAN_LIMIT - mealScanCount) === 1
      ? "⚠ Dernier scan repas gratuit"
      : `Scans repas gratuits restants : ${Math.max(0, FREE_MEAL_SCAN_LIMIT - mealScanCount)}`}
  </Text>
)}
  </Animated.View>
  <View
  style={{
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  }}
>
  <View style={{ flex: 1, paddingRight: 10 }}>
    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 13 }}>
      Sauvegarder les photos repas
    </Text>
    <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 3 }}>
      Active ou non l’enregistrement des photos dans l’album repas
    </Text>
  </View>
<Switch
  value={savePhotos}
  onValueChange={async (value) => {
    setSavePhotos(value);
    await persist({ savePhotos: value });
  }}
  trackColor={{ false: "#1f2937", true: "#1c2fe2" }}
  thumbColor={savePhotos ? "#dbeafe" : "#9ca3af"}
  ios_backgroundColor="#1f2937"
/>
 
</View>
  </View>



  <Text style={[sectionTitleStyle, { marginTop: 22 }]}>OUTILS</Text>

<TouchableOpacity
  onPress={() => router.push("/album-meals")}
  style={{
    marginTop: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(128, 120, 120, 0.34)",
  }}
>
  <View
    style={{
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MaterialCommunityIcons name="nutrition" size={20} color="#fff" />
    <Text style={{ color: "#fff", fontWeight: "900", marginLeft: 8 }}>
      ALBUM REPAS
    </Text>
  </View>
</TouchableOpacity>

<View
  style={{
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  }}
>
  <TouchableOpacity
   onPress={() => {
if (isPremium) {
    router.push("/premium-meals" as any);
  } else {
    setMealsPremiumOpen(true);
  }
}}
    style={{
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
     backgroundColor: isPremium  ? "#ffffff" : "#0f172a",
      borderWidth: 1,
     borderColor:  isPremium ? "#1c2fe2" : "#334155",
      justifyContent: "center",
    }}
  >
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 8,
      }}
    >
      <MaterialCommunityIcons
        name={ isPremium ? "food-apple" : "lock-outline"}
        size={20}
        color={ isPremium ? "#0b1220" : "#60a5fa"}
      />

      <Text
        style={{
          color:  isPremium ? "#0b1220" : "#e2e8f0",
          fontWeight: "900",
          marginLeft: 8,
          textAlign: "center",
          fontSize: 13,
        }}
        numberOfLines={1}
      >
       { isPremium ? "REPAS BODY DIET" : "🔒 BODY REPAS"}
      </Text>
    </View>

    {! isPremium && (
      <Text
        style={{
          textAlign: "center",
          color: "#94a3b8",
          fontSize: 11,
          marginTop: 6,
          paddingHorizontal: 6,
        }}
        numberOfLines={2}
      >
        Tes Repas optimisés
      </Text>
    )}
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => {
     if ( isPremium) {
        router.push("/body-scan");
      } else {
        setBodyScanPremiumOpen(true);
      }
    }}
    style={{
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
     backgroundColor:  isPremium ? "#020617" : "#0f172a",
      borderWidth: 1,
     borderColor: isPremium ? "rgba(128, 120, 120, 0.34)" : "#1c2fe2",
      opacity:  isPremium ? 1 : 0.96,
      justifyContent: "center",
    }}
  >
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 8,
      }}
    >
      <MaterialCommunityIcons
       name={ isPremium ? "account-search" : "lock-outline"}
        size={20}
       color={ isPremium ? "#fff" : "#60a5fa"}
      />

      <Text
        style={{
          color:  isPremium ? "#fff" : "#e2e8f0",
          fontWeight: "900",
          marginLeft: 8,
          textAlign: "center",
          fontSize: 13,
        }}
        numberOfLines={1}
      >
       { isPremium ? "SCAN BODY" : "🔒 BODY SCAN 3D"}
      </Text>
    </View>

    {! isPremium && (
      <Text
        style={{
          textAlign: "center",
          color: "#94a3b8",
          fontSize: 11,
          marginTop: 6,
          paddingHorizontal: 6,
        }}
        numberOfLines={2}
      >
        Ta Composition Corporelle
      </Text>
    )}
  </TouchableOpacity>
</View>

    {/* AJOUT RAPIDE */}
<Text style={[sectionTitleStyle, { marginTop: 22 }]}>AJOUT RAPIDE</Text>

<View
  style={{
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 1,
  }}
>

 {[
  { label: "Shake prot", action: () => quickSupp("Shake prot", 25, 3, 2, 130) },
  { label: "Shake x2", action: () => quickSupp("Shake prot x2", 50, 6, 4, 260) },
  { label: "Yaourt prot", action: () => quickSupp("Yaourt prot", 20, 12, 2, 150) },
  { label: "Barre prot", action: () => quickSupp("Barre prot", 15, 20, 7, 200) },
  { label: "Gainer", action: () => quickSupp("Gainer (portion)", 20, 60, 5, 350) },
].map((item, i) => (
  <TouchableOpacity
    key={i}
    onPress={item.action}
    style={{
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: "#020617",
      minWidth: 110,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Text
      style={{
        color: "#e5e7eb",
        fontSize: 13,
        fontStyle: "italic",
        fontWeight: "700",
        textAlign: "center",
      }}
    >
      {item.label}
    </Text>
  </TouchableOpacity>
))}

  <TouchableOpacity
    onPress={() => {
      setManualOpen(true);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 120);
    }}
    style={{
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: "#0f172a",
    }}
  >
    <Text
      style={{
        color: "#e5e7eb",
        fontSize: 13,
        fontStyle: "italic",
        fontWeight: "700",
      }}
    >
      Ajout perso
    </Text>
  </TouchableOpacity>

</View>   

<Text style={[sectionTitleStyle, { marginTop: 22 }]}>SUIVI</Text>

<TouchableOpacity
  onPress={() => router.push("/progress")}
  style={{
    marginTop: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#36404e",
  }}
>
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        marginRight: 8,
        gap: 3,
        height: 16,
      }}
    >
      <View
        style={{
          width: 4,
          height: 7,
          borderRadius: 3,
          backgroundColor: "#22c55e",
        }}
      />
      <View
        style={{
          width: 4,
          height: 11,
          borderRadius: 3,
          backgroundColor: "#f59e0b",
        }}
      />
      <View
        style={{
          width: 4,
          height: 15,
          borderRadius: 3,
          backgroundColor: "#1c2fe2",
        }}
      />
    </View>

    <Text style={{ color: "#fff", fontWeight: "900" }}>
      PROGRESSION macro (7 jours)
    </Text>
  </View>
</TouchableOpacity>

<TouchableOpacity
  onPress={() => router.push("/diagnostic-training" as any)}
  style={{
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  }}
>
  <Text
    style={{
      textAlign: "center",
      color: "#fff",
      fontWeight: "900",
      fontSize: 14,
    }}
  >
    Diagnostic entraînement
  </Text>

  <Text
    style={{
      textAlign: "center",
      color: "#94a3b8",
      fontSize: 12,
      marginTop: 4,
    }}
  >
    Identifie ce qui bloque ta progression musculaire
  </Text>
</TouchableOpacity>

    {/* PROFIL + OBJECTIF */}
<View
  style={{
    marginTop: 26,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.66)",
  }}
>
  <Text style={sectionTitleStyle}>PROFIL</Text>

  <Text
    style={{
      color: "#fff",
      fontSize: 16,
      fontWeight: "900",
      letterSpacing: 0.3,
    }}
  >
    👤 Profil
  </Text>

  <Text
    style={{
      color: "#94a3b8",
      fontSize: 12,
      marginTop: 6,
      lineHeight: 18,
    }}
  >
    Renseigne ton profil pour affiner les repères body et les analyses.
  </Text>

  <View style={{ flexDirection: "row", marginTop: 14, gap: 10 }}>
    {/* POIDS */}
    <View style={{ flex: 1 }}>
      <Text style={{ color: "#fff", fontSize: 12, opacity: 0.7 }}>
        Ton Poids (kg)
      </Text>
      <TextInput
        value={weightKg === "75" ? "" : weightKg}
        onChangeText={async (v) => {
          setWeightKg(v);
          await persist({});
        }}
        placeholder="Ex : 75"
        placeholderTextColor="#6b7280"
        keyboardType="numeric"
        style={{
          marginTop: 6,
          padding: 12,
          borderRadius: 12,
          backgroundColor: "#111827",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.10)",
          color: "#fff",
          fontSize: 16,
          fontWeight: "700",
        }}
      />
    </View>

    {/* TAILLE */}
    <View style={{ flex: 1 }}>
      <Text style={{ color: "#fff", fontSize: 12, opacity: 0.7 }}>
        Ta Taille (cm)
      </Text>
      <TextInput
        value={heightCm === "175" ? "" : heightCm}
        onChangeText={async (v) => {
          setHeightCm(v);
          await persist({});
        }}
        placeholder="Ex : 175"
        placeholderTextColor="#6b7280"
        keyboardType="numeric"
        style={{
          marginTop: 6,
          padding: 12,
          borderRadius: 12,
          backgroundColor: "#111827",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.10)",
          color: "#fff",
          fontSize: 16,
          fontWeight: "700",
        }}
      />
    </View>
  </View>

  {/* OBJECTIF */}
  <View style={{ marginTop: 18 }}>
    <Text style={sectionTitleStyle}>OBJECTIF</Text>

    <Text
      style={{
        color: "#fff",
        fontSize: 16,
        fontWeight: "900",
        letterSpacing: 0.3,
      }}
    >
      🏁 Objectif
    </Text>

    <View style={{ flexDirection: "row", marginTop: 8 }}>
      <MiniBtn
        active={goal === "gain"}
        label="Masse"
        onPress={async () => {
          setGoal("gain");
          await persist({ goal: "gain" });
        }}
      />
      <MiniBtn
        active={goal === "cut"}
        label="Sèche"
        onPress={async () => {
          setGoal("cut");
          await persist({ goal: "cut" });
        }}
      />
      <MiniBtn
        active={goal === "maintain"}
        label="Maintien"
        onPress={async () => {
          setGoal("maintain");
          await persist({ goal: "maintain" });
        }}
      />
    </View>
  </View>
</View>
        {/* PERFECT DAY */}
        {perfectDay && (
          <View
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 14,
              backgroundColor: "#052e16",
              borderWidth: 1,
              borderColor: "#22c55e",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 22 }}>🔥</Text>

            <Text style={{ color: "#22c55e", fontWeight: "900", marginTop: 4 }}>
              JOURNÉE PARFAITE
            </Text>

            <Text style={{ color: "#86efac", opacity: 0.8 }}>
              Objectifs nutrition atteints
            </Text>
          </View>
        )}

        {/* COACH */}
        <View
          style={{
            marginTop: 26,
            padding: 14,
            borderRadius: 14,
            backgroundColor: "#020617",
            borderWidth: 1,
            borderColor: "#1f2937",
          }}
        >
          <Text style={{ color: "#38BDF8", fontWeight: "900" }}>COACH BODY</Text>

          <Text style={{ color: "#fff", opacity: 0.8, marginTop: 6 }}>
            {coachFreeLine}
          </Text>

          <Text style={{ color: "#fff", opacity: 0.75, marginTop: 8 }}>
            {coachFreeAction}
          </Text>

          <View
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: "#1f2937",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>BodyDIET</Text>

         {isPremium ? (
  <>
    

    {/* BADGES PREMIUM */}
    <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 8 }}>
      <View
        style={{
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: "rgba(56,189,248,0.15)",
        }}
      >
        <Text style={{ color: "#38BDF8", fontWeight: "900", fontSize: 11 }}>Progression</Text>
      </View>

      <View
        style={{
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: "rgba(56,189,248,0.15)",
        }}
      >
        <Text style={{ color: "#38BDF8", fontWeight: "900", fontSize: 11 }}>Ajustement</Text>
      </View>

      <View
        style={{
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: "rgba(56,189,248,0.15)",
        }}
      >
        <Text style={{ color: "#38BDF8", fontWeight: "900", fontSize: 11 }}>Body Scan</Text>
      </View>
    </View>

    {/* Analyse progression Premium */}
    <View style={{ marginTop: 14 }}>
      <Text style={{ color: "#38BDF8", fontWeight: "900" }}>Analyse de progression</Text>

      <Text style={{ color: "#cbd5e1", marginTop: 6 }}>
        Ton objectif protéines est atteint {proteinProgress >= 1 ? "aujourd'hui." : "partiellement aujourd'hui."}
      </Text>

      <Text style={{ color: "#94a3b8", marginTop: 4 }}>
        Sur la semaine, ta régularité nutritionnelle détermine tes résultats.
      </Text>
    </View>

    {/* Ajustement nutrition Premium */}
    <View style={{ marginTop: 14 }}>
      <Text style={{ color: "#38BDF8", fontWeight: "900" }}>Ajustement nutrition</Text>

      <Text style={{ color: "#cbd5e1", marginTop: 6 }}>
        {remainingP > 0
          ? `Ton prochain repas devrait apporter environ ${Math.min(remainingP, 40)}g de protéines.`
          : "Ton objectif protéines est atteint pour aujourd'hui."}
      </Text>

      <Text style={{ color: "#94a3b8", marginTop: 4 }}>
        Une bonne répartition des macros améliore les résultats physiques.
      </Text>
    </View>

    {/* Body Scan Premium */}
    <View style={{ marginTop: 14 }}>
      <Text style={{ color: "#38BDF8", fontWeight: "900" }}>Body Scan 3D évolution</Text>

      <Text style={{ color: "#cbd5e1", marginTop: 6 }}>
        Compare ton évolution physique grâce au scan corporel hebdomadaire.
      </Text>

      <Text style={{ color: "#94a3b8", marginTop: 4 }}>
        Le suivi visuel montre des changements que la balance ne voit pas.
      </Text>
    </View>
  </>
) : (
  <>
    {premiumPreviewLines.map((l) => (
  <Text
    key={l}
    style={{
      color: l.startsWith("📈") || l.startsWith("🍽") || l.startsWith("🔥")
        ? "#e2e8f0"
        : "#94a3b8",
      marginTop: 6,
      lineHeight: 20,
      fontWeight: l.startsWith("📈") || l.startsWith("🍽") || l.startsWith("🔥")
        ? "600"
        : "400",
    }}
  >
    {l}
  </Text>
))}

    <Text style={{ color: "#38BDF8", fontWeight: "800", marginTop: 12 }}>
    Progression accélérée. Objectif optimisé. Résultats visibles.
    </Text>

    <View style={{ marginTop: 12 }}>
  <TouchableOpacity
    onPress={() => router.push("/premium" as any)}
    activeOpacity={0.9}
    style={{
      backgroundColor: "#ffffff",
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Text style={{ textAlign: "center", color: "#0b1220", fontWeight: "900" }}>
      🔓 Activer Body Diet Premium
    </Text>
  </TouchableOpacity>
</View>

    <Text style={{ color: "#fff", opacity: 0.55, marginTop: 8, fontSize: 12 }}>
     Body Scan 3D + repas optimisés.
    </Text>

  </>
)}



          </View>
        </View>

  {/* LOG */}
<View style={{ marginTop: 26 }}>
  <Text style={{ color: "#fff", fontSize: 12, opacity: 0.7 }}>
    DERNIERS AJOUTS
  </Text>

  {log.length === 0 ? (
    <Text style={{ color: "#fff", opacity: 0.6, marginTop: 10 }}>
      Rien pour l’instant.
    </Text>
  ) : (
    log.slice(0, 8).map((e) => (
      <View
        key={String(e.t)}
        style={{
          marginTop: 10,
          padding: 12,
          borderRadius: 12,
          backgroundColor: "#111827",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ color: "#fff", fontWeight: "800" }}>
            +{e.p}P • +{e.carb}G • +{e.f}L
            <Text style={{ opacity: 0.7, fontWeight: "600" }}> • {e.c} kcal</Text>
          </Text>

          <Text style={{ color: "#fff", opacity: 0.65, marginTop: 4 }}>
            {(e.foods || []).join(" • ") || "Repas"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => handleDeleteLogEntry(e.t)}
          style={{
            padding: 6,
            opacity: 0.55,
          }}
        >
          <Text style={{ color: "#9ca3af", fontSize: 18 }}>🗑</Text>
        </TouchableOpacity>
      </View>
    ))
  )}
</View>

<TouchableOpacity
  onPress={resetDay}
  style={{ marginTop: 18, paddingVertical: 14 }}
>
  <Text style={{ color: "#fff", opacity: 0.6, textAlign: "center" }}>
    Reset journée
  </Text>
</TouchableOpacity>

        {/* AJOUT PERSO */}
        {manualOpen && (
          <View
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 14,
              backgroundColor: "#0f172a",
              borderWidth: 1,
              borderColor: "#1f2937",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>AJOUT PERSO</Text>

            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: "#fff", fontSize: 12, opacity: 0.7 }}>Protéines (g)</Text>
                <TextInput
                  value={manualP}
                  onChangeText={setManualP}
                  keyboardType="numeric"
                  style={{
                    marginTop: 6,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: "#111827",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "800",
                  }}
                />
              </View>

              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: "#fff", fontSize: 12, opacity: 0.7 }}>Glucides (g)</Text>
                <TextInput
                  value={manualCarb}
                  onChangeText={setManualCarb}
                  keyboardType="numeric"
                  style={{
                    marginTop: 6,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: "#111827",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "800",
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 12, opacity: 0.7 }}>Lipides (g)</Text>
                <TextInput
                  value={manualF}
                  onChangeText={setManualF}
                  keyboardType="numeric"
                  style={{
                    marginTop: 6,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: "#111827",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "800",
                  }}
                />
              </View>
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={{ color: "#fff", fontSize: 12, opacity: 0.7 }}>Calories (kcal)</Text>
              <TextInput
                value={manualC}
                onChangeText={setManualC}
                keyboardType="numeric"
                style={{
                  marginTop: 6,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: "#111827",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "800",
                }}
              />
            </View>

            <View style={{ flexDirection: "row", marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => setManualOpen(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: "#111827",
                  marginRight: 10,
                }}
              >
                <Text style={{ textAlign: "center", color: "#fff", fontWeight: "900" }}>
                  FERMER
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  const p = Math.max(0, parseInt(manualP || "0", 10) || 0);
                  const carb = Math.max(0, parseInt(manualCarb || "0", 10) || 0);
                  const f = Math.max(0, parseInt(manualF || "0", 10) || 0);

                  let c = Math.max(0, parseInt(manualC || "0", 10) || 0);
                  if (!c) c = p * 4 + carb * 4 + f * 9;

                  if (!p && !carb && !f && !c) return;

                 await addEntry({ foods: ["Ajout perso"], p, carb, f, c });

// ✅ reset champs pour prochain ajout
setManualP("");
setManualCarb("");
setManualF("");
setManualC("");

setManualOpen(false);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: "#ffffff",
                }}
              >
                <Text style={{ textAlign: "center", color: "#0b1220", fontWeight: "900" }}>
                  AJOUTER
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
<Modal
  visible={menuOpen}
  transparent
  animationType="fade"
  onRequestClose={() => setMenuOpen(false)}
>
  <View
    style={{
      flex: 1,
      backgroundColor: "rgba(2,6,23,0.82)",
      justifyContent: "center",
      padding: 20,
    }}
  >
    <View
      style={{
        borderRadius: 22,
        backgroundColor: "#020617",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        padding: 16,
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: 18,
          fontWeight: "900",
          textAlign: "center",
          marginBottom: 14,
        }}
      >
        Menu
      </Text>

      <TouchableOpacity
        onPress={() => {
          setMenuOpen(false);
          router.push("/privacy" as any);
        }}
        style={{
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Text style={{ color: "#e2e8f0", fontWeight: "800", fontSize: 15 }}>
          Confidentialité
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setMenuOpen(false);
          router.push("/contact" as any);
        }}
        style={{
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Text style={{ color: "#e2e8f0", fontWeight: "800", fontSize: 15 }}>
          Nous contacter
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setMenuOpen(false);
          router.push("/about" as any);
        }}
        style={{
          paddingVertical: 14,
        }}
      >
        <Text style={{ color: "#e2e8f0", fontWeight: "800", fontSize: 15 }}>
          À propos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
  onPress={handleRestore}
  style={{
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  }}
>
  <Text style={{ color: "#38BDF8", fontWeight: "800", fontSize: 15 }}>
    Restaurer mes achats
  </Text>
</TouchableOpacity>

      <View
  style={{
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  }}
>
  <Text
    style={{
      color: "#94a3b8",
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 8,
      letterSpacing: 0.5,
    }}
  >
    Accès test premium
  </Text>

  <TextInput
    value={reviewCodeInput}
    onChangeText={setReviewCodeInput}
    placeholder="Entrer le code"
    placeholderTextColor="#64748b"
    autoCapitalize="characters"
    autoCorrect={false}
    style={{
      backgroundColor: "#111827",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.10)",
      color: "#fff",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 14,
    }}
  />

  <TouchableOpacity
    onPress={handleApplyReviewCode}
    style={{
      marginTop: 10,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: "#f3f7f5",
      alignItems: "center",
    }}
  >
    <Text style={{ color: "#0b1220", fontWeight: "900", fontSize: 14 }}>
      Activer l’accès premium
    </Text>
  </TouchableOpacity>

  {reviewAccessUnlocked && (
    <>
      <Text
        style={{
          color: "#22c55e",
          fontSize: 12,
          fontWeight: "800",
          marginTop: 10,
          textAlign: "center",
        }}
      >
        Premium de test actif sur cet appareil
      </Text>

      <TouchableOpacity
        onPress={handleRemoveReviewCode}
        style={{
          marginTop: 10,
          paddingVertical: 10,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#e2e8f0", fontWeight: "800", fontSize: 13 }}>
          Retirer l’accès test
        </Text>
      </TouchableOpacity>
    </>
  )}
</View>

      <TouchableOpacity
        onPress={() => setMenuOpen(false)}
        style={{
          marginTop: 16,
          alignItems: "center",
          paddingVertical: 8,
        }}
      >
        <Text style={{ color: "#94a3b8", fontWeight: "800" }}>Fermer</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    
<EffortModal
  visible={effortOpen}
  initial={effort}
  onClose={() => setEffortOpen(false)}
  onSave={async (next) => {
    const day = todayKey();
    await setEffort(day, next);
    setEffortState(next);
    setEffortOpen(false);
  }}
/>

    </SafeAreaView>
  );
}

function Pill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
        marginRight: 10,
        marginTop: 10,
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "800" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function MiniBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: active ? "#ffffff" : "#111827",
        marginRight: 8,
      }}
    >
      <Text style={{ color: active ? "#0b1220" : "#fff", fontWeight: "900", fontSize: 12 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
