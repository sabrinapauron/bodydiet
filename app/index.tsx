import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";

export default function EntryScreen() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    setTimeout(() => {
      if (!mounted) return;
      router.replace("/onboarding");
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