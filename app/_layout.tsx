import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect, useRef } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { initRevenueCat, loginRevenueCat } from "../lib/revenuecat";
import { getAuthUser } from "../storage/auth";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const rcInitRef = useRef(false);

  useEffect(() => {
    if (rcInitRef.current) return;
    rcInitRef.current = true;

    const bootRevenueCat = async () => {
      try {
        await initRevenueCat();

        const authUser = await getAuthUser();
        if (authUser?.id) {
          await loginRevenueCat(authUser.id);
          console.log("✅ RevenueCat connecté au user =", authUser.id);
        } else {
          console.log("ℹ️ Aucun utilisateur connecté pour RevenueCat");
        }
      } catch (e) {
        console.log("❌ RevenueCat init/login error:", e);
      }
    };

    setTimeout(() => {
      bootRevenueCat();
    }, 0);
  }, []);

 return (
  <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="modal"
        options={{
          presentation: "modal",
          title: "Modal",
          headerShown: true,
        }}
      />
    </Stack>
    <StatusBar style="auto" />
  </ThemeProvider>
);
}
