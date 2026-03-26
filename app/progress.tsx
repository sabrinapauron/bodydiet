import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { loadHistory, type DaySummary } from "../storage/bodyStore";


// Plafonds fixes (option A) : évite que la barre soit "pleine" juste parce que c'est le max du moment
const CALS_CAP = 3200; // ajuste si tu veux (ex: 2800 / 3500)
const PROT_CAP = 220;  // ajuste si tu veux (ex: 180 / 250)

// % safe + clamp 0..100 (anti NaN / anti >100)
const pct = (value: any, max: any) => {
  const v = Number(value);
  const m = Number(max);
  if (!Number.isFinite(v) || !Number.isFinite(m) || m <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((v / m) * 100)));
};

function Sparkline({
  values,
  height = 54,
  stroke = "rgba(255,255,255,0.55)",
  strokeWidth = 3,
}: {
  values: number[];
  height?: number;
  stroke?: string;
  strokeWidth?: number;
}) {
  const width = Math.min(360, Dimensions.get("window").width - 32 - 24); // carte: padding + marges
  const n = values.length;

  if (n < 2) {
    return (
      <View style={{ height, justifyContent: "center" }}>
        <Text style={{ color: "#94a3b8", fontSize: 12 }}>Pas assez de données</Text>
      </View>
    );
  }

  const clean = values.map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0));

const smooth = clean.map((v, i) => {
  const prev = clean[i - 1] ?? v;
  const next = clean[i + 1] ?? v;
  return (prev + v + next) / 3;
});
  const minV = Math.min(...clean);
  const maxV = Math.max(...clean);
  const span = Math.max(1, maxV - minV);

  const padX = 2;
  const padY = 6;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const pts = smooth.map((v, i) => {
    const x = padX + (i / (n - 1)) * innerW;
    const y = padY + (1 - (v - minV) / span) * innerH;
    return { x, y };
  });

  return (
    <View style={{ height, width }}>
      <View style={{ position: "absolute", inset: 0, borderRadius: 12 }} />
      {pts.slice(0, -1).map((p, i) => {
        const q = pts[i + 1];
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: len,
              height: strokeWidth,
              backgroundColor: stroke,
              borderRadius: 999,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: "0% 50%" as any, // RN tolère, sinon retire cette ligne
            }}
          />
        );
      })}
      {/* petit point sur le dernier jour */}
      <View
        style={{
          position: "absolute",
          left: pts[pts.length - 1].x - 3,
          top: pts[pts.length - 1].y - 3,
          width: 6,
          height: 6,
          borderRadius: 999,
          backgroundColor: stroke,
        }}
      />
    </View>
  );
}

function fmtDayLabel(day: string) {
  // "YYYY-MM-DD" -> "04 Mar"
  const d = new Date(day + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function ProgressScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<DaySummary[]>([]);
  const [range, setRange] = useState<"month" | "year">("month");
  useEffect(() => {
    (async () => {
      const h = await loadHistory();
      setHistory(h);
    })();
  }, []);

  const last7 = useMemo(() => history.slice(0, 7).reverse(), [history]);
  const last30 = useMemo(() => history.slice(0, 30).reverse(), [history]);
  const last365 = useMemo(() => history.slice(0, 365).reverse(), [history]);
const series = range === "month" ? last30 : last365;

const calSeries = useMemo(() => series.map((d) => Number(d.calories || 0)), [series]);
const protSeries = useMemo(() => series.map((d) => Number(d.protein || 0)), [series]);
  

  const BarRow = ({
    d,
    maxCals,
    maxProt,
  }: {
    d: DaySummary;
    maxCals: number;
    maxProt: number;
  }) => {
   const cW = pct(d.calories, maxCals);
const pW = pct(d.protein, maxProt);

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
          <View style={{ height: "100%", width: `${cW}%`, backgroundColor: "#38BDF8" }} />
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
          last7.map((d) => <BarRow key={d.day} d={d} maxCals={CALS_CAP} maxProt={PROT_CAP} />)
        )}

        <View style={{ marginTop: 18, padding: 12, borderRadius: 14, backgroundColor: "#111827" }}>
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
    <Text style={{ color: "#fff", fontWeight: "900" }}>
      Tendances • {range === "month" ? "30 jours" : "1 an"}
    </Text>

    <View style={{ flexDirection: "row", gap: 8 }}>
      <TouchableOpacity
        onPress={() => setRange("month")}
        style={{
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: range === "month" ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
          borderWidth: 1,
          borderColor: range === "month" ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12, opacity: range === "month" ? 1 : 0.7 }}>
          Mois
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setRange("year")}
        style={{
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: range === "year" ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
          borderWidth: 1,
          borderColor: range === "year" ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12, opacity: range === "year" ? 1 : 0.7 }}>
          Année
        </Text>
      </TouchableOpacity>
    </View>
  </View>

  <Text style={{ color: "#94a3b8", marginTop: 10, fontWeight: "800" }}>🔥 Calories</Text>
  <Sparkline values={calSeries} stroke="rgba(56,189,248,0.9)" />

  <Text style={{ color: "#94a3b8", marginTop: 10, fontWeight: "800" }}>💪 Protéines</Text>
  <Sparkline values={protSeries} stroke="rgba(34,197,94,0.9)" />

  <Text style={{ color: "#94a3b8", marginTop: 8, fontSize: 12, opacity: 0.8 }}>
    Lecture rapide de la tendance (compact et lisible).
  </Text>
</View>
        <Text style={{ color: "#94a3b8", marginTop: 12, fontSize: 12 }}>
         
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}