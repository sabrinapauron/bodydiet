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
        <View
  style={{
    marginBottom: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  }}
>
  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>
    Conseils pour un scan précis
  </Text>

  <Text style={{ color: "#cbd5e1", fontSize: 12, marginTop: 6, lineHeight: 18 }}>
    Demande à quelqu’un de te prendre en photo ou place ton téléphone sur un support stable en utilisant le retardateur.
    Opte pour une pose avec des sous vetements  ou des vêtements près du corps, tiens-toi droit.
  </Text>
</View>
        
        
        
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#111827" }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>← Retour</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ color: "#cbd5e1", marginTop: 10 }}>
        {title} — {hint}
      </Text>
      <Text style={{ color: "#22c55e", marginTop: 6, fontWeight: "800" }}>
  Place-toi dans le cadre pour prendre la photo
</Text>
<View
  style={{
    marginTop: 12,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  }}
>
  <View
    style={{
      width:
        step === "front" ? "33%" :
        step === "three" ? "66%" :
        step === "side" ? "100%" :
        "100%",
      height: "100%",
      borderRadius: 999,
      backgroundColor: "#22c55e",
    }}
  />
</View>
     <View style={{ marginTop: 14, position: "relative" }}>

  {/* repère position corps */}
  {step !== "done" && (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: -10,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 5,
      }}
    >

      {/* cadre hauteur corps */}
      <View
        style={{
          width: "60%",
          height: 180,
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.25)",
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 10,
        }}
      >

        {/* cercle tête */}
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 30,
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.35)",
          }}
        />

        {/* ligne pieds */}
        <View
          style={{
            width: "60%",
            height: 2,
            backgroundColor: "rgba(255,255,255,0.35)",
          }}
        />

      </View>

    </View>
  )}

  <View style={{ flexDirection: "row", gap: 10 }}></View>


 
        {[frontUri, threeUri, sideUri].map((u, i) => (
          <View
            key={i}
           style={{
  flex: 1,
  height: 140,
  borderRadius: 14,
  backgroundColor: "#111827",
  overflow: "hidden",
  borderWidth: 2,
  borderColor:
    (step === "front" && i === 0) ||
    (step === "three" && i === 1) ||
    (step === "side" && i === 2)
      ? "#22c55e"
      : "rgba(255,255,255,0.08)",
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
          📷 {step === "done" ? "OK - prise photos terminée " : "Prendre la photo"}
        </Text>
      </TouchableOpacity>

<View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
  
  <TouchableOpacity
    style={{
      flex: 1,
      padding: 14,
      borderRadius: 16,
      backgroundColor: "#22c55e",
      alignItems: "center",
    }}
  >
    <Text style={{ color: "#04130a", fontWeight: "900" }}>
      📷 Prendre une photo
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={{
      flex: 1,
      padding: 14,
      borderRadius: 16,
      backgroundColor: "#1f2937",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.1)",
      alignItems: "center",
    }}
  >
    <Text style={{ color: "#e5e7eb", fontWeight: "800" }}>
      ⏱ Retardateur
    </Text>
  </TouchableOpacity>

</View>

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