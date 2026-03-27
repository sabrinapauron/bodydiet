import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { hasSeenOnboarding } from "../storage/onboarding";

export default function EntryScreen() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        const seen = await hasSeenOnboarding();

        if (!mounted) return;

        console.log("📦 onboarding seen ?", seen);

        if (seen) {
          router.replace("/(tabs)");
        } else {
          router.replace("/onboarding");
        }
      } catch (e) {
        console.log("❌ boot error:", e);

        if (!mounted) return;
        router.replace("/onboarding");
      }
    };

    setTimeout(() => {
      boot();
    }, 0);

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0b1220",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" color="#22c55e" />
    </View>
  );
}