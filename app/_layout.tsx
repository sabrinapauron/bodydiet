import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect, useRef } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { initRevenueCat } from "../lib/revenuecat";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const rcInitRef = useRef(false);

  useEffect(() => {
    if (rcInitRef.current) return;
    rcInitRef.current = true;

    (async () => {
      try {
        await initRevenueCat();
        console.log("✅ RevenueCat initialisé");
      } catch (e) {
        console.log("❌ RevenueCat init error:", e);
      }
    })();
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal", headerShown: true }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}