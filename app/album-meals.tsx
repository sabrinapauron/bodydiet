import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { loadLog, LogEntry, clearMealPhotos, removeMealPhoto, renameMeal } from "../storage/bodyStore";

export default function AlbumMeals() {
  const router = useRouter();
  const [meals, setMeals] = useState<LogEntry[]>([]);

  useEffect(() => {
    (async () => {
      const log = await loadLog();
      setMeals(log.filter((m) => m.photo));
    })();
  }, []);

  const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

const fmtTime = (t: number) =>
  new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const deriveTitle = (e: LogEntry) => {
  if (e?.title) return e.title;

  if (Array.isArray(e?.foods) && e.foods.length && !String(e.foods[0]).includes("Photo repas")) {
    return String(e.foods[0]);
  }

  // fallback “jamais ridicule”
  const p = Number(e?.p) || 0;
  const g = Number(e?.carb) || 0;
  const l = Number(e?.f) || 0;
  const c = Number(e?.c) || 0;

  if (c > 0 && c <= 220) return "Collation";
  if (p >= 25 && g <= 20) return "Assiette protéinée";
  if (g >= 45) return "Repas énergie";
  if (l >= 18) return "Repas riche";
  return c > 0 ? "Repas maison" : "Photo repas";
};
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>
          ALBUM REPAS
        </Text>
<TouchableOpacity
  onPress={async () => {
    await clearMealPhotos();
    const log = await loadLog();
    setMeals(log.filter((m) => m.photo));
  }}
  style={{ marginTop: 10, alignSelf: "flex-start" }}
>
  <Text style={{ color: "#ef4444", fontWeight: "900" }}>🗑️ Vider l’album</Text>
</TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#60a5fa", marginTop: 6 }}>Retour</Text>
        </TouchableOpacity>
      </View>

     <FlatList
  data={meals}
  keyExtractor={(item) => String(item.t)}
  numColumns={2}
  columnWrapperStyle={{ gap: 12 }}
  contentContainerStyle={{ padding: 16, gap: 12 }}
  renderItem={({ item }) => (
    <View
      style={{
        flex: 1,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#111827",
      }}
    >
      <View
        style={{
          position: "relative",
          borderRadius: 14,
          overflow: "hidden",
          borderWidth: 2,
          borderColor: "rgba(191,167,106,0.35)",
          backgroundColor: "#0b1220",
        }}
      >
        {item.photo ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${item.photo}` }}
            style={{ width: "100%", height: 120 }}
          />
        ) : null}

        <View
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 999,
            backgroundColor: "rgba(2,6,23,0.65)",
            borderWidth: 1,
            borderColor: "rgba(191,167,106,0.35)",
          }}
        >
          <Text style={{ color: "#e5e7eb", fontWeight: "900", fontSize: 10, letterSpacing: 0.6 }}>
            BODY DIET
          </Text>
        </View>
      </View>

      <View style={{ padding: 10 }}>
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }} numberOfLines={1}>
          {deriveTitle(item)}
        </Text>
        <Text style={{ color: "#fff", opacity: 0.7, marginTop: 2, fontSize: 11 }}>
          {fmtDate(item.t)} • {fmtTime(item.t)}
        </Text>
        <Text style={{ color: "#fff", opacity: 0.9, marginTop: 4, fontSize: 11 }}>
          {item.p}P • {item.carb}G • {item.f}L • {item.c} kcal
        </Text>
      </View>
    </View>
  )}
/>
    </SafeAreaView>
  );
}