import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { hasSeenOnboarding } from "../storage/onboarding";

export default function EntryScreen() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        const seen = await hasSeenOnboarding();
        console.log("📦 onboarding seen ?", seen);

        if (!mounted) return;

        setTimeout(() => {
          if (!mounted) return;
          router.replace(seen ? "/(tabs)" : "/onboarding");
        }, 0);
      } catch (e) {
        console.log("❌ boot onboarding error:", e);

        if (!mounted) return;

        setTimeout(() => {
          if (!mounted) return;
          router.replace("/(tabs)");
        }, 0);
      }
    };

    boot();

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