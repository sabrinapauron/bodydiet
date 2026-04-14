import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { upsertBodyScan } from "../storage/bodyStore";

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function BodyScanCapture() {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [threeUri, setThreeUri] = useState<string | null>(null);
  const [sideUri, setSideUri] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 5 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const step = useMemo(() => {
    if (!frontUri) return "front";
    if (!threeUri) return "three";
    if (!sideUri) return "side";
    return "done";
  }, [frontUri, threeUri, sideUri]);

  const title =
    step === "front"
      ? "Photo FACE"
      : step === "three"
      ? "Photo 3/4"
      : step === "side"
      ? "Photo PROFIL"
      : "Terminé";

  const hint =
    step === "front"
      ? "Debout, même distance, même lumière."
      : step === "three"
      ? "Tourne légèrement (≈ 45°)."
      : step === "side"
      ? "Tourne de profil complet (90°)."
      : "Tu peux enregistrer.";

  const progressWidth =
    step === "front" ? "33%" : step === "three" ? "66%" : "100%";

  const save = async () => {
    if (!frontUri || !threeUri || !sideUri) return;

    await upsertBodyScan({
      id: String(Date.now()),
      day: todayKey(),
      frontUri,
      threeUri,
      sideUri,
      createdAt: Date.now(),
    });

    router.replace("/body-scan");
  };

  const takePhotoNow = async () => {
    if (!cameraRef.current || isCapturing || step === "done") return;

    try {
      setIsCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });

      const uri = photo?.uri;
      if (!uri) return;

      if (step === "front") {
        setFrontUri(uri);
      } else if (step === "three") {
        setThreeUri(uri);
      } else if (step === "side") {
        setSideUri(uri);
      }
    } catch (e) {
      Alert.alert("Photo", "Impossible de prendre la photo pour le moment.");
    } finally {
      setIsCapturing(false);
    }
  };

  const startCapture = async () => {
    if (countdown !== null || isCapturing || step === "done") return;

    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Caméra", "Autorise la caméra pour faire le scan body.");
        return;
      }
    }

    if (!timerSeconds) {
      await takePhotoNow();
      return;
    }

    setCountdown(timerSeconds);
    let current = timerSeconds;

    const interval = setInterval(() => {
      current -= 1;

      if (current > 0) {
        setCountdown(current);
        return;
      }

      clearInterval(interval);
      setCountdown(null);
      void takePhotoNow();
    }, 1000);
  };

  if (!permission) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#fff" }}>Chargement caméra...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900", textAlign: "center" }}>
          Autorisation caméra nécessaire
        </Text>
        <Text style={{ color: "#cbd5e1", marginTop: 10, textAlign: "center", lineHeight: 22 }}>
          BodyDiet a besoin de la caméra pour prendre les 3 photos du scan.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{
            marginTop: 20,
            backgroundColor: "#1C2FE2",
            paddingHorizontal: 18,
            paddingVertical: 14,
            borderRadius: 14,
          }}
        >
          <Text style={{ color: "#EAF1FF", fontWeight: "900" }}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 18, paddingBottom: 40 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "900",
              flex: 1,
              paddingRight: 12,
            }}
          >
            Scan Body • Capture
          </Text>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: "#111827",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>← Retour</Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            marginTop: 16,
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

          <Text
            style={{
              color: "#cbd5e1",
              fontSize: 12,
              marginTop: 6,
              lineHeight: 18,
            }}
          >
            Place le téléphone à hauteur stable, garde la même distance, et tiens-toi droit.
            Le retardateur prend la photo automatiquement.
          </Text>
        </View>

        <Text style={{ color: "#cbd5e1", marginTop: 18, fontSize: 15 }}>
          {title} — {hint}
        </Text>

        <View
          style={{
            marginTop: 12,
            height: 6,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: progressWidth,
              height: "100%",
              borderRadius: 999,
              backgroundColor: "#1C2FE2",
            }}
          />
        </View>

        {step !== "done" && (
          <View
            style={{
              marginTop: 18,
              height: 420,
              borderRadius: 20,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
              backgroundColor: "#111827",
            }}
          >
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing="front"
            />

            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 18,
                left: 18,
                right: 18,
                bottom: 18,
                borderRadius: 18,
                borderWidth: 2,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            />

            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: "50%",
                marginLeft: -1,
                top: 18,
                bottom: 18,
                width: 2,
                backgroundColor: "rgba(255,255,255,0.18)",
              }}
            />

            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: "50%",
                marginTop: -1,
                left: 18,
                right: 18,
                height: 2,
                backgroundColor: "rgba(255,255,255,0.18)",
              }}
            />

            {countdown !== null && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0,0,0,0.25)",
                }}
              >
                <View
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 999,
                    backgroundColor: "rgba(2,6,23,0.72)",
                    borderWidth: 2,
                    borderColor: "rgba(28,47,226,0.35)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#60A5FA", fontSize: 44, fontWeight: "900" }}>
                    {countdown}
                  </Text>
                </View>
              </View>
            )}

            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                bottom: 14,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: "rgba(2,6,23,0.60)",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800", textAlign: "center" }}>
                {step === "front"
                  ? "Centre-toi face caméra"
                  : step === "three"
                  ? "Tourne légèrement à 45°"
                  : "Passe en profil complet"}
              </Text>
            </View>
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
          {[frontUri, threeUri, sideUri].map((u, i) => {
            const isActive =
              (step === "front" && i === 0) ||
              (step === "three" && i === 1) ||
              (step === "side" && i === 2);

            return (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 120,
                  borderRadius: 14,
                  backgroundColor: "#111827",
                  overflow: "hidden",
                  borderWidth: 2,
                  borderColor: isActive ? "#1C2FE2" : "rgba(255,255,255,0.08)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {u ? (
                  <Image
                    source={{ uri: u }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{ color: "#94a3b8", fontWeight: "900" }}>
                    {i === 0 ? "FACE" : i === 1 ? "3/4" : "PROFIL"}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
          <TouchableOpacity
            onPress={startCapture}
            disabled={step === "done" || countdown !== null || isCapturing}
            style={{
              flex: 1,
              paddingVertical: 15,
              borderRadius: 16,
              backgroundColor:
                step === "done" || countdown !== null || isCapturing
                  ? "rgba(28,47,226,0.45)"
                  : "#1C2FE2",
              alignItems: "center",
              opacity: step === "done" ? 0.7 : 1,
            }}
          >
            <Text style={{ color: "#EAF1FF", fontWeight: "900", fontSize: 16 }}>
              📷 {step === "done" ? "Photos terminées" : "Prendre la photo"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert("Retardateur", "Choisis un délai", [
                { text: "Sans", onPress: () => setTimerSeconds(0) },
                { text: "3 sec", onPress: () => setTimerSeconds(3) },
                { text: "5 sec", onPress: () => setTimerSeconds(5) },
                { text: "10 sec", onPress: () => setTimerSeconds(10) },
                { text: "Annuler", style: "cancel" },
              ])
            }
            disabled={countdown !== null || isCapturing}
            style={{
              flex: 1,
              paddingVertical: 15,
              borderRadius: 16,
              backgroundColor: "#1f2937",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              opacity: countdown !== null || isCapturing ? 0.6 : 1,
            }}
          >
            <Text style={{ color: "#e5e7eb", fontWeight: "800", fontSize: 16 }}>
              ⏱ {timerSeconds ? `Retardateur ${timerSeconds}s` : "Retardateur"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={save}
          disabled={step !== "done"}
          style={{
            marginTop: 14,
            paddingVertical: 15,
            borderRadius: 14,
            backgroundColor:
              step === "done" ? "rgba(28,47,226,0.16)" : "rgba(148,163,184,0.10)",
            borderWidth: 1,
            borderColor:
              step === "done" ? "rgba(96,165,250,0.28)" : "rgba(255,255,255,0.08)",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: step === "done" ? "#60A5FA" : "#94a3b8",
              fontWeight: "900",
            }}
          >
             Enregistrer le scan 
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}