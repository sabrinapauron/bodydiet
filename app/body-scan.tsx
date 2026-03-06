import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Body3DViewer from "../components/Body3DView";
import {
  loadBodyScans,
  type BodyScan,
  type BodyScanCommentary,
  getBodyScanCommentary,
  saveBodyScanCommentary,
  loadBodyProfile,
  saveCoachWeeklyMission,
  saveCoachWeeklyChallenge,
} from "../storage/bodyStore";
import * as FileSystem from "expo-file-system/legacy";
/* ------------------------------
   BEFORE / AFTER SWIPE (anti écran vide)
------------------------------ */

type BeforeAfterProps = {
  beforeUri: string;
  afterUri: string;
  height?: number;
};

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

function BeforeAfterSwipe({ beforeUri, afterUri, height = 420 }: BeforeAfterProps) {
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);

  const safeBefore = typeof beforeUri === "string" ? beforeUri : "";
  const safeAfter = typeof afterUri === "string" ? afterUri : "";

  // ✅ Anti écran vide
  if (!safeBefore || !safeAfter) {
    return (
      <View
    
        style={{
          height,
          borderRadius: 16,
          backgroundColor: "#111827",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.10)",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>Comparaison indisponible</Text>
        <Text style={{ color: "#94a3b8", marginTop: 6, textAlign: "center" }}>
          Photo manquante (avant ou après) pour cet angle.
        </Text>
      </View>
    );
  }

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startX.current = (x as any).__getValue?.() ?? 0;
        },
        onPanResponderMove: (_, g) => {
          if (!w) return;
          const next = clamp(startX.current + g.dx, 0, w);
          x.setValue(next);
        },
        onPanResponderRelease: () => {},
      }),
    [w, x]
  );

  const clipW = w ? x : 0;
  const handleLeft = w ? x : 0;

  return (

    <View
  
      onLayout={(e) => {
        const width = e.nativeEvent.layout.width;
        setW(width);
        x.setValue(width / 2); // centre au départ
      }}
      style={{
        height,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
      }}
      {...pan.panHandlers}
    >
   <View
  pointerEvents="none"
  style={{
    position: "absolute",
    top: 8,
    alignSelf: "center",
    backgroundColor: "rgba(2,6,23,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    zIndex: 5,
  }}
>
  <Text
    style={{
      color: "rgba(255,255,255,0.82)",
      fontSize: 12,
      fontWeight: "700",
    }}
  >
    Comparaison visuelle de la posture et de la silhouette
  </Text>
</View>
      {/* BEFORE */}
      <Image
        source={{ uri: safeBefore }}
        resizeMode="contain"
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />

      {/* AFTER (clip) */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: clipW,
          overflow: "hidden",
        }}
      >
        <Image source={{ uri: safeAfter }} resizeMode="contain" style={{ width: "100%", height: "100%" }} />
      </Animated.View>
      
{/* Repères visuels */}
<View
  pointerEvents="none"
  style={{
    position: "absolute",
    top: height * 0.32,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  }}
/>

<View
  pointerEvents="none"
  style={{
    position: "absolute",
    top: height * 0.55,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  }}
/>

<Text
  pointerEvents="none"
  style={{
    position: "absolute",
    top: height * 0.32 - 12,
    left: 8,
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "700",
  }}
>
  épaules
</Text>

<Text
  pointerEvents="none"
  style={{
    position: "absolute",
    top: height * 0.55 - 12,
    left: 8,
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "700",
  }}
>
  taille
</Text>
<View
  pointerEvents="none"
  style={{
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  }}
/>

      {/* handle */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: handleLeft,
          width: 2,
          backgroundColor: "rgba(255,255,255,0.35)",
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          top: "50%",
          marginTop: -18,
          left: handleLeft,
          marginLeft: -18,
          width: 36,
          height: 36,
          borderRadius: 999,
          backgroundColor: "rgba(2,6,23,0.65)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>↔</Text>
      </Animated.View>

      {/* labels */}
      <View style={{ position: "absolute", left: 10, bottom: 10 }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontWeight: "900" }}>Avant</Text>
      </View>
      <View style={{ position: "absolute", right: 10, bottom: 10 }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontWeight: "900" }}>Aujourd’hui</Text>
      </View>
    </View>
  );
}

