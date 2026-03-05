import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { upsertBodyScan } from "../storage/bodyStore";

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function BodyScanCapture() {
  const router = useRouter();
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [threeUri, setThreeUri] = useState<string | null>(null);
  const [sideUri, setSideUri] = useState<string | null>(null);

  const step = useMemo(() => {
    if (!frontUri) return "front";
    if (!threeUri) return "three";
    if (!sideUri) return "side";
    return "done";
  }, [frontUri, threeUri, sideUri]);

  const pick = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Autorisation caméra", "Autorise la caméra pour faire le scan body.");
      return;
    }

    const r = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      allowsEditing: false,
    });

    if (r.canceled) return;
    const uri = r.assets?.[0]?.uri;
    if (!uri) return;

    if (step === "front") setFrontUri(uri);
    else if (step === "three") setThreeUri(uri);
    else if (step === "side") setSideUri(uri);
  };

  const save = async () => {
    if (!frontUri || !threeUri || !sideUri) return;

    await upsertBodyScan({
      day: todayKey(),
      frontUri,
      threeUri,
      sideUri,
      createdAt: Date.now(),
    });

    router.replace("/body-scan"); // retourne au viewer
  };

  const title =
    step === "front" ? "Photo FACE" :
    step === "three" ? "Photo 3/4" :
    step === "side" ? "Photo PROFIL" :
    "Terminé";

  const hint =
    step === "front" ? "Debout, même distance, même lumière." :
    step === "three" ? "Tourne légèrement (≈ 45°)." :
    step === "side" ? "Tourne de profil complet (90°)." :
    "Tu peux enregistrer.";

  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220", padding: 16, paddingTop: 18 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Scan Body • Capture</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#111827" }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>← Retour</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ color: "#94a3b8", marginTop: 10 }}>{title} — {hint}</Text>

      <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
        {[frontUri, threeUri, sideUri].map((u, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 140,
              borderRadius: 14,
              backgroundColor: "#111827",
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {u ? (
              <Image source={{ uri: u }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <Text style={{ color: "#94a3b8", fontWeight: "900" }}>
                {i === 0 ? "FACE" : i === 1 ? "3/4" : "PROFIL"}
              </Text>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={pick}
        style={{
          marginTop: 16,
          paddingVertical: 14,
          borderRadius: 14,
          backgroundColor: "#111827",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.10)",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>
          📷 {step === "done" ? "Reprendre une photo (remplace la dernière)" : "Prendre la photo"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={save}
        disabled={step !== "done"}
        style={{
          marginTop: 12,
          paddingVertical: 14,
          borderRadius: 14,
          backgroundColor: step === "done" ? "rgba(34,197,94,0.18)" : "rgba(148,163,184,0.10)",
          borderWidth: 1,
          borderColor: step === "done" ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.08)",
          alignItems: "center",
        }}
      >
        <Text style={{ color: step === "done" ? "#22c55e" : "#94a3b8", fontWeight: "900" }}>
          ✅ Enregistrer le scan du jour
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}