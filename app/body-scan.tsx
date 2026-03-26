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
   BEFORE / AFTER SWIPE
------------------------------ */

type BeforeAfterProps = {
  beforeUri: string;
  afterUri: string;
  height?: number;
};

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

function BeforeAfterSwipe({
  beforeUri,
  afterUri,
  height = 420,
}: BeforeAfterProps) {
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);

  const safeBefore = typeof beforeUri === "string" ? beforeUri : "";
  const safeAfter = typeof afterUri === "string" ? afterUri : "";

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
        <Text style={{ color: "#fff", fontWeight: "900" }}>
          Comparaison indisponible
        </Text>
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
        x.setValue(width / 2);
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

      {/* AFTER clip */}
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
        <Image
          source={{ uri: safeAfter }}
          resizeMode="contain"
          style={{ width: "100%", height: "100%" }}
        />
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

      {/* Handle */}
     <Animated.View
  style={{
    position: "absolute",
    top: 0,
    bottom: 0,
    left: handleLeft,
    width: 2,
    backgroundColor: "rgba(96,165,250,0.55)",
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
    backgroundColor: "rgba(2,6,23,0.82)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.32)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  }}
>
  <Text style={{ color: "#EAF1FF", fontWeight: "900", fontSize: 16 }}>
    ↔
  </Text>
</Animated.View>

      {/* Labels */}
      <View style={{ position: "absolute", left: 10, bottom: 10 }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontWeight: "900" }}>
          Avant
        </Text>
      </View>

      <View style={{ position: "absolute", right: 10, bottom: 10 }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontWeight: "900" }}>
          Aujourd’hui
        </Text>
      </View>
    </View>
  );
}

/* ------------------------------
   SCREEN
------------------------------ */

type BodyFocus =
  | "balanced"
  | "midsection"
  | "lower_body"
  | "upper_body"
  | "slim_legs"
  | "toning";

function normalizeBodyFocus(v: any): BodyFocus {
  const allowed: BodyFocus[] = [
    "balanced",
    "midsection",
    "lower_body",
    "upper_body",
    "slim_legs",
    "toning",
  ];

  return allowed.includes(v) ? v : "balanced";
}

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<"3d" | "compare">("3d");

  const isPremium = true;
  const [heightCm, setHeightCm] = useState<number | null>(null);

  const SERVER_URL = "https://monaserver.onrender.com";

  const [aiLoading, setAiLoading] = useState(false);
  const [aiComment, setAiComment] = useState<BodyScanCommentary | null>(null);

  const swipe = useMemo(() => {
    let startIndex = 0;

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dy) < 24,
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

  const beforeUri = before ? getUri(before, angle) : "";
  const afterUri = after ? getUri(after, angle) : "";
  const canCompare = !!before && !!beforeUri && !!afterUri;

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

    const cached = await getBodyScanCommentary(
      mode,
      after.day,
      before?.day ?? null
    );

    if (cached) {
      await saveCoachWeeklyMission(
        cached.missionToday ?? cached.focus7?.[0] ?? null
      );
      await saveCoachWeeklyChallenge(
        cached.missionToday ?? cached.focus7?.[0] ?? null
      );
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
        Alert.alert(
          "Scan incomplet",
          "Il faut les 3 photos (Face / 3-4 / Profil) pour l’analyse."
        );
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

      const json = await r.json();

      if (!r.ok) {
        throw new Error(json?.error || `HTTP ${r.status}`);
      }

      if (!json?.ok || !json?.data) {
        throw new Error(json?.error || "Réponse serveur invalide");
      }

      const data = json.data;

      const bodyFocus = normalizeBodyFocus(data?.bodyFocus);
      const bodyComment =
        typeof data?.bodyComment === "string" && data.bodyComment.trim()
          ? data.bodyComment.trim()
          : "Travail général conseillé pour accompagner ta progression.";

      const normalized = {
        ...data,
        wins: data.wins ?? [],
        work: data.work ?? [],
        focus7: data.focus7 ?? [],
        closing: data.closing ?? "",
        mainLever: data.mainLever ?? "",
        missionToday: data.missionToday ?? "",
        intentScore:
          typeof data.intentScore === "number" ? data.intentScore : 75,
        bodyFocus,
        bodyComment,
      } as BodyScanCommentary;

      await saveBodyScanCommentary(
        mode,
        after.day,
        before?.day ?? null,
        normalized
      );
      await saveCoachWeeklyMission(
        normalized.missionToday ?? normalized.focus7?.[0] ?? null
      );
      await saveCoachWeeklyChallenge(
        normalized.missionToday ?? normalized.focus7?.[0] ?? null
      );

      setAiComment(normalized);
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : String(e);
      Alert.alert("Erreur", msg.slice(0, 900));
    } finally {
      setAiLoading(false);
    }
  };

  const runAnalysis = async () => {
    setViewMode("3d");
    setIsAnalyzing(true);

    await new Promise((resolve) => setTimeout(resolve, 3500));

    setIsAnalyzing(false);
    await runCoach();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 18, paddingBottom: 40 }}
      >
        {/* HEADER */}
