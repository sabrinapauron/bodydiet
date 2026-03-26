import React from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

export default function ContactScreen() {
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
          Nous contacter
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
            Pour toute question, demande d’assistance ou remarque concernant Body Diet, tu peux nous
            écrire à l’adresse suivante :
          </Text>

          <Text style={{ color: "#38BDF8", fontWeight: "900", fontSize: 17, marginTop: 18 }}>
            contact@bodydiet.app
          </Text>

          <Text style={{ color: "#cbd5e1", lineHeight: 22, marginTop: 18 }}>
            Tu peux nous contacter notamment pour :
          </Text>

          <Text style={{ color: "#cbd5e1", lineHeight: 22, marginTop: 10 }}>
            • une question sur l’application{"\n"}
            • un problème technique{"\n"}
            • une demande liée à ton accès premium{"\n"}
            • une question sur tes données ou sur la confidentialité{"\n"}
            • un retour d’expérience ou une suggestion d’amélioration
          </Text>

          <Text style={{ color: "#94a3b8", lineHeight: 22, marginTop: 18 }}>
            Tu pourras remplacer cette adresse plus tard par ton vrai email de support.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}