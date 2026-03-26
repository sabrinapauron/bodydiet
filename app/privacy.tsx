import React from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

export default function PrivacyScreen() {
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
          Politique de confidentialité
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
            Body Diet accorde de l’importance à la protection de la vie privée de ses utilisateurs.
          </Text>

          <Text style={{ color: "#cbd5e1", lineHeight: 22, marginTop: 14 }}>
            Cette application peut enregistrer certaines informations nécessaires à son fonctionnement,
            notamment des données liées à ton profil, à tes objectifs, à ton suivi nutritionnel, à tes
            analyses, à tes repas scannés, à ton utilisation des fonctionnalités premium ainsi qu’à
            certaines préférences de fonctionnement.
          </Text>

          <Text style={{ color: "#cbd5e1", lineHeight: 22, marginTop: 14 }}>
            Lorsque tu utilises des fonctions comme le scan repas, BodyMind ou le Body Scan 3D, certaines
            données que tu fournis peuvent être traitées pour permettre l’analyse, l’affichage des
            résultats et l’amélioration de ton expérience dans l’application.
          </Text>

          <Text style={{ color: "#fff", fontWeight: "900", marginTop: 18 }}>
            Les informations utilisées par Body Diet ont pour objectif de :
          </Text>

          <Text style={{ color: "#cbd5e1", lineHeight: 22, marginTop: 10 }}>
            • permettre le suivi nutritionnel et physique{"\n"}
            • fournir des analyses personnalisées{"\n"}
            • gérer les fonctionnalités premium{"\n"}
            • restaurer les achats si nécessaire{"\n"}
            • améliorer la stabilité et le bon fonctionnement de l’application
          </Text>

          <Text style={{ color: "#cbd5e1", lineHeight: 22, marginTop: 14 }}>
            Certaines données peuvent être stockées localement sur ton appareil. Certaines fonctionnalités
            peuvent aussi faire appel à des services techniques nécessaires au fonctionnement de
            l’application, notamment pour les achats intégrés, les analyses intelligentes ou la gestion
            technique du service.
          </Text>

          <Text style={{ color: "#cbd5e1", lineHeight: 22, marginTop: 14 }}>
            Body Diet ne cherche pas à collecter plus de données que nécessaire au bon fonctionnement de
            ses outils.
          </Text>

          <Text style={{ color: "#cbd5e1", lineHeight: 22, marginTop: 14 }}>
            Tu peux nous contacter à tout moment pour toute question liée à la confidentialité, au support
            ou à l’utilisation de l’application.
          </Text>

          <Text style={{ color: "#38BDF8", fontWeight: "800", marginTop: 18 }}>
            Contact : contact@bodydiet.app
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}