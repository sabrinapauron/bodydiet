import React, { useMemo, useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import {
  FOOD_DB,
  type FoodItem,
  type PriceMode,
  getPricePerPortion,
  getWeeklyCostRange,
  getWeeklyBudgetRange,
  euro,
} from "../../lib/foodDB";
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
      acc.protein += Number(item.protein ?? 0);
      acc.carbs += Number(item.carbs ?? 0);
      acc.fat += Number(item.fat ?? 0);
      acc.calories += Number(item.calories ?? 0);
      acc.price += Number(getPricePerPortion(item, priceMode) ?? 0);
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
    [
      "chicken",
      "eggs",
      "tuna",
      "white_fish",
      "salmon",
      "ham",
      "pork_loin",
      "ground_beef_5",
      "skyr",
      "protein_yogurt",
      "fromage_blanc",
      "cottage_cheese",
    ].includes(i.id)
  );

  const carbs = FOOD_DB.filter((i) =>
    [
      "rice",
      "whole_pasta",
      "potatoes",
      "sweet_potato",
      "oats",
      "lentils",
      "bread_whole",
      "wraps",
      "banana",
    ].includes(i.id)
  );

  const vegs = FOOD_DB.filter((i) =>
    [
      "spinach",
      "zucchini",
      "carrots",
      "parsnip",
      "broccoli",
      "green_beans",
      "tomatoes",
      "mushrooms",
      "peppers",
    ].includes(i.id)
  );

  const fats = FOOD_DB.filter((i) =>
    [
      "olive_oil",
      "rapeseed_oil",
      "cream",
      "butter",
      "avocado",
      "peanut_butter",
    ].includes(i.id)
  );

  const quicks = [
    pickBestByCategory(["protein_yogurt", "banana"]),
    pickBestByCategory(["protein_bar", "banana"]),
    pickBestByCategory(["skyr", "oats"]),
    pickBestByCategory(["protein_yogurt", "protein_bar"]),
    pickBestByCategory(["fromage_blanc", "banana"]),
    pickBestByCategory(["cottage_cheese", "apple"]),
    pickBestByCategory(["ham", "bread_whole"]),
    pickBestByCategory(["eggs", "bread_whole"]),
    pickBestByCategory(["skyr", "fruit_juice"]),
    pickBestByCategory(["fromage_blanc", "oats"]),
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
        let fat: FoodItem | null = null;

        if (["salmon", "ground_beef_5"].includes(p.id)) {
          fat = null;
        } else if (
          ["eggs", "ham", "pork_loin", "white_fish"].includes(p.id)
        ) {
          fat = fats.find((f) => ["olive_oil", "butter"].includes(f.id)) || null;
        } else if (
          ["fromage_blanc", "cottage_cheese", "skyr", "protein_yogurt"].includes(
            p.id
          )
        ) {
          fat = null;
        } else {
          fat = fats.find((f) => f.id === "olive_oil") || null;
        }

        const items = fat ? [p, c, v, fat] : [p, c, v];

        let tag = "Équilibré";

        if (
          ["tuna", "white_fish", "skyr", "fromage_blanc", "cottage_cheese"].includes(
            p.id
          )
        ) {
          tag = "Lean";
        } else if (["eggs", "ham"].includes(p.id)) {
          tag = "Simple";
        } else if (["chicken", "ground_beef_5"].includes(p.id)) {
          tag = "Sport";
        } else if (["salmon", "duck_breast", "lamb_leg_slice"].includes(p.id)) {
          tag = "Riche";
        } else if (["pork_loin"].includes(p.id)) {
          tag = "Classique";
        }

        meals.push({
          title: `${p.name} • ${c.name} • ${v.name}`,
          tag,
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
      "fromage_blanc",
      "cottage_cheese",
      "banana",
      "apple",
      "orange",
      "eggs",
      "tuna",
      "ham",
      "oats",
      "bread_whole",
      "wraps",
      "fruit_juice",
      "avocado",
      "peanut_butter",
      "nuts_mix",
      "dark_chocolate",
    ].includes(item.id)
  );

  const biggest =
    remaining.protein >= remaining.carbs && remaining.protein >= remaining.fat
      ? "protein"
      : remaining.carbs >= remaining.fat
      ? "carbs"
      : "fat";

  const sorted = [...quickItems].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (biggest === "protein") {
      scoreA =
        Math.abs(a.protein - Math.min(remaining.protein, 22)) +
        Math.abs(a.carbs - Math.min(remaining.carbs, 15)) * 0.2 +
        Math.abs(a.fat - Math.min(remaining.fat, 8)) * 0.2;

      scoreB =
        Math.abs(b.protein - Math.min(remaining.protein, 22)) +
        Math.abs(b.carbs - Math.min(remaining.carbs, 15)) * 0.2 +
        Math.abs(b.fat - Math.min(remaining.fat, 8)) * 0.2;
    } else if (biggest === "carbs") {
      scoreA =
        Math.abs(a.carbs - Math.min(remaining.carbs, 28)) +
        Math.abs(a.protein - Math.min(remaining.protein, 10)) * 0.2 +
        Math.abs(a.fat - Math.min(remaining.fat, 6)) * 0.15;

      scoreB =
        Math.abs(b.carbs - Math.min(remaining.carbs, 28)) +
        Math.abs(b.protein - Math.min(remaining.protein, 10)) * 0.2 +
        Math.abs(b.fat - Math.min(remaining.fat, 6)) * 0.15;
    } else {
      scoreA =
        Math.abs(a.fat - Math.min(remaining.fat, 12)) +
        Math.abs(a.protein - Math.min(remaining.protein, 8)) * 0.2 +
        Math.abs(a.carbs - Math.min(remaining.carbs, 10)) * 0.15;

      scoreB =
        Math.abs(b.fat - Math.min(remaining.fat, 12)) +
        Math.abs(b.protein - Math.min(remaining.protein, 8)) * 0.2 +
        Math.abs(b.carbs - Math.min(remaining.carbs, 10)) * 0.15;
    }

    const humanBonus = (item: FoodItem) => {
      if (
        [
          "protein_yogurt",
          "skyr",
          "fromage_blanc",
          "cottage_cheese",
          "banana",
          "apple",
          "orange",
          "protein_bar",
          "nuts_mix",
        ].includes(item.id)
      ) {
        return -1.2;
      }

      if (
        ["ham", "eggs", "tuna", "bread_whole", "wraps", "avocado"].includes(
          item.id
        )
      ) {
        return -0.6;
      }

      if (
        ["peanut_butter", "dark_chocolate", "fruit_juice", "oats"].includes(
          item.id
        )
      ) {
        return -0.3;
      }

      return 0;
    };

    return scoreA + humanBonus(a) - (scoreB + humanBonus(b));
  });

  return sorted.slice(0, 3).map((item) => ({
    ...item,
    price: getPricePerPortion(item, priceMode),
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
      try {
        const s = await loadState();
        const profile = await loadBodyProfile();
        const day = new Date().toISOString().slice(0, 10);
        const e = await loadEffort(day);
        const scans = await loadBodyScans();

        setEffort(e ?? null);

        if (profile?.heightCm) {
          setHeightCm(Number(profile.heightCm) || 175);
        }

        if (Array.isArray(scans) && scans.length > 0) {
          const latest = scans[0];

          try {
            const commentary =
              (await getBodyScanCommentary(
                "compare",
                latest.day,
                scans[1]?.day ?? null
              )) ||
              (await getBodyScanCommentary("single", latest.day, null));

            setLastBodyCommentary(commentary ?? null);
            setLastBodyFocus(commentary?.bodyFocus ?? null);
          } catch (err) {
            console.log("getBodyScanCommentary error", err);
            setLastBodyCommentary(null);
            setLastBodyFocus(null);
          }
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
      } catch (err) {
        console.log("PremiumMealsScreen init error", err);
      }
    })();
  }, []);

