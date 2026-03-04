import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Body3DViewer from "../components/Body3DView";
import { loadBodyScans, type BodyScan } from "../storage/bodyStore";
export default function BodyScanScreen() {
  const router = useRouter();
const [scan, setScan] = useState<BodyScan | null>(null);

useEffect(() => {
  (async () => {
    const scans = await loadBodyScans();
    setScan(scans[0] || null);
  })();
}, []);

  // ⚠️ pour tester : mets 3 URLs ou 3 images déjà dans ton stockage.
  // Ensuite on branchera la capture photo + stockage.
  const frontUri =
    "https://picsum.photos/seed/front/800/1200";
  const threeUri =
    "https://picsum.photos/seed/three/800/1200";
  const sideUri =
    "https://picsum.photos/seed/side/800/1200";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 18, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Scan Body</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#111827" }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>← Retour</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: "#94a3b8", marginTop: 10 }}>
          Glisse à gauche/droite pour “tourner” (effet 3D premium).
        </Text>

        {!scan ? (
  <View style={{ marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: "#111827" }}>
    <Text style={{ color: "#fff", fontWeight: "900" }}>Aucun scan body</Text>

    <Text style={{ color: "#94a3b8", marginTop: 6 }}>
      Fais ton premier scan : Face / 3/4 / Profil.
    </Text>

    <TouchableOpacity
      onPress={() => router.push("/body-scan-capture")}
      style={{
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: "#0b1220",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "900" }}>📷 Démarrer le scan</Text>
    </TouchableOpacity>
  </View>
) : (
  <View style={{ marginTop: 14 }}>
    <Body3DViewer
      frontUri={scan.frontUri}
      threeQuarterUri={scan.threeUri}
      sideUri={scan.sideUri}
    />

    <TouchableOpacity
      onPress={() => router.push("/body-scan-capture")}
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
      <Text style={{ color: "#fff", fontWeight: "900" }}>🔁 Refaire le scan du jour</Text>
    </TouchableOpacity>
  </View>
)}

        <Text style={{ color: "#94a3b8", marginTop: 12, fontSize: 12, opacity: 0.9 }}>
          Prochaine étape : on remplace les 3 URLs par tes vraies photos (Face / 3-4 / Profil) prises dans l’app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}