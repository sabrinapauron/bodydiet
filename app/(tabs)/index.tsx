import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { saveState, loadState, upsertDaySummary } from "../../storage/bodyStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Animated } from "react-native";
import EffortModal from "../../components/EffortModal";
import { loadEffort, setEffort, type EffortEntry } from "../../storage/bodyStore";
import { applyEffortToTargets, formatEffortLabel } from "../../lib/effort";
import { useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
const API_URL = "http://192.168.1.45:4000/analyze-meal"; // local PC (même Wi-Fi)


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

export default function HomeScreen() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

const [effortOpen, setEffortOpen] = useState(false);
const [effort, setEffortState] = useState<EffortEntry | null>(null);

  // Profil
  const [weightKg, setWeightKg] = useState("75");
  const [goal, setGoal] = useState<Goal>("gain");

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
  const [isPro, setIsPro] = useState(false);

  const [points, setPoints] = useState(0);
  const [savePhotos, setSavePhotos] = useState(true);
  const [lastGoalRewardDay, setLastGoalRewardDay] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView | null>(null);
  const jokerPulse = useRef(new Animated.Value(1)).current;

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
      savePhotos,
    };

    await saveState(payload);
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

  const proteinProgress = Math.min(1, protein / Math.max(1,adjustedTargets .protein));
  const carbProgress = Math.min(1, carbs / Math.max(1,adjustedTargets .carbs));
  const fatProgress = Math.min(1, fat / Math.max(1, adjustedTargets.fat));
const dayScore = Math.round(
  ((proteinProgress + carbProgress + fatProgress) / 3) * 100
);
  const perfectDay = proteinProgress >= 1 && carbProgress >= 1 && fatProgress >= 1;



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

  const coachFreeFoods =
    biggestGap === "P"
      ? "Idees: poulet, thon, oeufs, skyr, shake."
      : biggestGap === "G"
      ? "Idees: riz, avoine, pates, pommes de terre, banane."
      : "Idees: amandes, avocat, huile d olive, beurre de cacahuete.";

  const premiumTitle =
    goal === "cut"
      ? "Plan seche PERSONNALISE"
      : goal === "gain"
      ? "Plan masse PERSONNALISE"
      : "Plan maintien PERSONNALISE";

  const premiumPreviewLines = [
    "Tes macros CIBLE + ajustement PERSONNALISE",
    "Ton plan repas adapté et equivalences",
    "Ta Liste de courses + tes points convertibles multipliés par 2",
  ];

  // Auto-chargement
