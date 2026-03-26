import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";

import { hasSeenOnboarding, resetOnboardingSeen } from "../storage/onboarding";
export default function EntryScreen() {
  const router = useRouter();

 useEffect(() => {
  const boot = async () => {
    await resetOnboardingSeen(); // temporaire pour forcer le retour de l’onboarding

    const seen = await hasSeenOnboarding();

    if (seen) {
      router.replace("/(tabs)");
    } else {
      router.replace("/onboarding");
    }
  };

  boot();
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