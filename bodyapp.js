// App.js (Expo / React Native)
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Alert, SafeAreaView, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

const API_URL = "https://TON-SERVER/analyze-meal"; // <- mets ton URL Render
const STORE_KEY = "FITSCAN_V1";

const todayKey = () => new Date().toISOString().slice(0, 10);

const round = (n) => Math.round((Number(n) || 0));

export default function App() {
  const [loaded, setLoaded] = useState(false);

  // Profil minimal (débutant)
  const [weightKg, setWeightKg] = useState("75");
  const [goal, setGoal] = useState("gain"); // "gain" | "cut" | "maintain"

  // Journée
  const [day, setDay] = useState(todayKey());
  const [protein, setProtein] = useState(0);
  const [calories, setCalories] = useState(0);
  const [log, setLog] = useState([]); // {t, foods, p, c}

  const [busy, setBusy] = useState(false);
const [manualOpen, setManualOpen] = useState(false);
const [manualP, setManualP] = useState("25");
const [manualC, setManualC] = useState("120");
  // Objectif protéines (simple, fitness débutant)
  const targetProtein = useMemo(() => {
    const w = Number(weightKg) || 0;
    if (!w) return 150;
    const factor = goal === "cut" ? 1.8 : goal === "maintain" ? 1.6 : 2.0; // simple & efficace
    return Math.round(w * factor);
  }, [weightKg, goal]);

  // Load / reset journée
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      if (raw) {
        try {
          const s = JSON.parse(raw);
          const tk = todayKey();
          if (s?.day !== tk) {
            // reset journalier
            await AsyncStorage.setItem(STORE_KEY, JSON.stringify({ ...s, day: tk, protein: 0, calories: 0, log: [] }));
            setDay(tk); setProtein(0); setCalories(0); setLog([]);
          } else {
            setDay(s.day || tk);
            setProtein(s.protein || 0);
            setCalories(s.calories || 0);
            setLog(Array.isArray(s.log) ? s.log : []);
            setWeightKg(String(s.weightKg ?? "75"));
            setGoal(s.goal || "gain");
          }
        } catch {}
      }
      setLoaded(true);
    })();
  }, []);

  const persist = async (next) => {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(next));
  };

  const addEntry = async ({ foods = [], p = 0, c = 0 }) => {
    const nextProtein = protein + p;
    const nextCalories = calories + c;
    const entry = { t: Date.now(), foods, p, c };
    const nextLog = [entry, ...log].slice(0, 50);

    setProtein(nextProtein);
    setCalories(nextCalories);
    setLog(nextLog);

    const nextState = { day, protein: nextProtein, calories: nextCalories, log: nextLog, weightKg, goal };
    await persist(nextState);
  };

  const resetDay = async () => {
    const tk = todayKey();
    setDay(tk);
    setProtein(0);
    setCalories(0);
    setLog([]);
    await persist({ day: tk, protein: 0, calories: 0, log: [], weightKg, goal });
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

      const data = await resp.json();
      if (!data?.ok) {
        Alert.alert("Scan", data?.error || "Analyse impossible");
        return;
      }

      // Brutaliste: on ajoute direct, sans écran “inutile”
      await addEntry({
        foods: data.foods || [],
        p: round(data.protein_g),
        c: round(data.calories_kcal),
      });
    } catch (e) {
      Alert.alert("Scan", "Erreur réseau.");
    } finally {
      setBusy(false);
    }
  };

  const quickSupp = async (label, p, c = 0) => {
    await addEntry({ foods: [label], p, c });
  };

  const remaining = Math.max(0, targetProtein - protein);
  const status = remaining === 0 ? "OBJECTIF ATTEINT" : remaining <= 25 ? "PRESQUE" : "EN COURS";

  if (!loaded) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header brutaliste */}
        <Text style={{ color: "#fff", fontSize: 14, opacity: 0.7 }}>AUJOURD’HUI • {day}</Text>

        <View style={{ marginTop: 10 }}>
          <Text style={{ color: "#fff", fontSize: 54, fontWeight: "800", letterSpacing: 1 }}>
            {protein}
            <Text style={{ fontSize: 18, opacity: 0.7 }}> / {targetProtein}g</Text>
          </Text>
          <Text style={{ color: "#fff", fontSize: 14, opacity: 0.7, marginTop: 2 }}>
            PROTÉINES • {status}
          </Text>

          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", marginTop: 10 }}>
            {remaining === 0 ? "✅ OK" : `Encore ${remaining}g`}
          </Text>

          <Text style={{ color: "#fff", fontSize: 14, opacity: 0.7, marginTop: 6 }}>
            Calories (approx) : {calories} kcal
          </Text>
        </View>

        {/* Bouton scan */}
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

        {/* Quick supplements */}
       <Text style={{ color: "#fff", marginTop: 22, fontSize: 12, opacity: 0.7 }}>
  AJOUT RAPIDE (COMPLÉMENTS)
