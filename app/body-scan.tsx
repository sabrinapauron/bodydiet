import React from "react";
import { SafeAreaView, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Body3DViewer from "../components/Body3DView";

export default function BodyScanScreen() {
  const router = useRouter();

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

        <View style={{ marginTop: 14 }}>
          <Body3DViewer frontUri={frontUri} threeQuarterUri={threeUri} sideUri={sideUri} />
        </View>

        <Text style={{ color: "#94a3b8", marginTop: 12, fontSize: 12, opacity: 0.9 }}>
          Prochaine étape : on remplace les 3 URLs par tes vraies photos (Face / 3-4 / Profil) prises dans l’app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}