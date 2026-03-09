import React, { useMemo, useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FOOD_DB, type FoodItem, type PriceMode } from "../../lib/foodDB";
import {
  loadState,
  loadEffort,
  loadBodyProfile,
  loadBodyScans,
  getBodyScanCommentary,
  type EffortEntry,
  type BodyScanCommentary,
} from "../../storage/bodyStore";
import { applyEffortToTargets } from "../../lib/effort";

type Goal = "gain" | "cut" | "maintain";

type MacroTarget = {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
};

type SuggestedMeal = {
  title: string;
  tag: string;
  items: FoodItem[];
  totals: {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
    price: number;
  };
  score: number;
  displayTitle: string;
};

type QuickNowItem = FoodItem & {
  price: number;
};

function getPrice(item: FoodItem, mode: PriceMode): number {
  if (mode === "eco") return item.priceEco;
  if (mode === "bio") return item.priceBio;
  return item.priceStandard;
}

function roundPrice(n: number): number {
  return Math.round(n * 100) / 100;
}

function sumMeal(
  items: FoodItem[],
  priceMode: PriceMode
): {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  price: number;
} {
  const totals = items.reduce(
    (acc, item) => {
      acc.protein += item.protein;
      acc.carbs += item.carbs;
      acc.fat += item.fat;
      acc.calories += item.calories;
      acc.price += getPrice(item, priceMode);
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0, calories: 0, price: 0 }
  );

  return {
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
    calories: Math.round(totals.calories),
    price: roundPrice(totals.price),
  };
}

function mealScore(
  totals: { protein: number; carbs: number; fat: number; calories: number },
  target: { protein: number; carbs: number; fat: number; calories: number },
  effort: EffortEntry | null
): number {
  const carbWeight =
    effort?.kind === "linear"
      ? effort.intensity === "intense"
        ? 1.5
        : effort.intensity === "moderate"
        ? 1.25
        : 1.1
      : effort?.kind === "gym"
      ? effort.intensity === "intense"
        ? 1.35
        : effort.intensity === "moderate"
        ? 1.15
        : 1
      : 1;

  const proteinWeight =
    effort?.kind === "gym"
      ? effort.intensity === "intense"
        ? 1.35
        : 1.2
      : 1.1;

  const fatWeight = 0.9;

  const pDiff = Math.abs(totals.protein - target.protein) * proteinWeight;
  const cDiff = Math.abs(totals.carbs - target.carbs) * carbWeight;
  const fDiff = Math.abs(totals.fat - target.fat) * fatWeight;

  return pDiff + cDiff + fDiff;
}

function pickBestByCategory(ids: string[]): FoodItem[] {
  return FOOD_DB.filter((item) => ids.includes(item.id));
}

function buildDynamicMealCandidates(
  priceMode: PriceMode
): Array<{
  title: string;
  tag: string;
  items: FoodItem[];
  totals: ReturnType<typeof sumMeal>;
}> {
  const proteins = FOOD_DB.filter((i) =>
    ["chicken", "eggs", "tuna", "skyr", "protein_yogurt"].includes(i.id)
  );
  const carbs = FOOD_DB.filter((i) =>
    ["rice", "whole_pasta", "potatoes", "sweet_potato", "oats", "banana"].includes(i.id)
  );
  const vegs = FOOD_DB.filter((i) =>
    ["spinach", "zucchini", "carrots", "parsnip"].includes(i.id)
  );
  const fats = FOOD_DB.filter((i) => ["olive_oil", "cream"].includes(i.id));

  const quicks = [
    pickBestByCategory(["protein_yogurt", "banana"]),
    pickBestByCategory(["protein_bar", "banana"]),
    pickBestByCategory(["skyr", "oats"]),
    pickBestByCategory(["protein_yogurt", "protein_bar"]),
  ];

  const meals: Array<{
    title: string;
    tag: string;
    items: FoodItem[];
    totals: ReturnType<typeof sumMeal>;
  }> = [];

  for (const p of proteins) {
    for (const c of carbs) {
      for (const v of vegs) {
        const fat = fats.find((f) => f.id === "olive_oil") || null;
        const items = fat ? [p, c, v, fat] : [p, c, v];

        meals.push({
          title: `${p.name} • ${c.name} • ${v.name}`,
          tag:
            p.id === "tuna"
              ? "Lean"
              : p.id === "eggs"
              ? "Simple"
              : p.id === "chicken"
              ? "Sport"
              : "Équilibré",
          items,
          totals: sumMeal(items, priceMode),
        });
      }
    }
  }

  for (const items of quicks) {
    meals.push({
      title: items.map((i) => i.name).join(" • "),
      tag: "Rapide",
      items,
      totals: sumMeal(items, priceMode),
    });
  }

  return meals;
}

