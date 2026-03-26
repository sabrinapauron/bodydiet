import React from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a1235" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 28, paddingBottom: 40 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            alignSelf: "flex-start",
            marginBottom: 14,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 999,
            backgroundColor: "#020617",
            borderWidth: 1,
            borderColor: "#1f2937",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>← Retour</Text>
        </TouchableOpacity>

        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>
          À propos
        </Text>

        <View
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 18,
            backgroundColor: "#020617",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
          }}
        >
          <Text style={{ color: "#cbd5e1", lineHeight: 22 }}>
            Body Diet est une application pensée pour aider à mieux suivre son alimentation, mieux
            comprendre ses apports et progresser de façon plus claire dans ses objectifs physiques.
          </Text>

          <Text style={{ color: "#fff", fontWeight: "900", marginTop: 18 }}>
            L’application propose notamment :
          </Text>

          <Text style={{ color: "#cbd5e1", lineHeight: 22, marginTop: 10 }}>
            • le suivi des macros{"\n"}
            • le scan repas{"\n"}
            • l’analyse BodyMind{"\n"}
            • le Body Scan 3D{"\n"}
            • des fonctionnalités premium pour améliorer l’expérience et la progression
          </Text>

          <Text style={{ color: "#cbd5e1", lineHeight: 22, marginTop: 18 }}>
            L’objectif de Body Diet est de rendre le suivi plus simple, plus visuel et plus motivant,
            tout en donnant à l’utilisateur des repères utiles pour progresser dans son quotidien.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}