const adjustedTargets = useMemo(() => {
  try {
    return applyEffortToTargets(targets, effort);
  } catch (err) {
    console.log("applyEffortToTargets error", err);
    return targets;
  }
}, [targets, effort]);

const remaining: MacroTarget = useMemo(() => {
  return {
    protein: Math.max(0, adjustedTargets.protein - protein),
    carbs: Math.max(0, adjustedTargets.carbs - carbs),
    fat: Math.max(0, adjustedTargets.fat - fat),
    calories: Math.max(0, targets.calories - calories),
  };
}, [adjustedTargets, targets.calories, protein, carbs, fat, calories]);

  const quickNow = useMemo<QuickNowItem[]>(() => {
    try {
      return buildQuickNowSuggestions(remaining, priceMode);
    } catch (err) {
      console.log("buildQuickNowSuggestions error", err);
      return [];
    }
  }, [remaining, priceMode]);

  const fridge7Days = useMemo<FoodItem[]>(() => {
    const ids = [
      "chicken",
      "eggs",
      "tuna",
      "white_fish",
      "salmon",
      "ham",
      "pork_loin",
      "ground_beef_5",
      "skyr",
      "protein_yogurt",
      "fromage_blanc",
      "cottage_cheese",
      "protein_bar",

      "rice",
      "whole_pasta",
      "potatoes",
      "sweet_potato",
      "oats",
      "lentils",
      "bread_whole",
      "wraps",
      "fruit_juice",

      "spinach",
      "zucchini",
      "carrots",
      "parsnip",
      "broccoli",
      "green_beans",
      "tomatoes",
      "mushrooms",

      "banana",
      "apple",
      "orange",

      "olive_oil",
      "rapeseed_oil",
      "butter",
      "cream",
      "avocado",
      "peanut_butter",
      "nuts_mix",
      "dark_chocolate",
      "brown_sugar",
    ];

    return FOOD_DB.filter((item) => ids.includes(item.id));
  }, []);

  const weeklyBudget = useMemo(() => {
    try {
      return getWeeklyBudgetRange(fridge7Days, priceMode);
    } catch (err) {
      console.log("getWeeklyBudgetRange error", err);
      return { min: 0, max: 0 };
    }
  }, [fridge7Days, priceMode]);

  const suggestedMeals = useMemo<SuggestedMeal[]>(() => {
    try {
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
      ) as Array<(typeof built)[number]>;

      return unique.map((meal, index) => ({
        ...meal,
        displayTitle:
          index === 0
            ? "Repas conseillé pour finir ta journée"
            : index === 1
            ? "Option ciblée protéines"
            : "Option rapide",
      }));
    } catch (err) {
      console.log("suggestedMeals error", err);
      return [];
    }
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
            {titleByGoal} selon ton profil, tes macros restantes et ton mode de
            budget.
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
                <Text style={{ color: "#fff", fontWeight: "700" }}>{item.name}</Text>
                <Text style={{ color: "#cbd5e1", marginTop: 4, fontSize: 12 }}>
                  {item.portionLabel} • P {item.protein} • G {item.carbs} • L{" "}
                  {item.fat}
                </Text>
                <Text style={{ color: "#86efac", marginTop: 4, fontSize: 12 }}>
                  {euro(item.price)}
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
                {meal.totals.calories} kcal • {euro(meal.totals.price)} / portion
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

          <View
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 14,
              backgroundColor: "#111827",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>
              Budget estimé pour la semaine
            </Text>

            <Text
              style={{
                marginTop: 8,
                color: "#86efac",
                fontSize: 22,
                fontWeight: "900",
              }}
            >
              {weeklyBudget.min === weeklyBudget.max
                ? `≈ ${euro(weeklyBudget.min)}`
                : `${euro(weeklyBudget.min)} à ${euro(weeklyBudget.max)}`}
            </Text>

            <Text
              style={{
                marginTop: 6,
                color: "#94a3b8",
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              Calculé selon les portions prévues sur 7 jours, avec achat conseillé
              quand un format réel est disponible.
            </Text>
          </View>

          <View
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "rgba(34,197,94,0.08)",
              borderWidth: 1,
              borderColor: "rgba(34,197,94,0.22)",
            }}
          >
            <Text style={{ color: "#86efac", fontSize: 13, fontWeight: "900" }}>
              Panier optimisé pour limiter le gaspillage
            </Text>
            <Text
              style={{
                marginTop: 4,
                color: "#cbd5e1",
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              Chaque aliment affiche la portion, le nombre prévu sur la semaine, le
              prix par portion et le budget réel estimé.
            </Text>
          </View>

          <View style={{ marginTop: 12 }}>
            {fridge7Days.map((item) => {
              const [minPortions, maxPortions] = item.weeklyPortions ?? [1, 1];
              const pricePerPortion = getPricePerPortion(item, priceMode);
              const weeklyCost = getWeeklyCostRange(item, priceMode);

              const portionsLabel =
                minPortions === maxPortions
                  ? `${minPortions} portion${minPortions > 1 ? "s" : ""} dans la semaine`
                  : `${minPortions} à ${maxPortions} portions dans la semaine`;

              const budgetLabel =
                weeklyCost.min === weeklyCost.max
                  ? `Budget semaine : ${euro(weeklyCost.min)}`
                  : `Budget semaine : ${euro(weeklyCost.min)} à ${euro(weeklyCost.max)}`;

              return (
                <View
                  key={item.id}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
                    {item.name}
                  </Text>

                  <Text style={{ color: "#cbd5e1", marginTop: 6, fontSize: 13 }}>
                    {item.portionLabel} par portion
                  </Text>

                  <Text style={{ color: "#cbd5e1", marginTop: 4, fontSize: 13 }}>
                    {portionsLabel}
                  </Text>

                  <Text style={{ color: "#93c5fd", marginTop: 4, fontSize: 13 }}>
                    ≈ {euro(pricePerPortion)} par portion
                  </Text>

                  <Text style={{ color: "#cbd5e1", marginTop: 4, fontSize: 12 }}>
                    P {item.protein} • G {item.carbs} • L {item.fat} • {item.calories}{" "}
                    kcal
                  </Text>

                  <Text
                    style={{
                      color: "#86efac",
                      marginTop: 6,
                      fontSize: 13,
                      fontWeight: "800",
                    }}
                  >
                    {budgetLabel}
                  </Text>

                  {item.packLabel ? (
                    <View
                      style={{
                        marginTop: 8,
                        padding: 10,
                        borderRadius: 12,
                        backgroundColor: "rgba(34,197,94,0.08)",
                        borderWidth: 1,
                        borderColor: "rgba(34,197,94,0.22)",
                      }}
                    >
                      <Text
                        style={{ color: "#86efac", fontSize: 12, fontWeight: "900" }}
                      >
                        Achat conseillé
                      </Text>
                      <Text
                        style={{ color: "#e5e7eb", marginTop: 4, fontSize: 12 }}
                      >
                        {item.packLabel}
                      </Text>
                    </View>
                  ) : null}

                  {item.proteinBoost ? (
                    <Text
                      style={{
                        color: "#fbbf24",
                        marginTop: 8,
                        fontSize: 12,
                        fontWeight: "800",
                      }}
                    >
                      Ajout protéiné utile pour la semaine
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}