function buildQuickNowSuggestions(
  remaining: MacroTarget,
  priceMode: PriceMode
): QuickNowItem[] {
  const quickItems = FOOD_DB.filter((item) =>
    [
      "protein_yogurt",
      "protein_bar",
      "skyr",
      "banana",
      "eggs",
      "tuna",
      "oats",
      "olive_oil",
    ].includes(item.id)
  );

  const biggest =
    remaining.protein >= remaining.carbs && remaining.protein >= remaining.fat
      ? "protein"
      : remaining.carbs >= remaining.fat
      ? "carbs"
      : "fat";

  const sorted = [...quickItems].sort((a, b) => {
    const scoreA =
      biggest === "protein"
        ? Math.abs(a.protein - Math.min(remaining.protein, 25))
        : biggest === "carbs"
        ? Math.abs(a.carbs - Math.min(remaining.carbs, 30))
        : Math.abs(a.fat - Math.min(remaining.fat, 10));

    const scoreB =
      biggest === "protein"
        ? Math.abs(b.protein - Math.min(remaining.protein, 25))
        : biggest === "carbs"
        ? Math.abs(b.carbs - Math.min(remaining.carbs, 30))
        : Math.abs(b.fat - Math.min(remaining.fat, 10));

    return scoreA - scoreB;
  });

  return sorted.slice(0, 3).map((item) => ({
    ...item,
    price: getPrice(item, priceMode),
  }));
}

