import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Animated, PanResponder } from "react-native";

type Props = {
  frontUri: string;
  threeQuarterUri: string;
  sideUri: string;
  height?: number;
  angle?: "front" | "three" | "side";
  isAnalyzing?: boolean;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export default function Body3DViewer({
  frontUri,
  threeQuarterUri,
  sideUri,
  height = 420,
  angle,
  isAnalyzing = false,
}: Props) {
  const t = useRef(new Animated.Value(0)).current;
  const [tLocal, setTLocal] = useState(0);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const startT = useRef(0);

  useEffect(() => {
    const id = t.addListener(({ value }) => setTLocal(value));
    return () => t.removeListener(id);
  }, [t]);

  useEffect(() => {
    if (!angle) return;

    const target = angle === "front" ? 0 : angle === "three" ? 0.5 : 1;

    Animated.spring(t, {
      toValue: target,
      useNativeDriver: false,
    }).start();
  }, [angle, t]);

  useEffect(() => {
    if (!isAnalyzing) {
      scanAnim.stopAnimation();
      scanAnim.setValue(0);
      return;
    }

    scanAnim.setValue(0);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: false,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: false,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
      scanAnim.setValue(0);
    };
  }, [isAnalyzing, scanAnim]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startT.current = tLocal;
        },
        onPanResponderMove: (_, g) => {
          const next = clamp01(startT.current + g.dx / 280);
          t.setValue(next);
        },
        onPanResponderRelease: () => {
          const snap = tLocal < 0.25 ? 0 : tLocal < 0.75 ? 0.5 : 1;
          Animated.spring(t, {
            toValue: snap,
            useNativeDriver: false,
          }).start();
        },
      }),
    [t, tLocal]
  );

  const frontOpacity = clamp01(1 - tLocal * 2);
  const threeOpacity =
    tLocal <= 0.5 ? clamp01(tLocal * 2) : clamp01(2 - tLocal * 2);
  const sideOpacity = clamp01(tLocal * 2 - 1);

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
      {/* halo fond */}
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
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
              { translateX: (0.5 - tLocal) * -18 },
              { rotateY: `${(0.5 - tLocal) * 6}deg` },
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

      {/* OVERLAY ANALYSE AU-DESSUS DES IMAGES */}
      {isAnalyzing && (
        <>
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              top: scanAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, height - 30],
              }),
              height: 24,
              borderRadius: 999,
              backgroundColor: "rgba(34,197,94,0.12)",
              zIndex: 30,
              justifyContent: "center",
              shadowColor: "#22c55e",
              shadowOpacity: 0.35,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 0 },
              elevation: 8,
            }}
          >
            <View
              style={{
                height: 4,
                borderRadius: 999,
                backgroundColor: "#22c55e",
              }}
            />
          </Animated.View>

          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 14,
              alignSelf: "center",
              zIndex: 31,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: "rgba(2,6,23,0.68)",
              borderWidth: 1,
              borderColor: "rgba(34,197,94,0.28)",
            }}
          >
            <Text style={{ color: "#86efac", fontWeight: "900", fontSize: 12 }}>
              Analyse visuelle en cours...
            </Text>
          </View>
        </>
      )}

      {/* UI bas */}
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
        <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "900" }}>
          ← tourne
        </Text>

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

        <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "900" }}>
          tourne →
        </Text>
      </View>
    </View>
  );
}