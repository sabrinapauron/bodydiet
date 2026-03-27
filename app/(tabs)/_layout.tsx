import { Tabs } from "expo-router";
import React from "react";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";

function CustomTabBarButton(props: any) {
  const { accessibilityState, children, onPress } = props;
  const selected = accessibilityState?.selected;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          minWidth: 88,
          height: 40,
          paddingHorizontal: 12,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          backgroundColor: selected ? "rgba(28,47,226,0.12)" : "transparent",
          borderWidth: selected ? 1 : 0,
          borderColor: selected ? "rgba(96,165,250,0.22)" : "transparent",
          shadowColor: selected ? "#1C2FE2" : "transparent",
          shadowOpacity: selected ? 0.18 : 0,
          shadowRadius: selected ? 10 : 0,
          shadowOffset: { width: 0, height: 0 },
          elevation: selected ? 5 : 0,
        }}
      >
        {children}
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

return (
  <Tabs
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: "#EAF1FF",
      tabBarInactiveTintColor: "#94A3B8",
      tabBarStyle: {
        backgroundColor: "#020617",
        borderTopColor: "rgba(255,255,255,0.08)",
        borderTopWidth: 1,
        height: 58 + insets.bottom,
        paddingTop: 8,
        paddingBottom: Math.max(10, insets.bottom),
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: "800",
        marginLeft: 6,
      },
      tabBarButton: (props) => <CustomTabBarButton {...props} />,
    }}
  >
    <Tabs.Screen
      name="index"
      options={{
        title: "Accueil",
        tabBarIcon: () => null,
      }}
    />

    <Tabs.Screen
      name="explore"
      options={{
        title: "Aide",
        tabBarIcon: () => null,
      }}
    />

    <Tabs.Screen
      name="diagnostic-training"
      options={{
        href: null,
      }}
    />

    <Tabs.Screen
      name="index_backup"
      options={{
        href: null,
      }}
    />

    <Tabs.Screen
      name="premium-meals"
      options={{
        href: null,
      }}
    />
  </Tabs>
);
}