/* ------------------------------
   SCREEN
------------------------------ */

type AngleKey = "front" | "three" | "side";
const ANGLES: AngleKey[] = ["front", "three", "side"];
const toBase64 = async (uri: string) => {
  if (!uri) return "";

  return await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });
};

  
export default function BodyScanScreen() {
  const router = useRouter();

  const [scans, setScans] = useState<BodyScan[]>([]);
  const [angle, setAngle] = useState<AngleKey>("front");
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareId, setCompareId] = useState<string | null>(null);

  // ✅ V1 : on laisse vrai (pas d'erreur). Plus tard tu branches RevenueCat ici.
  const isPremium = true;

  const [heightCm, setHeightCm] = useState<number | null>(null);

  // ✅ Mets EXACTEMENT ton URL si différente
  const SERVER_URL = "http://192.168.1.45:4000";

  const [aiLoading, setAiLoading] = useState(false);
  const [aiComment, setAiComment] = useState<BodyScanCommentary | null>(null);

  const swipe = useMemo(() => {
    let startIndex = 0;

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dy) < 24,
      onPanResponderGrant: () => {
        startIndex = ANGLES.indexOf(angle);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 35) {
          const next = Math.max(0, startIndex - 1);
          setAngle(ANGLES[next]);
        } else if (g.dx < -35) {
          const next = Math.min(ANGLES.length - 1, startIndex + 1);
          setAngle(ANGLES[next]);
        }
      },
    });
  }, [angle]);

  useEffect(() => {
    (async () => {
      const list = await loadBodyScans();
      setScans(list);

      const profile = await loadBodyProfile();
      setHeightCm(profile?.heightCm ?? null);
    })();
  }, []);

  const after = scans[0] || null;

  const getUri = (scan: BodyScan | null, a: AngleKey) => {
    if (!scan) return "";
    if (a === "front") return scan.frontUri ?? "";
    if (a === "three") return scan.threeUri ?? "";
    return scan.sideUri ?? "";
  };

  const before = useMemo(() => {
    if (!after) return null;

    if (compareId) {
      const found = scans.find((s) => s.day === compareId);
      return found && found.day !== after.day ? found : null;
    }

    const prev = scans[1] || null;
    return prev && prev.day !== after.day ? prev : null;
  }, [scans, after, compareId]);

  const runCoach = async () => {
    if (!after) return;

    if (!heightCm) {
      Alert.alert("Profil", "Renseigne ta taille pour activer l’analyse coach.");
      return;
    }

    if (!isPremium) {
      Alert.alert("Premium", "Analyse Coach disponible en Premium.");
      return;
    }

    const mode: "single" | "compare" = before ? "compare" : "single";
const cached = await getBodyScanCommentary(mode, after.day, before?.day ?? null);
if (cached) {
  await saveCoachWeeklyMission(cached.missionToday ?? cached.focus7?.[0] ?? null);
  await saveCoachWeeklyChallenge(cached.missionToday ?? cached.focus7?.[0] ?? null);
  setAiComment(cached);
  return;
}
   
   setAiLoading(true);
try {
  console.log("CoachVision start", {
    mode,
    afterDay: after.day,
    beforeDay: before?.day ?? null,
  });

  const frontB64 = await toBase64(after.frontUri ?? "");
  const threeB64 = await toBase64(after.threeUri ?? "");
  const sideB64 = await toBase64(after.sideUri ?? "");

  if (!frontB64 || !threeB64 || !sideB64) {
    Alert.alert("Scan incomplet", "Il faut les 3 photos (Face / 3-4 / Profil) pour l’analyse.");
    setAiLoading(false);
    return;
  }

  const r = await fetch(`${SERVER_URL}/body-scan-commentary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      heightCm,
      mode,
      afterDay: after.day,
      beforeDay: before?.day ?? null,
      images: {
        front: frontB64,
        three: threeB64,
        side: sideB64,
        mime: "image/jpeg",
      },
    }),
  });

  const rawText = await r.text();
  let json: any = null;

  try {
    json = JSON.parse(rawText);
  } catch {}

  if (!r.ok) {
    throw new Error(`HTTP ${r.status} — ${rawText.slice(0, 300)}`);
  }

  if (!json?.ok || !json?.data) {
    throw new Error(json?.error || "Réponse serveur invalide");
  }

  const data = json.data;
  const normalized = {
    ...data,
    wins: data.wins ?? [],
    work: data.work ?? [],
    focus7: data.focus7 ?? [],
    closing: data.closing ?? "",
    mainLever: data.mainLever ?? "",
    missionToday: data.missionToday ?? "",
    intentScore: typeof data.intentScore === "number" ? data.intentScore : 75,
  } as BodyScanCommentary;

  await saveBodyScanCommentary(mode, after.day, before?.day ?? null, normalized);
  await saveCoachWeeklyMission(normalized.missionToday ?? normalized.focus7?.[0] ?? null);
 await saveCoachWeeklyChallenge(normalized.missionToday ?? normalized.focus7?.[0] ?? null);
  setAiComment(normalized);
} catch (e: any) {
  const msg = e?.message ? String(e.message) : String(e);
  Alert.alert("Erreur", msg.slice(0, 900));
} finally {
  setAiLoading(false);
}
  };



  const beforeUri = before ? getUri(before, angle) : "";
  const afterUri = after ? getUri(after, angle) : "";
  const canCompare = !!before && !!beforeUri && !!afterUri;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 18, paddingBottom: 40 }}>
        {/* HEADER */}
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
          Choisis l’angle. Si tu as 2 scans, tu peux comparer avec le swipe.
        </Text>

        {!after ? (
          <View style={{ marginTop: 14, padding: 16, borderRadius: 16, backgroundColor: "#111827" }}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>Aucun scan</Text>
            <Text style={{ color: "#94a3b8", marginTop: 6 }}>Fais ton premier scan (Face / 3-4 / Profil).</Text>

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
              <Text style={{ color: "#fff", fontWeight: "900" }}>📷 Nouveau scan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginTop: 14 }}>
            {/* Viewer + swipe angles */}
            <View {...swipe.panHandlers}>
              {canCompare ? (
                <BeforeAfterSwipe beforeUri={beforeUri} afterUri={afterUri} />
              ) : (
                <Body3DViewer
                  frontUri={after.frontUri}
                  threeQuarterUri={after.threeUri}
                  sideUri={after.sideUri}
                  angle={angle}
                />
              )}
            </View>

            {/* Premium Coach */}
            <View style={{ marginTop: 14 }}>
              <TouchableOpacity
                onPress={runCoach}
                disabled={aiLoading}
                style={{
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  {aiLoading ? "Analyse en cours..." : "🧠 Analyse Coach (Premium)"}
                </Text>
              </TouchableOpacity>

              {aiComment && (
                <View
                  style={{
                    marginTop: 12,
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: "rgba(0,0,0,0.25)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.10)",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>{aiComment.title}</Text>
                  <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 6 }}>{aiComment.summary}</Text>

                  {/* Levier principal */}
                  {aiComment.mainLever ? (
                    <View
                      style={{
                        marginTop: 10,
                        padding: 10,
                        borderRadius: 12,
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.08)",
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "800" }}>🎯 Le levier n°1</Text>
                      <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 4 }}>{aiComment.mainLever}</Text>
                    </View>
                  ) : null}

                  {/* Mission du jour */}
                  {aiComment.missionToday ? (
                    <View
                      style={{
                        marginTop: 10,
                        padding: 10,
                        borderRadius: 12,
                        backgroundColor: "rgba(34,197,94,0.10)",
                        borderWidth: 1,
                        borderColor: "rgba(34,197,94,0.25)",
                      }}
                    >
                      <Text style={{ color: "#22c55e", fontWeight: "900" }}>✅ Mission du jour</Text>
                      <Text style={{ color: "rgba(255,255,255,0.85)", marginTop: 4 }}>{aiComment.missionToday}</Text>

                      {typeof aiComment.intentScore === "number" ? (
                        <Text style={{ color: "#94a3b8", marginTop: 6, fontSize: 12 }}>
                          Clarté du plan :{" "}
                          <Text style={{ color: "#fff", fontWeight: "900" }}>{Math.round(aiComment.intentScore)}/100</Text>
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  <Text style={{ color: "#fff", marginTop: 10, fontWeight: "800" }}>✅ Points forts</Text>
                  {aiComment.wins?.map((t, i) => (
                    <Text key={i} style={{ color: "rgba(255,255,255,0.8)" }}>
                      • {t}
                    </Text>
                  ))}

                  <Text style={{ color: "#fff", marginTop: 10, fontWeight: "800" }}>🎯 À travailler</Text>
                  {aiComment.work?.map((t, i) => (
                    <Text key={i} style={{ color: "rgba(255,255,255,0.8)" }}>
                      • {t}
                    </Text>
                  ))}

                  <Text style={{ color: "#fff", marginTop: 10, fontWeight: "800" }}>🔥 Focus 7 jours</Text>
                  {(aiComment as any).focus7?.map((t: any, i: number) => (
                    <Text key={i} style={{ color: "rgba(255,255,255,0.8)" }}>
                      • {typeof t === "string" ? t : t?.label ?? ""}
                    </Text>
                  ))}

                  <Text style={{ color: "rgba(255,255,255,0.9)", marginTop: 10, fontWeight: "800" }}>
                    {aiComment.closing}
                  </Text>
                </View>
              )}
            </View>

            {/* Compare selector */}
            <TouchableOpacity
              onPress={() => setCompareOpen(true)}
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
              <Text style={{ color: "#fff", fontWeight: "900" }}>🔁 Comparer avec…</Text>
              <Text style={{ color: "#94a3b8", marginTop: 4, fontSize: 12 }}>
                {before ? `Avant : ${before.day}` : "Choisir un scan précédent"}
              </Text>
            </TouchableOpacity>

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
              <Text style={{ color: "#fff", fontWeight: "900" }}>📷 Nouveau scan</Text>
            </TouchableOpacity>

            {!before && (
              <Text style={{ color: "#94a3b8", marginTop: 8, fontSize: 12 }}>
                Fais un 2ᵉ scan (un autre jour) pour activer le swipe Avant/Aujourd’hui.
              </Text>
            )}
          </View>
        )}

        {/* MODAL compare */}
        <Modal visible={compareOpen} transparent animationType="fade" onRequestClose={() => setCompareOpen(false)}>
          <Pressable
            onPress={() => setCompareOpen(false)}
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", padding: 16, justifyContent: "center" }}
          >
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: "#111827",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
                padding: 14,
                maxHeight: "80%",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Comparer avec…</Text>
              <Text style={{ color: "#94a3b8", marginTop: 6, fontSize: 12 }}>
                Choisis un scan “avant” (l’actuel reste le plus récent).
              </Text>

              <View style={{ marginTop: 12 }}>
                {scans
                  .filter((s) => !after || s.day !== after.day)
                  .map((s) => {
                    const selected = compareId === s.day;
                    return (
                      <TouchableOpacity
                        key={s.day}
                        onPress={() => {
                          setCompareId(s.day);
                          setCompareOpen(false);
                        }}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 14,
                          backgroundColor: selected ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
                          borderWidth: 1,
                          borderColor: selected ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
                          marginBottom: 10,
                        }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "900" }}>{s.day}</Text>
                        <Text style={{ color: "#94a3b8", marginTop: 2, fontSize: 12 }}>
                          {selected ? "Sélectionné" : "Tap pour comparer"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={() => {
                    setCompareId(null);
                    setCompareOpen(false);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: "rgba(148,163,184,0.10)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#e5e7eb", fontWeight: "900" }}>Par défaut</Text>
                  <Text style={{ color: "#94a3b8", marginTop: 2, fontSize: 12 }}>
                    Scan précédent
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCompareOpen(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: "#0b1220",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.10)",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "900" }}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}