export default function PremiumMealsScreen() {
  const router = useRouter();

  const [weightKg, setWeightKg] = useState(75);
  const [heightCm, setHeightCm] = useState(175);
  const [goal, setGoal] = useState<Goal>("gain");

  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [calories, setCalories] = useState(0);

  const [effort, setEffort] = useState<EffortEntry | null>(null);
  const [priceMode, setPriceMode] = useState<PriceMode>("standard");

  const [targets, setTargets] = useState<MacroTarget>({
    protein: 150,
    carbs: 250,
    fat: 70,
    calories: 2200,
  });

  const [lastBodyCommentary, setLastBodyCommentary] =
    useState<BodyScanCommentary | null>(null);
  const [lastBodyFocus, setLastBodyFocus] = useState<string | null>(null);

  const daySeed = Number(new Date().toISOString().slice(8, 10)) || 1;

  useEffect(() => {
    (async () => {
      const s = await loadState();
      const profile = await loadBodyProfile();
      const day = new Date().toISOString().slice(0, 10);
      const e = await loadEffort(day);
      const scans = await loadBodyScans();

      setEffort(e);

      if (profile?.heightCm) {
        setHeightCm(Number(profile.heightCm) || 175);
      }

      if (scans?.length) {
        const latest = scans[0];
        const commentary =
          (await getBodyScanCommentary("compare", latest.day, scans?.[1]?.day ?? null)) ||
          (await getBodyScanCommentary("single", latest.day, null));

        setLastBodyCommentary(commentary || null);
        setLastBodyFocus(commentary?.bodyFocus ?? null);
      }

      if (!s) return;

      const w = Number(s.weightKg) || 75;
      const g = (s.goal || "gain") as Goal;

      setWeightKg(w);
      setGoal(g);

      setProtein(Number(s.protein) || 0);
      setCarbs(Number(s.carbs) || 0);
      setFat(Number(s.fat) || 0);
      setCalories(Number(s.calories) || 0);

      if (g === "gain") {
        setTargets({
          protein: Math.round(w * 2),
          carbs: Math.round(w * 4),
          fat: Math.round(w * 1),
          calories: Math.round(w * 35),
        });
      } else if (g === "cut") {
        setTargets({
          protein: Math.round(w * 2.2),
          carbs: Math.round(w * 2.2),
          fat: Math.round(w * 0.9),
          calories: Math.round(w * 28),
        });
      } else {
        setTargets({
          protein: Math.round(w * 1.8),
          carbs: Math.round(w * 3),
          fat: Math.round(w * 1),
          calories: Math.round(w * 32),
        });
      }
    })();
  }, []);

  const adjustedTargets = useMemo(() => {
    return applyEffortToTargets(targets, effort);
  }, [targets, effort]);

  const remaining = useMemo(() => {
    return {
      protein: Math.max(0, adjustedTargets.protein - protein),
      carbs: Math.max(0, adjustedTargets.carbs - carbs),
      fat: Math.max(0, adjustedTargets.fat - fat),
      calories: Math.max(0, targets.calories - calories),
    };
  }, [adjustedTargets, targets, protein, carbs, fat, calories]);

  const quickNow = useMemo(() => {
    return buildQuickNowSuggestions(remaining, priceMode);
  }, [remaining, priceMode]);

  const fridge7Days = useMemo(() => {
    const ids = [
      "chicken",
      "eggs",
      "tuna",
      "skyr",
      "protein_yogurt",
      "protein_bar",
      "rice",
      "whole_pasta",
      "potatoes",
      "sweet_potato",
      "oats",
      "spinach",
      "zucchini",
      "carrots",
      "parsnip",
      "banana",
      "apple",
      "olive_oil",
      "cream",
      "brown_sugar",
    ];

    return FOOD_DB.filter((item) => ids.includes(item.id)).map((item) => ({
      ...item,
      weeklyQty:
        item.category === "protein"
          ? "3 à 5 portions"
          : item.category === "dairy" || item.category === "snack"
          ? "4 à 7 unités"
          : item.category === "carb"
          ? "3 à 6 portions"
          : item.category === "veg"
          ? "4 à 8 portions"
          : item.category === "fruit"
          ? "4 à 7 unités"
          : "1 à 2 unités",
    }));
  }, []);

  const totalFridgePrice = useMemo(() => {
    return fridge7Days.reduce((acc, item) => {
      return acc + getPrice(item, priceMode);
    }, 0);
  }, [fridge7Days, priceMode]);

  const suggestedMeals = useMemo<SuggestedMeal[]>(() => {
    const candidates = buildDynamicMealCandidates(priceMode);

    const built = candidates.map((meal) => ({
      ...meal,
      score: mealScore(
        meal.totals,
        {
          protein: remaining.protein,
          carbs: remaining.carbs,
          fat: remaining.fat,
          calories: remaining.calories,
        },
        effort
      ),
    }));

    const sorted = [...built].sort((a, b) => a.score - b.score);

    const rotated = [...sorted];
    if (rotated.length > 1) {
      const shift = daySeed % rotated.length;
      rotated.push(...rotated.splice(0, shift));
    }

    const topPool = rotated.slice(0, 8);

    const balanced = topPool[0] || sorted[0];

    const proteinFirst =
      [...topPool].sort((a, b) => {
        const aDiff =
          Math.abs(a.totals.protein - remaining.protein) +
          Math.abs(a.totals.carbs - Math.min(remaining.carbs, 35));
        const bDiff =
          Math.abs(b.totals.protein - remaining.protein) +
          Math.abs(b.totals.carbs - Math.min(remaining.carbs, 35));
        return aDiff - bDiff;
      })[0] || sorted[1];

    const fastOption = topPool.find((m) => m.tag === "Rapide") || sorted[2];

    const unique = [balanced, proteinFirst, fastOption].filter(
      (meal, index, arr) =>
        !!meal && arr.findIndex((x) => x.title === meal.title) === index
    );

    return unique.map((meal, index) => ({
      ...meal,
      displayTitle:
        index === 0
          ? "Repas conseillé pour finir ta journée"
          : index === 1
          ? "Option ciblée protéines"
          : "Option rapide",
    }));
  }, [
    priceMode,
    remaining.protein,
    remaining.carbs,
    remaining.fat,
    remaining.calories,
    effort,
    daySeed,
  ]);

  const titleByGoal =
    goal === "cut"
      ? "Organisation repas • Sèche"
      : goal === "maintain"
      ? "Organisation repas • Maintien"
      : "Organisation repas • Masse";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a1235" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 28, paddingBottom: 40 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            alignSelf: "flex-start",
            marginBottom: 14,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 999,
            backgroundColor: "#020617",
            borderWidth: 1,
            borderColor: "#1f2937",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>← Retour</Text>
        </TouchableOpacity>

        <View
          style={{
            padding: 16,
            borderRadius: 18,
            backgroundColor: "#020617",
            borderWidth: 1,
            borderColor: "#1f2937",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "900",
            }}
          >
            ✨ REPAS BODY DIET
          </Text>

          <Text style={{ color: "#94a3b8", marginTop: 8, lineHeight: 20 }}>
            {titleByGoal} selon ton profil, tes macros restantes et ton mode de budget.
          </Text>

          <Text style={{ color: "#cbd5e1", marginTop: 10 }}>
            Profil actuel : {weightKg} kg • {heightCm} cm
          </Text>
        </View>

        <Text
          style={{
            color: "#94a3b8",
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 1.4,
            marginTop: 22,
            marginBottom: 8,
          }}
        >
          MODE PRIX
        </Text>

        <View style={{ flexDirection: "row" }}>
          {[
            { key: "eco", label: "ÉCO" },
            { key: "standard", label: "STANDARD" },
            { key: "bio", label: "BIO" },
          ].map((item) => {
            const active = priceMode === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setPriceMode(item.key as PriceMode)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: active ? "#ffffff" : "#111827",
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    color: active ? "#0b1220" : "#fff",
                    fontWeight: "900",
                    fontSize: 12,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text
          style={{
            color: "#94a3b8",
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 1.4,
            marginTop: 22,
            marginBottom: 8,
          }}
        >
          RESTE À MANGER AUJOURD’HUI
        </Text>

        <View
          style={{
            padding: 16,
            borderRadius: 18,
            backgroundColor: "#020617",
            borderWidth: 1,
            borderColor: "#1f2937",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
            Ajustement journalier
          </Text>

          <Text style={{ color: "#cbd5e1", marginTop: 10 }}>
            Protéines : {remaining.protein} g
          </Text>
          <Text style={{ color: "#cbd5e1", marginTop: 4 }}>
            Glucides : {remaining.carbs} g
          </Text>
          <Text style={{ color: "#cbd5e1", marginTop: 4 }}>
            Lipides : {remaining.fat} g
          </Text>
          <Text style={{ color: "#cbd5e1", marginTop: 4 }}>
            Calories : {remaining.calories} kcal
          </Text>
        </View>

        <Text
          style={{
            color: "#94a3b8",
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 1.4,
            marginTop: 22,
            marginBottom: 8,
          }}
        >
          QUOI PRENDRE MAINTENANT
        </Text>

        <View
          style={{
            padding: 16,
            borderRadius: 18,
            backgroundColor: "#020617",
            borderWidth: 1,
            borderColor: "#1f2937",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
            Apports rapides possibles
          </Text>

          <Text style={{ color: "#94a3b8", marginTop: 6 }}>
            Suggestions simples selon ce qu’il te manque le plus.
          </Text>

          <View style={{ marginTop: 10 }}>
            {quickNow.map((item) => (
              <View
                key={item.id}
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(255,255,255,0.06)",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {item.name}
                </Text>
                <Text style={{ color: "#cbd5e1", marginTop: 4, fontSize: 12 }}>
                  {item.portionLabel} • P {item.protein} • G {item.carbs} • L {item.fat}
                </Text>
                <Text style={{ color: "#86efac", marginTop: 4, fontSize: 12 }}>
                  {item.price.toFixed(2)} €
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text
          style={{
            color: "#94a3b8",
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 1.4,
            marginTop: 22,
            marginBottom: 8,
          }}
        >
          IDÉES REPAS
        </Text>

        {suggestedMeals.map((meal) => (
          <View
            key={meal.title}
            style={{
              marginTop: 10,
              padding: 16,
              borderRadius: 18,
              backgroundColor: "#020617",
              borderWidth: 1,
              borderColor: "#1f2937",
            }}
          >
            <Text style={{ color: "#38BDF8", fontWeight: "900", fontSize: 13 }}>
              {meal.displayTitle}
            </Text>

            <Text
              style={{
                color: "#fff",
                fontWeight: "900",
                fontSize: 16,
                marginTop: 6,
              }}
            >
              {meal.title}
            </Text>

            <View
              style={{
                alignSelf: "flex-start",
                marginTop: 8,
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text style={{ color: "#cbd5e1", fontSize: 11, fontWeight: "800" }}>
                {meal.tag}
              </Text>
            </View>

            <View style={{ marginTop: 10 }}>
              {meal.items.map((item) => (
                <Text key={item.id} style={{ color: "#cbd5e1", marginTop: 4 }}>
                  • {item.name} ({item.portionLabel})
                </Text>
              ))}
            </View>

            <View
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: "#1f2937",
              }}
            >
              <Text style={{ color: "#fff" }}>
                P {meal.totals.protein} • G {meal.totals.carbs} • L {meal.totals.fat}
              </Text>
              <Text style={{ color: "#94a3b8", marginTop: 4 }}>
                {meal.totals.calories} kcal • {meal.totals.price.toFixed(2)} € / portion
              </Text>
            </View>
          </View>
        ))}

        <Text
          style={{
            color: "#94a3b8",
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 1.4,
            marginTop: 22,
            marginBottom: 8,
          }}
        >
          LIEN AVEC TON SCAN BODY
        </Text>

        <View
          style={{
            padding: 16,
            borderRadius: 18,
            backgroundColor: "#020617",
            borderWidth: 1,
            borderColor: "#1f2937",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
            Ajustement BodyDiet Premium
          </Text>

          <Text style={{ color: "#cbd5e1", marginTop: 10 }}>
            Focus détecté : {lastBodyFocus || "équilibré"}
          </Text>

          <Text style={{ color: "#94a3b8", marginTop: 6, lineHeight: 20 }}>
            {lastBodyCommentary?.summary ||
              "Le dernier scan body permet d’affiner la logique repas et les apports proposés."}
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/body-scan" as any)}
            style={{
              marginTop: 12,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: "#111827",
              borderWidth: 1,
              borderColor: "#36404e",
            }}
          >
            <Text style={{ textAlign: "center", color: "#fff", fontWeight: "900" }}>
              Voir mon scan body
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={{
            color: "#94a3b8",
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 1.4,
            marginTop: 22,
            marginBottom: 8,
          }}
        >
          ORGANISATION DU FRIGO • 7 JOURS
        </Text>

        <View
          style={{
            padding: 16,
            borderRadius: 18,
            backgroundColor: "#020617",
            borderWidth: 1,
            borderColor: "#1f2937",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
            Base frigo recommandée
          </Text>

          <Text style={{ color: "#94a3b8", marginTop: 6 }}>
            Budget estimé base 7 jours : {totalFridgePrice.toFixed(2)} €
          </Text>

          <View style={{ marginTop: 12 }}>
            {fridge7Days.map((item) => (
              <View
                key={item.id}
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(255,255,255,0.06)",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {item.name}
                </Text>

                <Text style={{ color: "#94a3b8", marginTop: 4, fontSize: 12 }}>
                  {item.portionLabel} • {item.weeklyQty}
                </Text>

                <Text style={{ color: "#cbd5e1", marginTop: 4, fontSize: 12 }}>
                  P {item.protein} • G {item.carbs} • L {item.fat} • {item.calories} kcal
                </Text>

                <Text style={{ color: "#86efac", marginTop: 4, fontSize: 12 }}>
                  Prix repère : {getPrice(item, priceMode).toFixed(2)} €
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}