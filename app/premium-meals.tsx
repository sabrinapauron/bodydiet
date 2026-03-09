import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FOOD_DB, type FoodItem, type PriceMode } from "../lib/foodDB";

type Goal = "gain" | "cut" | "maintain";

function getPrice(item: FoodItem, mode: PriceMode) {
  if (mode === "eco") return item.priceEco;
  if (mode === "bio") return item.priceBio;
  return item.priceStandard;
}

function roundPrice(n: number) {
  return Math.round(n * 100) / 100;
}

export default function PremiumMealsScreen() {
  const router = useRouter();

  // provisoire : plus tard on branchera ça à ton vrai state
  const [priceMode, setPriceMode] = useState<PriceMode>("standard");

  // provisoire : plus tard on récupérera ces données depuis ton écran principal / storage
  const weightKg = 75;
  const heightCm = 175;
  const goal: Goal = "gain";

  const remaining = {
    protein: 42,
    carbs: 58,
    fat: 14,
    calories: 520,
  };

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

  const suggestedMeals = useMemo(() => {
    const meal1Ids = ["chicken", "rice", "zucchini", "olive_oil"];
    const meal2Ids = ["eggs", "whole_pasta", "spinach", "cream"];
    const meal3Ids = ["tuna", "sweet_potato", "parsnip", "olive_oil"];
    const snackIds = ["protein_yogurt", "protein_bar", "banana"];

    const buildMeal = (title: string, ids: string[]) => {
      const items = FOOD_DB.filter((item) => ids.includes(item.id));

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
        title,
        items,
        totals: {
          protein: Math.round(totals.protein),
          carbs: Math.round(totals.carbs),
          fat: Math.round(totals.fat),
          calories: Math.round(totals.calories),
          price: roundPrice(totals.price),
        },
      };
    };

    return [
      buildMeal("Poulet • Riz • Courgettes", meal1Ids),
      buildMeal("Œufs • Pâtes complètes • Épinards", meal2Ids),
      buildMeal("Thon • Patate douce • Panais", meal3Ids),
      buildMeal("Apport rapide journée", snackIds),
    ];
  }, [priceMode]);

  const totalFridgePrice = useMemo(() => {
    return roundPrice(
      fridge7Days.reduce((acc, item) => acc + getPrice(item, priceMode), 0)
    );
  }, [fridge7Days, priceMode]);

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
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
              {meal.title}
            </Text>

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

        <View
          style={{
            marginTop: 22,
            padding: 16,
            borderRadius: 18,
            backgroundColor: "rgba(28,47,226,0.14)",
            borderWidth: 1,
            borderColor: "rgba(28,47,226,0.4)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={18}
              color="#93c5fd"
            />
            <Text
              style={{
                color: "#fff",
                fontWeight: "900",
                fontSize: 15,
                marginLeft: 8,
              }}
            >
              Étape suivante
            </Text>
          </View>

          <Text style={{ color: "#dbeafe", marginTop: 10, lineHeight: 20 }}>
            Ensuite on branchera cette page à ton vrai profil, à tes vraies macros restantes
            et à ton effort du jour pour que tout s’ajuste automatiquement.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}