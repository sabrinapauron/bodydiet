import React from "react";
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";

export default function ExploreScreen() {
  const router = useRouter();

  const handleSoon = (label: string) => {
    Alert.alert(label, "Cette section sera reliée à ton contenu Body Diet.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Text
          style={{
            color: "#fff",
            fontSize: 26,
            fontWeight: "900",
            marginBottom: 6,
          }}
        >
          Outils Body Diet
        </Text>

        <Text
          style={{
            color: "#94A3B8",
            fontSize: 14,
            lineHeight: 21,
            marginBottom: 18,
          }}
        >
          Ton centre rapide pour piloter ta journée, ton suivi et tes options premium.
        </Text>

        <View
          style={{
            backgroundColor: "#0f172a",
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.06)",
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
            Coach rapide
          </Text>

          <Text style={{ color: "#cbd5e1", marginTop: 10, lineHeight: 21 }}>
            Aujourd’hui, garde une logique simple :
          </Text>

          <Text style={{ color: "#fff", marginTop: 10, fontWeight: "700" }}>
            • Scanne tes repas principaux
          </Text>
          <Text style={{ color: "#fff", marginTop: 6, fontWeight: "700" }}>
            • Vérifie ton retard macro
          </Text>
          <Text style={{ color: "#fff", marginTop: 6, fontWeight: "700" }}>
            • Ajuste avant le soir
          </Text>

          <View
            style={{
              marginTop: 14,
              backgroundColor: "rgba(28,47,226,0.14)",
              borderRadius: 14,
              padding: 12,
            }}
          >
            <Text style={{ color: "#EAF1FF", fontWeight: "800" }}>
              Conseil du jour
            </Text>
            <Text style={{ color: "#dbeafe", marginTop: 6, lineHeight: 20 }}>
              Un bon suivi ne cherche pas la perfection au gramme près. Il cherche la cohérence sur la journée.
            </Text>
          </View>
        </View>

        <Text
          style={{
            color: "#94A3B8",
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 1.3,
            marginBottom: 8,
          }}
        >
          RACCOURCIS
        </Text>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/album-meals")}
          style={cardStyle}
        >
          <Text style={cardTitle}>📸 Album repas</Text>
          <Text style={cardText}>
            Retrouve tes photos repas et ton historique visuel.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/premium-meals")}
          style={cardStyle}
        >
          <Text style={cardTitle}>🍽 Repas Body Diet</Text>
          <Text style={cardText}>
            Accède aux idées repas et à l’optimisation plus poussée.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/body-scan")}
          style={cardStyle}
        >
          <Text style={cardTitle}>👤 Body Scan 3D</Text>
          <Text style={cardText}>
            Visualise ta progression et relance ton analyse corporelle.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleSoon("Réinitialiser la journée")}
          style={cardStyle}
        >
          <Text style={cardTitle}>🔄 Réinitialiser la journée</Text>
          <Text style={cardText}>
            Option pratique pour repartir à zéro si besoin.
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            color: "#94A3B8",
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 1.3,
            marginTop: 18,
            marginBottom: 8,
          }}
        >
          PREMIUM
        </Text>

        <View
          style={{
            backgroundColor: "#111827",
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: "rgba(96,165,250,0.18)",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
            Body Diet Premium
          </Text>

          <Text style={{ color: "#cbd5e1", marginTop: 10, lineHeight: 21 }}>
            Débloque les fonctions les plus puissantes de l’app pour aller plus vite et voir plus clair.
          </Text>

          <Text style={premiumLine}>• Scan repas illimité</Text>
          <Text style={premiumLine}>• Body Scan 3D</Text>
          <Text style={premiumLine}>• Outils repas avancés</Text>
          <Text style={premiumLine}>• Expérience plus complète</Text>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleSoon("Premium")}
            style={{
              marginTop: 14,
              backgroundColor: "#1d4ed8",
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
              Voir l’offre Premium
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const cardStyle = {
  backgroundColor: "#111827",
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.05)",
};

const cardTitle = {
  color: "#fff",
  fontSize: 16,
  fontWeight: "800" as const,
};

const cardText = {
  color: "#94A3B8",
  marginTop: 8,
  lineHeight: 20,
};

const premiumLine = {
  color: "#fff",
  marginTop: 8,
  fontWeight: "700" as const,
};