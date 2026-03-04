import React, { useMemo, useRef, useState } from "react";
import { View, Text, Image, Animated, PanResponder } from "react-native";

type Props = {
  frontUri: string;
  threeQuarterUri: string;
  sideUri: string;
  height?: number;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export default function Body3DViewer({
  frontUri,
  threeQuarterUri,
  sideUri,
  height = 420,
}: Props) {
  // t = 0 (face) -> 0.5 (3/4) -> 1 (profil)
  const t = useRef(new Animated.Value(0)).current;
  const [tLocal, setTLocal] = useState(0);

  // on écoute t pour calculer opacités & tilt
  useMemo(() => {
    const id = t.addListener(({ value }) => setTLocal(value));
    return () => t.removeListener(id);
  }, [t]);

  const startT = useRef(0);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startT.current = tLocal;
        },
        onPanResponderMove: (_, g) => {
          // dx -> t (adapte la sensibilité ici)
          const next = clamp01(startT.current + g.dx / 280);
          t.setValue(next);
        },
        onPanResponderRelease: () => {
          // snap en 3 positions : 0 / 0.5 / 1 (effet “propre”)
          const snap = tLocal < 0.25 ? 0 : tLocal < 0.75 ? 0.5 : 1;
          Animated.spring(t, { toValue: snap, useNativeDriver: false }).start();
        },
      }),
    [t, tLocal]
  );

  // opacités (crossfade)
  const frontOpacity = clamp01(1 - tLocal * 2); // 1 -> 0 entre 0 et 0.5
  const threeOpacity = tLocal <= 0.5 ? clamp01(tLocal * 2) : clamp01(2 - tLocal * 2); // 0->1->0
  const sideOpacity = clamp01(tLocal * 2 - 1); // 0 -> 1 entre 0.5 et 1

  // petit tilt “3D premium”
  const tilt = (tLocal - 0.5) * 10; // -5deg à +5deg environ
  const scale = 1.02;

  return (
    <View
      style={{
        backgroundColor: "#111827",
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}
      {...pan.panHandlers}
    >
      {/* halo */}
      <View
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#0b1220",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 320,
          height: 320,
          borderRadius: 999,
          left: "50%",
          top: 60,
          marginLeft: -160,
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      />

            <View style={{ height, justifyContent: "center", alignItems: "center" }}>
        {/* Face */}
        <Animated.Image
          source={{ uri: frontUri }}
          resizeMode="contain"
          style={{
            position: "absolute",
            width: "92%",
            height: "92%",
            opacity: frontOpacity,
            transform: [
              { perspective: 900 },
              { translateX: (0.5 - tLocal) * -18 },   // parallax
              { rotateY: `${(0.5 - tLocal) * 6}deg` }, // effet 3D
              { scale: 1.02 },
            ],
          }}
        />

        {/* 3/4 */}
        <Animated.Image
          source={{ uri: threeQuarterUri }}
          resizeMode="contain"
          style={{
            position: "absolute",
            width: "92%",
            height: "92%",
            opacity: threeOpacity,
            transform: [
              { perspective: 900 },
              { translateX: (0.5 - tLocal) * -8 },
              { rotateY: `${(0.5 - tLocal) * 3}deg` },
              { scale: 1.02 },
            ],
          }}
        />

        {/* Profil */}
        <Animated.Image
          source={{ uri: sideUri }}
          resizeMode="contain"
          style={{
            position: "absolute",
            width: "92%",
            height: "92%",
            opacity: sideOpacity,
            transform: [
              { perspective: 900 },
              { translateX: (0.5 - tLocal) * 18 },
              { rotateY: `${(0.5 - tLocal) * 6}deg` },
              { scale: 1.02 },
            ],
          }}
        />
      </View>

      {/* UI “vendable” */}
      <View
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "900" }}>← tourne</Text>

        <View
          style={{
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: "rgba(2,6,23,0.6)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>
            Scan 3D (swipe)
          </Text>
        </View>

        <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "900" }}>tourne →</Text>
      </View>
    </View>
  );
}