useFocusEffect(
  React.useCallback(() => {
    let alive = true;
    (async () => {
      const day = todayKey();
      const e = await loadEffort(day);
      if (alive) setEffortState(e);
    })();
    return () => {
      alive = false;
    };
  }, [])
);

  useEffect(() => {
    (async () => {
      try {
        const s = await loadState();
        const tk = todayKey();

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
        Animated.timing(jokerPulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
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
    const timeoutId = setTimeout(() => controller.abort(), 12000);

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
      Alert.alert("Scan", `Serveur indisponible (${resp.status}). Photo ajoutée à l’album.`);
      return;
    }

    const data = (await resp.json()) as any;
    if (!data?.ok) {
      await savePhotoOnly();
      Alert.alert("Scan", (data?.error || "Analyse impossible") + " — Photo ajoutée à l’album.");
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
    ? "⚡ Scanne ton 1er repas pour lancer Le suivi."
    : !perfectDay
    ? `⚡ Il te manque encore : ${biggestGap} (P ${remainingP} • G ${remainingG} • L ${remainingL}).`
    : "✅ Journée validée. Tu peux sécuriser ta série.";

  if (!loaded) return null;

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

return (
  <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0F1F" }}>
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={{ padding: 16, paddingTop: 38, paddingBottom: 40 }}
    >
      {/* HEADER JOUR */}
      <View
  style={{
    marginTop: 6,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#111827",

    shadowColor: "#000",
shadowOpacity: 0.25,
shadowRadius: 12,
shadowOffset: { width: 0, height: 6 },
elevation: 4,
  }}
>
      <Text style={{ color: "#fff", fontSize: 16, opacity: 0.7 }}>
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
      ? "Série repas équilibrés • Jour 1 à valider"
      : `Série repas équilibrés active : ${streak} jour${streak > 1 ? "s" : ""}`}{" "}
    (Objectif : {streakGoal} jours)
  </Text>

  {streak === 0 && (
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

  <Text style={{ color: "#fff", opacity: 0.5, fontSize: 12, marginTop: 8 }}>
    Cumule des points grace a ta regularite et convertis-les en bons.
  </Text>

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
        <View style={{ marginTop: 14 }}>
          <Text style={{ color: "#fff", fontSize: 54, fontWeight: "800", letterSpacing: 1 }}>
            {protein}
            <Text style={{ fontSize: 18, opacity: 0.7 }}> / {adjustedTargets.protein}g</Text>
          </Text>

          {/* JAUGE PROT */}
          <View
            style={{
              marginTop: 12,
              height: 12,
              backgroundColor: "#111827",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${proteinProgress * 100}%`,
                backgroundColor:
                  proteinProgress >= 1 ? "#16A34A" : proteinProgress > 0.6 ? "#EA580C" : "#1C2FE2",
              }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 6,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14, opacity: 0.75 }}>
              PROTÉINES • {status}
            </Text>

            <Text style={{ color: "#fff", fontWeight: "800" }}>
              {remainingP === 0 ? "✅ OK" : `Encore ${remainingP}g`}
            </Text>
          </View>

          <MacroBar
            label="Glucides"
            value={carbs}
            target={adjustedTargets.carbs}
            progress={carbProgress}
            color="#38BDF8"
          />

          <MacroBar
            label="Lipides"
            value={fat}
            target={adjustedTargets.fat}
            progress={fatProgress}
            color="#5dea0c"
          />

          <Text
            style={{
              color: "#fff",
              fontSize: 15,
              fontWeight: "700",
              textAlign: "center",
              marginTop: 14,
              opacity: 0.85,
            }}
          >
            🔥 {calories} kcal aujourd’hui
          </Text>

          
{adjustedTargets.appliedKcal > 0 && (
  <Text style={{ color: "#94a3b8", marginTop: 6 }}>
    Macros ajustées : +{adjustedTargets.bonusCarbG}G / +{adjustedTargets.bonusFatG}L
  </Text>
)}

        </View>

{/* EFFORTS PHYSIQUES */}
<View
  style={{
    marginTop: 12,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(248, 243, 243, 0.97)",
  }}
>
  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
    <View style={{ flex: 1, paddingRight: 10 }}>
      <Text style={{ color: "#fff", fontWeight: "900" }}>Effort du jour</Text>
      <Text style={{ color: "#94a3b8", marginTop: 2 }} numberOfLines={1}>
        {formatEffortLabel(effort)}
      </Text>
    </View>

    <TouchableOpacity
      onPress={() => setEffortOpen(true)}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.10)",
        borderWidth: 1,
        borderColor: "rgba(207, 203, 203, 0.72)",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "900" }}>{effort ? "Modifier" : "Ajouter"}</Text>
    </TouchableOpacity>
  </View>
</View>

{/* SCAN */}
<View
  style={{
    marginTop: 18,

    // halo lumineux
    shadowColor: "#38bdf8",
    shadowOpacity: busy ? 0 : 1,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 0 },
    elevation: busy ? 0 : 50,
  }}
>
  <TouchableOpacity
    onPress={scanMeal}
    disabled={busy}
    activeOpacity={0.9}
    style={{
      paddingVertical: 18,
      borderRadius: 14,
      backgroundColor: busy ? "#1f2937" : "#ffffff",
      alignItems: "center",
    }}
  >
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
  </TouchableOpacity>
</View>
   
       
<View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
  <Text style={{ color: "#fff", opacity: 0.7, fontSize: 12 }}>
    Album repas : {savePhotos ? "ON" : "OFF"}
  </Text>

  <TouchableOpacity
    onPress={async () => {
      const next = !savePhotos;
      setSavePhotos(next);
      await persist({ savePhotos: next });
    }}
    style={{
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: "#111827",
      borderWidth: 1,
      borderColor: savePhotos ? "#1c2fe2" : "#334155",
    }}
  >
    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>
      {savePhotos ? " ON" : " OFF"}
    </Text>
  </TouchableOpacity>
</View>

        <TouchableOpacity
  onPress={() => router.push("/album-meals")}
  style={{
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#111827",
  }}
>
  <Text style={{ textAlign: "center", color: "#fff", fontWeight: "900" }}>
    📚 ALBUM REPAS
  </Text>
</TouchableOpacity>

<TouchableOpacity
  onPress={() => router.push("/body-scan")}
  style={{
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
  }}
>
  <Text style={{ color: "#fff", fontWeight: "900" }}>📷 Scan Body (3D)</Text>
</TouchableOpacity>

        {/* AJOUT RAPIDE */}
        <Text style={{ color: "#fff", marginTop: 22, fontSize: 12, opacity: 0.7 }}>
          AJOUT RAPIDE (COMPLÉMENTS)
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
          <Pill label="Shake protéiné" onPress={() => quickSupp("Shake protéiné", 25, 3, 2, 130)} />
          <Pill label="Shake x2" onPress={() => quickSupp("Shake protéiné x2", 50, 6, 4, 260)} />
          <Pill label="Yaourt protéiné" onPress={() => quickSupp("Yaourt protéiné", 20, 12, 2, 150)} />
          <Pill label="Barre protéinée" onPress={() => quickSupp("Barre protéinée", 15, 20, 7, 200)} />
          <Pill label="Gainer" onPress={() => quickSupp("Gainer (portion)", 20, 60, 5, 350)} />
          <Pill
            label="Ajout perso"
            onPress={() => {
              setManualOpen(true);
              setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
              }, 120);
            }}
          />
        </View>

<TouchableOpacity
  onPress={() => router.push("/progress")}
  style={{
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
  }}
>
  <Text style={{ textAlign: "center", color: "#fff", fontWeight: "900" }}>
    📈 PROGRESSION (7 jours)
  </Text>
</TouchableOpacity>

        {/* PROFIL */}
        <Text style={{ color: "#fff", marginTop: 26, fontSize: 12, opacity: 0.7 }}>
          PROFIL
        </Text>

        <View style={{ marginTop: 14 }}>
  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Effort du jour</Text>

  <TouchableOpacity
    onPress={() => setEffortOpen(true)}
    style={{
      marginTop: 10,
      padding: 12,
      borderRadius: 14,
      backgroundColor: "#111827",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.10)",
    }}
  >
    <Text style={{ color: "#94a3b8" }}>{formatEffortLabel(effort)}</Text>
  </TouchableOpacity>
</View>

        <View style={{ flexDirection: "row", marginTop: 10 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ color: "#fff", fontSize: 12, opacity: 0.7 }}>Ton Poids (kg)</Text>
            <TextInput
              value={weightKg}
              onChangeText={async (v) => {
                setWeightKg(v);
                await persist({ weightKg: v });
              }}
              keyboardType="numeric"
              style={{
                marginTop: 6,
                padding: 12,
                borderRadius: 12,
                backgroundColor: "#111827",
                color: "#fff",
                fontSize: 16,
                fontWeight: "700",
              }}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 12, opacity: 0.7 }}>Objectif</Text>
            <View style={{ flexDirection: "row", marginTop: 6 }}>
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
            backgroundColor: "#0f172a",
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

          <Text style={{ color: "#fff", marginTop: 10 }}>
            {coachFreeFoods}
          </Text>

          <View
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: "#1f2937",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>{premiumTitle}</Text>

          {isPro ? (
  <>
    <Text style={{ color: "#fff", fontWeight: "900" }}>{premiumTitle}</Text>

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
      <Text style={{ color: "#38BDF8", fontWeight: "900" }}>Body Scan évolution</Text>

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
      <Text key={l} style={{ color: "#fff", opacity: 0.35, marginTop: 6 }}>
        {l}
      </Text>
    ))}

    <Text style={{ color: "#38BDF8", fontWeight: "800", marginTop: 12 }}>
      Le coach complet analyse ta progression et ajuste tes macros automatiquement.
    </Text>

    <TouchableOpacity
      onPress={() => Alert.alert("Premium", "Bientôt : achat via RevenueCat")}
      style={{
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#ffffff",
      }}
    >
      <Text style={{ textAlign: "center", color: "#0b1220", fontWeight: "900" }}>
        🔒  Body Diet Premium
      </Text>
    </TouchableOpacity>

    <Text style={{ color: "#fff", opacity: 0.55, marginTop: 8, fontSize: 12 }}>
      Active Premium pour analyser ta progression et améliorer tes résultats.
    </Text>
  </>
)}



          </View>
        </View>

        {/* LOG */}
        <View style={{ marginTop: 26 }}>
          <Text style={{ color: "#fff", fontSize: 12, opacity: 0.7 }}>DERNIERS AJOUTS</Text>

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
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>
                  +{e.p}P • +{e.carb}G • +{e.f}L
                  <Text style={{ opacity: 0.7, fontWeight: "600" }}> • {e.c} kcal</Text>
                </Text>
                <Text style={{ color: "#fff", opacity: 0.65, marginTop: 4 }}>
                  {(e.foods || []).join(" • ") || "Repas"}
                </Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity onPress={resetDay} style={{ marginTop: 18, paddingVertical: 14 }}>
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
