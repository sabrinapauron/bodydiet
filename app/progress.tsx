import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { loadHistory, type DaySummary } from "../storage/bodyStore";

function fmtDayLabel(day: string) {
  // "YYYY-MM-DD" -> "04 Mar"
  const d = new Date(day + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function ProgressScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<DaySummary[]>([]);

  useEffect(() => {
    (async () => {
      const h = await loadHistory();
      setHistory(h);
    })();
  }, []);

  const last7 = useMemo(() => history.slice(0, 7).reverse(), [history]);
  const last30 = useMemo(() => history.slice(0, 30).reverse(), [history]);

  const maxCals7 = useMemo(() => Math.max(1, ...last7.map((d) => d.calories || 0)), [last7]);
  const maxProt7 = useMemo(() => Math.max(1, ...last7.map((d) => d.protein || 0)), [last7]);

  const maxCals30 = useMemo(() => Math.max(1, ...last30.map((d) => d.calories || 0)), [last30]);
  const maxProt30 = useMemo(() => Math.max(1, ...last30.map((d) => d.protein || 0)), [last30]);

  const BarRow = ({
    d,
    maxCals,
    maxProt,
  }: {
    d: DaySummary;
    maxCals: number;
    maxProt: number;
  }) => {
    const cW = Math.round(((d.calories || 0) / maxCals) * 100);
    const pW = Math.round(((d.protein || 0) / maxProt) * 100);

    return (
      <View style={{ marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: "#111827" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>{fmtDayLabel(d.day)}</Text>
          {d.perfect ? (
            <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "rgba(34,197,94,0.15)" }}>
              <Text style={{ color: "#22c55e", fontWeight: "900", fontSize: 12 }}>✅ validé</Text>
            </View>
          ) : (
            <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "rgba(148,163,184,0.12)" }}>
              <Text style={{ color: "#94a3b8", fontWeight: "900", fontSize: 12 }}>jour</Text>
            </View>
          )}
        </View>

        {/* Calories */}
        <Text style={{ color: "#cbd5e1", marginTop: 10, fontWeight: "800" }}>
          🔥 {d.calories || 0} kcal
        </Text>
        <View style={{ height: 10, borderRadius: 999, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)", marginTop: 6 }}>
          <View style={{ height: "100%", width: `${cW}%`, backgroundColor: "#60a5fa" }} />
        </View>

        {/* Protéines */}
        <Text style={{ color: "#cbd5e1", marginTop: 10, fontWeight: "800" }}>
          💪 {d.protein || 0} g protéines
        </Text>
        <View style={{ height: 10, borderRadius: 999, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)", marginTop: 6 }}>
          <View style={{ height: "100%", width: `${pW}%`, backgroundColor: "#22c55e" }} />
        </View>

        <Text style={{ color: "#94a3b8", marginTop: 10 }}>
          G {d.carbs || 0} • L {d.fat || 0}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 18, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Progression</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#111827" }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>← Retour</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: "#94a3b8", marginTop: 10 }}>
          7 jours (simple et lisible)
        </Text>

        {last7.length === 0 ? (
          <Text style={{ color: "#fff", opacity: 0.6, marginTop: 12 }}>
            Pas encore d’historique. Valide une journée et reviens ici.
          </Text>
        ) : (
          last7.map((d) => <BarRow key={d.day} d={d} maxCals={maxCals7} maxProt={maxProt7} />)
        )}

        <Text style={{ color: "#94a3b8", marginTop: 18 }}>
          Mois (30 jours)
        </Text>

        {last30.slice(-10).map((d) => (
          <BarRow key={"m-" + d.day} d={d} maxCals={maxCals30} maxProt={maxProt30} />
        ))}

        <Text style={{ color: "#94a3b8", marginTop: 12, fontSize: 12 }}>
          (Pour rester léger, j’affiche ici les 10 derniers jours du mois. On pourra faire une vraie “courbe” ensuite.)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}