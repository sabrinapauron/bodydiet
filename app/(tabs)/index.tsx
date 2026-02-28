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
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const API_URL = "http://192.168.1.45:4000/analyze-meal"; // local PC (même Wi-Fi)
const STORE_KEY = "FITSCAN_V1";

type Goal = "gain" | "cut" | "maintain";

type LogEntry = {
  t: number;
  foods: string[];
  p: number; // protein
  carb: number; // carbs
  f: number; // fat
  c: number; // calories
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

  points: number;
  lastGoalRewardDay: string | null;
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const roundInt = (n: unknown) => Math.round(Number(n) || 0);

export default function HomeScreen() {
  const [loaded, setLoaded] = useState(false);

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
  const [lastGoalRewardDay, setLastGoalRewardDay] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView | null>(null);

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
    };

    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(payload));
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

  const remainingP = Math.max(0, targets.protein - protein);
  const remainingG = Math.max(0, targets.carbs - carbs);
  const remainingL = Math.max(0, targets.fat - fat);

  const proteinProgress = Math.min(1, protein / Math.max(1, targets.protein));
  const carbProgress = Math.min(1, carbs / Math.max(1, targets.carbs));
  const fatProgress = Math.min(1, fat / Math.max(1, targets.fat));

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
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        const tk = todayKey();

        if (!raw) {
          setDay(tk);
          setLoaded(true);
          return;
        }

        const s = JSON.parse(raw) as Partial<StoredState>;

        setStreak(Number(s.streak) || 0);
        setLastPerfectDay(typeof s.lastPerfectDay === "string" ? s.lastPerfectDay : null);
        setLastGoalRewardDay(typeof s.lastGoalRewardDay === "string" ? s.lastGoalRewardDay : null);
        setGraceUsed(Boolean(s.graceUsed));
        setPoints(Number(s.points) || 0);

        // reset journalier
        if (s.day !== tk) {
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

            points: Number(s.points) || 0,
            lastGoalRewardDay: typeof s.lastGoalRewardDay === "string" ? s.lastGoalRewardDay : null,
          };

          await AsyncStorage.setItem(STORE_KEY, JSON.stringify(next));

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
  }: Partial<LogEntry> & { foods?: string[] }) => {
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

      const base64 = shot.assets?.[0]?.base64;
      if (!base64) {
        Alert.alert("Scan", "Image non exploitable.");
        return;
      }

      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = (await resp.json()) as any;
      if (!data?.ok) {
        Alert.alert("Scan", data?.error || "Analyse impossible");
        return;
      }

      await addEntry({
        foods: Array.isArray(data.foods) ? data.foods : [],
        p: Math.max(0, roundInt(data.protein_g)),
        carb: Math.max(0, roundInt(data.carbs_g)),
        f: Math.max(0, roundInt(data.fat_g)),
        c: Math.max(0, roundInt(data.calories_kcal)),
      });
    } catch {
      Alert.alert("Scan", "Erreur réseau.");
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, paddingTop: 38, paddingBottom: 40 }}
      >
        {/* HEADER JOUR */}
        <View style={{ marginTop: 6 }}>
          <Text style={{ color: "#fff", fontSize: 16, opacity: 0.7 }}>
            AUJOURD’HUI • {day}
          </Text>

          {streak > 0 && (
            <View style={{ marginTop: 4 }}>
              <Text style={{ color: "#f59e0b", fontWeight: "700" }}>
                🏆 Série active : {streak} jour{streak > 1 ? "s" : ""} (Objectif : {streakGoal} jours)
              </Text>

              {daysToGoal > 0 && (
                <Text style={{ color: "#fff", opacity: 0.6, fontSize: 12 }}>
                  Encore {daysToGoal} jour{daysToGoal > 1 ? "s" : ""} pour valider l’objectif.
                </Text>
              )}

              {isLastDayBeforeGoal && (
                <Text style={{ color: "#22c55e", fontSize: 12, marginTop: 2 }}>
                  Dernier jour avant validation. Nouveau round !
                </Text>
              )}

              <Text style={{ color: "#22c55e", marginTop: 6, fontWeight: "700" }}>
                🎯 Points BODY : {points}
              </Text>

              <Text style={{ color: "#60a5fa", marginTop: 4, fontSize: 12 }}>
                Prochaine recompense : {nextReward} pts
              </Text>

              <Text style={{ color: "#fff", opacity: 0.5, fontSize: 12, marginTop: 2 }}>
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
          )}

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
              <Text style={{ color: "#22c55e", fontWeight: "900" }}>
                🎉 Objectif valide !
              </Text>

              <Text style={{ color: "#bbf7d0", opacity: 0.9, marginTop: 4, fontSize: 12 }}>
                Bonus BODY debloque. Nouveau round jusqu’a {streakGoal} jours.
              </Text>
            </View>
          )}

          {/* animation si echec */}
          {!perfectDay && (
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
                Demain, tu reussiras. Nouveau round !
              </Text>

              <Text style={{ color: "#fff", opacity: 0.65, marginTop: 4, fontSize: 12 }}>
                Un seul objectif: avancer ! Une journée à la fois.
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

        {/* MACROS */}
        <View style={{ marginTop: 14 }}>
          <Text style={{ color: "#fff", fontSize: 54, fontWeight: "800", letterSpacing: 1 }}>
            {protein}
            <Text style={{ fontSize: 18, opacity: 0.7 }}> / {targets.protein}g</Text>
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
                  proteinProgress >= 1 ? "#22c55e" : proteinProgress > 0.6 ? "#f59e0b" : "#ef4444",
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
            target={targets.carbs}
            progress={carbProgress}
            color="#60a5fa"
          />

          <MacroBar
            label="Lipides"
            value={fat}
            target={targets.fat}
            progress={fatProgress}
            color="#f59e0b"
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

          <Text style={{ color: "#fff", opacity: 0.6, marginTop: 6 }}>
            Reste : P {remainingP} • G {remainingG} • L {remainingL}
          </Text>
        </View>

        {/* SCAN */}
        <TouchableOpacity
          onPress={scanMeal}
          disabled={busy}
          style={{
            marginTop: 18,
            paddingVertical: 18,
            borderRadius: 14,
            backgroundColor: busy ? "#1f2937" : "#ffffff",
          }}
        >
          <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "800", color: "#0b1220" }}>
            {busy ? "ANALYSE…" : "📷 SCAN REPAS"}
          </Text>
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

        {/* PROFIL */}
        <Text style={{ color: "#fff", marginTop: 26, fontSize: 12, opacity: 0.7 }}>
          PROFIL
        </Text>

        <View style={{ flexDirection: "row", marginTop: 10 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ color: "#fff", fontSize: 12, opacity: 0.7 }}>Poids (kg)</Text>
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
          <Text style={{ color: "#fff", fontWeight: "900" }}>COACH BODY</Text>

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
                <Text style={{ color: "#fff", opacity: 0.85, marginTop: 8 }}>
                  • Objectif du jour + répartition sur tes repas
                </Text>
                <Text style={{ color: "#fff", opacity: 0.85, marginTop: 6 }}>
                  • Exemple concret (petit-déj / déj / dîner)
                </Text>
                <Text style={{ color: "#fff", opacity: 0.85, marginTop: 6 }}>
                  • Ajustement si tu es en dessous/au-dessus
                </Text>
              </>
            ) : (
              <>
                {premiumPreviewLines.map((l) => (
                  <Text key={l} style={{ color: "#fff", opacity: 0.35, marginTop: 6 }}>
                    {l}
                  </Text>
                ))}

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
                    🔓 Débloquer Premium
                  </Text>
                </TouchableOpacity>

                <Text style={{ color: "#fff", opacity: 0.55, marginTop: 8, fontSize: 12 }}>
                  Aperçu uniquement. Le coaching complet est en Premium.
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