<View
  style={{
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  }}
>
  <View>
    <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>
      Scan Body 3D
    </Text>
    <Text style={{ color: "#94a3b8", marginTop: 4, fontSize: 13 }}>
      Analyse visuelle de ta posture et de ta silhouette
    </Text>
  </View>

  <TouchableOpacity
    onPress={() => router.back()}
    style={{
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.04)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
    }}
  >
    <Text style={{ color: "#fff", fontWeight: "900" }}>Retour</Text>
  </TouchableOpacity>
</View>

        
        {!after ? (
          <View
            style={{
              marginTop: 14,
              padding: 16,
              borderRadius: 16,
              backgroundColor: "#111827",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              Aucun scan
            </Text>
            <Text style={{ color: "#94a3b8", marginTop: 6 }}>
              Fais ton premier scan (Face / 3-4 / Profil).
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
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                📷 Nouveau scan
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginTop: 14 }}>
            {/* Viewer */}
            <View {...(viewMode === "3d" ? swipe.panHandlers : {})}>
              {viewMode === "compare" && canCompare ? (
                <BeforeAfterSwipe beforeUri={beforeUri} afterUri={afterUri} />
              ) : (
                <Body3DViewer
                  frontUri={after.frontUri}
                  threeQuarterUri={after.threeUri}
                  sideUri={after.sideUri}
                  angle={angle}
                  isAnalyzing={isAnalyzing}
                />
              )}
            </View>

           {/* Mode buttons */}
<View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
  <TouchableOpacity
    onPress={() => setViewMode("3d")}
    style={{
      flex: 1,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor:
        viewMode === "3d"
          ? "rgba(37,99,235,0.16)"
          : "rgba(255,255,255,0.04)",
      borderWidth: 1,
      borderColor:
        viewMode === "3d"
          ? "rgba(96,165,250,0.35)"
          : "rgba(255,255,255,0.08)",
      alignItems: "center",
      shadowColor: viewMode === "3d" ? "#2563EB" : "transparent",
      shadowOpacity: viewMode === "3d" ? 0.22 : 0,
      shadowRadius: viewMode === "3d" ? 12 : 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: viewMode === "3d" ? 6 : 0,
    }}
  >
    <Text
      style={{
        color: viewMode === "3d" ? "#EAF1FF" : "#fff",
        fontWeight: "900",
      }}
    >
      Vue 3D
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => setViewMode("compare")}
    disabled={!canCompare}
    style={{
      flex: 1,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor:
        viewMode === "compare" && canCompare
          ? "rgba(37,99,235,0.16)"
          : "rgba(255,255,255,0.04)",
      borderWidth: 1,
      borderColor:
        viewMode === "compare" && canCompare
          ? "rgba(96,165,250,0.35)"
          : "rgba(255,255,255,0.08)",
      alignItems: "center",
      opacity: canCompare ? 1 : 0.45,
      shadowColor: viewMode === "compare" && canCompare ? "#2563EB" : "transparent",
      shadowOpacity: viewMode === "compare" && canCompare ? 0.22 : 0,
      shadowRadius: viewMode === "compare" && canCompare ? 12 : 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: viewMode === "compare" && canCompare ? 6 : 0,
    }}
  >
    <Text
      style={{
        color:
          viewMode === "compare" && canCompare ? "#EAF1FF" : "#fff",
        fontWeight: "900",
      }}
    >
      Comparer
    </Text>
  </TouchableOpacity>
</View>

            {/* Premium Coach */}
            <View style={{ marginTop: 14 }}>
              <TouchableOpacity
  onPress={runAnalysis}
  disabled={aiLoading}
  style={{
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(37,99,235,0.14)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.30)",
    shadowColor: "#2563EB",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  }}
>
  <Text style={{ color: "#EAF1FF", fontWeight: "900", fontSize: 15 }}>
    {aiLoading ? "Analyse en cours..." : "Analyse Coach Premium"}
  </Text>
