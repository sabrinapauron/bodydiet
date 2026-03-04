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
} from "react-native";
import { useRouter } from "expo-router";
import Body3DViewer from "../components/Body3DView";
import { loadBodyScans, type BodyScan } from "../storage/bodyStore";


function BeforeAfterSwipe({
  beforeUri,
  afterUri,
  height = 420,
}: {
  beforeUri: string;
  afterUri: string;
  height?: number;
}) {
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0.5)).current; // 0..1

  const xLocal = useRef(0.5);
  useMemo(() => {
    const id = x.addListener(({ value }) => (xLocal.current = value));
    return () => x.removeListener(id);
  }, [x]);

  const startX = useRef(0.5);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startX.current = xLocal.current;
        },
        onPanResponderMove: (_, g) => {
          if (!w) return;
          const next = Math.max(0, Math.min(1, startX.current + g.dx / w));
          x.setValue(next);
        },
      }),
    [w, x]
  );

  const clipW = x.interpolate({
    inputRange: [0, 1],
    outputRange: [0, w],
  });

  const handleLeft = x.interpolate({
    inputRange: [0, 1],
    outputRange: [0, w],
  });

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
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
      {/* BEFORE (fond) */}
      <Image
        source={{ uri: beforeUri }}
        resizeMode="contain"
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />

      {/* AFTER (dessus, clip) */}
      <Animated.View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: clipW, overflow: "hidden" }}>
        <Image
          source={{ uri: afterUri }}
          resizeMode="contain"
          style={{ width: "100%", height: "100%" }}
        />
      </Animated.View>

      {/* séparateur + poignée */}
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

export default function BodyScanScreen() {
  const router = useRouter();
const [scans, setScans] = useState<BodyScan[]>([]);
const [angle, setAngle] = useState<"front" | "three" | "side">("front");

const [compareOpen, setCompareOpen] = useState(false);
const [compareId, setCompareId] = useState<string | null>(null);

const after = scans[0] || null;

const before = useMemo(() => {
  if (!after) return null;

  if (compareId) {
    const found = scans.find((s) => s.day === compareId);
    return found && found.day !== after.day ? found : null;
  }

  const prev = scans[1] || null;
  return prev && prev.day !== after.day ? prev : null;
}, [scans, after, compareId]);


useEffect(() => {
  (async () => {
    const list = await loadBodyScans();
    setScans(list);
  })();
}, []);

  
const getUri = (s: BodyScan, a: "front" | "three" | "side") => {
  if (a === "front") return s.frontUri;
  if (a === "three") return s.threeUri;
  return s.sideUri;
};

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

        {!after ? (
  // ... ton bloc "Aucun scan body" + bouton capture (tu l’as déjà)
  <View />
) : (
  <View style={{ marginTop: 14 }}>
    {/* Boutons angle (évite conflit de swipe) */}
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
      {[
        { k: "front", label: "FACE" },
        { k: "three", label: "3/4" },
        { k: "side", label: "PROFIL" },
      ].map((b: any) => (
        <TouchableOpacity
          key={b.k}
          onPress={() => setAngle(b.k)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 999,
            backgroundColor: angle === b.k ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
            borderWidth: 1,
            borderColor: angle === b.k ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12, opacity: angle === b.k ? 1 : 0.7 }}>
            {b.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    {before ? (
      <BeforeAfterSwipe
        beforeUri={getUri(before, angle)}
        afterUri={getUri(after, angle)}
      />
    ) : (
      // Si tu n'as qu'un seul scan, on affiche ton viewer normal
      <Body3DViewer
        frontUri={after.frontUri}
        threeQuarterUri={after.threeUri}
        sideUri={after.sideUri}
      />
    )}
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
  <Text style={{ color: "#fff", fontWeight: "900" }}>
    🔁 Comparer avec…
  </Text>
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
        <Text style={{ color: "#94a3b8", marginTop: 12, fontSize: 12, opacity: 0.9 }}>
          Prochaine étape : on remplace les 3 URLs par tes vraies photos (Face / 3-4 / Profil) prises dans l’app.
        </Text>

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
          .filter((s) => !after || s.day !== after.day) // pas le même jour que le "after"
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
            setCompareId(null); // revient à "scan précédent"
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
          <Text style={{ color: "#94a3b8", marginTop: 2, fontSize: 12 }}>Scan précédent</Text>
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