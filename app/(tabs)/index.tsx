import { View, Text, TouchableOpacity } from "react-native";

export default function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0b1220",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "white", fontSize: 42, fontWeight: "900" }}>
        BODY
      </Text>

      <Text style={{ color: "#9ca3af", marginTop: 10 }}>
        Protéines aujourd’hui
      </Text>

      <Text
        style={{
          color: "white",
          fontSize: 48,
          marginTop: 20,
          fontWeight: "bold",
        }}
      >
        0 / 150 g
      </Text>

      <TouchableOpacity
        style={{
          marginTop: 40,
          backgroundColor: "white",
          paddingVertical: 18,
          paddingHorizontal: 40,
          borderRadius: 14,
        }}
      >
        <Text style={{ fontWeight: "900", fontSize: 18 }}>
          SCAN REPAS
        </Text>
      </TouchableOpacity>
    </View>
  );
}