</Text>

<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
  <Pill label="Shake protéiné" onPress={() => quickSupp("Shake protéiné (dose standard)", 25, 120)} />
  <Pill label="Shake x2" onPress={() => quickSupp("Shake protéiné (double)", 50, 240)} />
  <Pill label="Yaourt protéiné" onPress={() => quickSupp("Yaourt protéiné", 20, 140)} />
  <Pill label="Barre protéinée" onPress={() => quickSupp("Barre protéinée", 15, 200)} />
  <Pill label="Gainer" onPress={() => quickSupp("Gainer (portion)", 20, 300)} />

  {/* Ajout perso (ouvre un mini mode manuel) */}
  <Pill label="Ajout perso" onPress={() => setManualOpen(true)} />
</View>

        {/* Profil (mini, brutaliste) */}
        <Text style={{ color: "#fff", marginTop: 26, fontSize: 12, opacity: 0.7 }}>
          PROFIL
        </Text>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 12, opacity: 0.7 }}>Poids (kg)</Text>
            <TextInput
              value={weightKg}
              onChangeText={async (v) => {
                setWeightKg(v);
                await persist({ day, protein, calories, log, weightKg: v, goal });
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
            <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              <MiniBtn active={goal === "gain"} label="Masse" onPress={async () => { setGoal("gain"); await persist({ day, protein, calories, log, weightKg, goal: "gain" }); }} />
              <MiniBtn active={goal === "cut"} label="Sèche" onPress={async () => { setGoal("cut"); await persist({ day, protein, calories, log, weightKg, goal: "cut" }); }} />
              <MiniBtn active={goal === "maintain"} label="Maintien" onPress={async () => { setGoal("maintain"); await persist({ day, protein, calories, log, weightKg, goal: "maintain" }); }} />
            </View>
          </View>
        </View>

        {/* Logs */}
        <View style={{ marginTop: 26 }}>
          <Text style={{ color: "#fff", fontSize: 12, opacity: 0.7 }}>DERNIERS AJOUTS</Text>
          {log.length === 0 ? (
            <Text style={{ color: "#fff", opacity: 0.6, marginTop: 10 }}>Rien pour l’instant.</Text>
          ) : (
            log.slice(0, 8).map((e) => (
              <View key={String(e.t)} style={{ marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: "#111827" }}>
                <Text style={{ color: "#fff", fontWeight: "800" }}>
                  +{e.p}g
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
          <Text style={{ color: "#fff", opacity: 0.6, textAlign: "center" }}>Reset journée</Text>
        </TouchableOpacity>
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

    <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
      <View style={{ flex: 1 }}>
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

      <View style={{ flex: 1 }}>
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
    </View>

    <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
      <TouchableOpacity
        onPress={() => setManualOpen(false)}
        style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#111827" }}
      >
        <Text style={{ textAlign: "center", color: "#fff", fontWeight: "900" }}>FERMER</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={async () => {
          const p = Math.max(0, parseInt(manualP || "0", 10) || 0);
          const c = Math.max(0, parseInt(manualC || "0", 10) || 0);
          if (!p && !c) return;
          await addEntry({ foods: ["Ajout perso"], p, c });
          setManualOpen(false);
        }}
        style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#ffffff" }}
      >
        <Text style={{ textAlign: "center", color: "#0b1220", fontWeight: "900" }}>AJOUTER</Text>
      </TouchableOpacity>
    </View>
  </View>
)}
      </ScrollView>
    </SafeAreaView>
  );
}

function Pill({ label = "Whey", onPress }) {
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
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "800" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function MiniBtn({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: active ? "#ffffff" : "#111827",
      }}
    >
      <Text style={{ color: active ? "#0b1220" : "#fff", fontWeight: "900", fontSize: 12 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}