</TouchableOpacity>

              {aiComment && (
                <View
                  style={{
                    marginTop: 12,
                    padding: 14,
                    borderRadius: 14,
                   backgroundColor: "rgba(255,255,255,0.04)",
borderWidth: 1,
borderColor: "rgba(255,255,255,0.08)",
shadowColor: "#000",
shadowOpacity: 0.18,
shadowRadius: 16,
shadowOffset: { width: 0, height: 8 },
elevation: 6,
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}
                  >
                    {aiComment.title}
                  </Text>

                  <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 6 }}>
                    {aiComment.summary}
                  </Text>

                  {aiComment.mainLever ? (
                    <View
                      style={{
                        marginTop: 10,
                        padding: 10,
                        borderRadius: 12,
                        backgroundColor: "rgba(37,99,235,0.10)",
                        borderWidth: 1,
                        borderColor: "rgba(96,165,250,0.24)",
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "800" }}>
                        🎯 Le levier n°1
                      </Text>
                      <Text
                        style={{ color: "rgba(255,255,255,0.8)", marginTop: 4 }}
                      >
                        {aiComment.mainLever}
                      </Text>
                    </View>
                  ) : null}

                  {aiComment.missionToday ? (
                    <View
                      style={{
                        marginTop: 10,
                        padding: 10,
                        borderRadius: 12,
                       backgroundColor: "rgba(37,99,235,0.10)",
borderWidth: 1,
borderColor: "rgba(96,165,250,0.24)",
                      }}
                    >
                     <Text style={{ color: "#60A5FA", fontWeight: "900" }}>
  Mission du jour
</Text>
                      <Text
                        style={{ color: "rgba(255,255,255,0.85)", marginTop: 4 }}
                      >
                        {aiComment.missionToday}
                      </Text>

                      {typeof aiComment.intentScore === "number" ? (
                        <Text
                          style={{ color: "#94a3b8", marginTop: 6, fontSize: 12 }}
                        >
                          Clarté du plan :{" "}
                          <Text style={{ color: "#fff", fontWeight: "900" }}>
                            {Math.round(aiComment.intentScore)}/100
                          </Text>
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  <Text style={{ color: "#fff", marginTop: 10, fontWeight: "800" }}>
                    ✅ Points forts
                  </Text>
                  {aiComment.wins?.map((t, i) => (
                    <Text key={i} style={{ color: "rgba(255,255,255,0.8)" }}>
                      • {t}
                    </Text>
                  ))}

                  <Text style={{ color: "#fff", marginTop: 10, fontWeight: "800" }}>
                    🎯 À travailler
                  </Text>
                  {aiComment.work?.map((t, i) => (
                    <Text key={i} style={{ color: "rgba(255,255,255,0.8)" }}>
                      • {t}
                    </Text>
                  ))}

                  <Text style={{ color: "#fff", marginTop: 10, fontWeight: "800" }}>
                    🔥 Focus 7 jours
                  </Text>
                  {(aiComment as any).focus7?.map((t: any, i: number) => (
                    <Text key={i} style={{ color: "rgba(255,255,255,0.8)" }}>
                      • {typeof t === "string" ? t : t?.label ?? ""}
                    </Text>
                  ))}

                  <Text
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      marginTop: 10,
                      fontWeight: "800",
                    }}
                  >
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
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  }}
>
  <Text style={{ color: "#fff", fontWeight: "900" }}>
    Comparer avec…
  </Text>
  <Text style={{ color: "#94a3b8", marginTop: 4, fontSize: 12 }}>
    {before ? `Avant : ${before.day}` : "Choisir un scan précédent"}
  </Text>
</TouchableOpacity>

            <TouchableOpacity
  onPress={() => router.push("/body-scan-capture")}
  style={{
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: "rgba(37,99,235,0.12)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.26)",
    alignItems: "center",
  }}
>
  <Text style={{ color: "#EAF1FF", fontWeight: "900" }}>
    Nouveau scan
  </Text>
</TouchableOpacity>

            {!before && (
              <Text style={{ color: "#94a3b8", marginTop: 8, fontSize: 12 }}>
                Fais un 2ᵉ scan (un autre jour) pour activer le swipe Avant/Aujourd’hui.
              </Text>
            )}
          </View>
        )}

        {/* MODAL compare */}
        <Modal
          visible={compareOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCompareOpen(false)}
        >
          <Pressable
            onPress={() => setCompareOpen(false)}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.55)",
              padding: 16,
              justifyContent: "center",
            }}
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
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
                Comparer avec…
              </Text>
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
                          backgroundColor: selected
                            ? "rgba(255,255,255,0.10)"
                            : "rgba(255,255,255,0.04)",
                          borderWidth: 1,
                          borderColor: selected
                            ? "rgba(255,255,255,0.18)"
                            : "rgba(255,255,255,0.08)",
                          marginBottom: 10,
                        }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "900" }}>
                          {s.day}
                        </Text>
                        <Text
                          style={{ color: "#94a3b8", marginTop: 2, fontSize: 12 }}
                        >
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
                  <Text style={{ color: "#e5e7eb", fontWeight: "900" }}>
                    Par défaut
                  </Text>
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
                  <Text style={{ color: "#fff", fontWeight: "900" }}>
                    Fermer
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}