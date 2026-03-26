import React, { useMemo, useRef, useState } from "react";
import { View, Text, Image, Animated, PanResponder } from "react-native";

type Props = {
  beforeUri: string;
  afterUri: string;
  height?: number;
};

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

export default function BeforeAfterSwipe({ beforeUri, afterUri, height = 420 }: Props) {
  const [w, setW] = useState(0);

  // ✅ Anti-écran-vide (garde ça)
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
        <Text style={{ color: "#fff", fontWeight: "900" }}>Comparaison indisponible</Text>
        <Text style={{ color: "#94a3b8", marginTop: 6, textAlign: "center" }}>
          Photo manquante (avant ou après) pour cet angle.
        </Text>
      </View>
    );
  }

  // position du handle (en px)
  const x = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);

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
        onPanResponderRelease: () => {
          // rien (tu peux snap si tu veux)
        },
      }),
    [w, x]
  );

  // clip width = x (avec garde-fou quand w=0)
  const clipW = w ? x : 0;

  // handleLeft = x
  const handleLeft = w ? x : 0;

  // init au milieu dès qu'on connaît la largeur
  const onLayout = (e: any) => {
    const width = e.nativeEvent.layout.width;
    setW(width);
    x.setValue(width / 2);
  };

  return (
    <View
      onLayout={onLayout}
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
        source={{ uri: safeBefore }}
        resizeMode="contain"
        onError={(e) => console.log("BEFORE IMG ERROR", e.nativeEvent)}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />

      {/* AFTER (dessus, clip) */}
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
          onError={(e) => console.log("AFTER IMG ERROR", e.nativeEvent)}
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