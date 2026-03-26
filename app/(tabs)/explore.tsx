import React from "react";
import { View, Text, SafeAreaView, ScrollView } from "react-native";

export default function ExploreScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Text
          style={{
            color: "#fff",
            fontSize: 28,
            fontWeight: "900",
            marginBottom: 6,
          }}
        >
          Aide
        </Text>

        <Text
          style={{
            color: "#94A3B8",
            fontSize: 14,
            lineHeight: 21,
            marginBottom: 18,
          }}
        >
          Retrouve ici les repères utiles pour utiliser Body Diet simplement,
          sans chercher partout dans l’application.
        </Text>

        <View style={sectionCard}>
          <Text style={sectionTitle}>👤 Remplir son profil</Text>
          <Text style={sectionText}>
            Ton profil sert à adapter automatiquement tes objectifs. Renseigne
            ton poids, ta taille et ton objectif pour obtenir une base macro
            cohérente.
          </Text>
          <Text style={hintText}>
            Le profil se complète depuis l’écran principal de l’application.
          </Text>
        </View>

        <View style={sectionCard}>
          <Text style={sectionTitle}>🍽️ Calculer ses repas</Text>
          <Text style={sectionText}>
            Tu peux scanner ton repas pour obtenir une estimation rapide de tes
            macros, puis ajuster si besoin avec l’ajout personnel.
          </Text>
          <Text style={bullet}>• Scan repas : pour une estimation visuelle rapide</Text>
          <Text style={bullet}>• Ajout perso : pour compléter ou corriger ton repas</Text>
          <Text style={hintText}>
            L’idée n’est pas de viser le gramme parfait, mais une journée
            cohérente et simple à suivre.
          </Text>
        </View>

        <View style={sectionCard}>
          <Text style={sectionTitle}>🔄 Reset fin de journée</Text>
          <Text style={sectionText}>
            Le reset de journée se trouve en bas de la page principale. Il
            permet de repartir proprement pour une nouvelle journée de suivi.
          </Text>
        </View>

        <View style={sectionCard}>
          <Text style={sectionTitle}>📸 Album repas</Text>
          <Text style={sectionText}>
            Tu peux choisir d’enregistrer ou non les photos de tes repas dans
            l’album. Cette option permet de garder un historique visuel si tu le
            souhaites, ou de rester plus léger si tu préfères.
          </Text>
          <Text style={bullet}>• Enregistrement activé : les photos rejoignent l’album repas</Text>
          <Text style={bullet}>• Enregistrement désactivé : rien n’est conservé</Text>
        </View>

        <View style={sectionCard}>
          <Text style={sectionTitle}>📤 Partager une photo repas</Text>
          <Text style={sectionText}>
            Depuis l’album repas, fais un appui long sur une image pour ouvrir
            les options de partage.
          </Text>
        </View>

        <View style={sectionCard}>
          <Text style={sectionTitle}>📈 Suivi sur plusieurs jours</Text>
          <Text style={sectionText}>
            Body Diet ne sert pas seulement à voir un repas. L’application te
            permet aussi de garder une logique de suivi sur plusieurs jours pour
            mieux repérer ta régularité.
          </Text>
          <Text style={hintText}>
            L’important est la cohérence dans le temps, pas la perfection sur un
            seul repas.
          </Text>
        </View>

        <View style={sectionCard}>
          <Text style={sectionTitle}>💬 BodyMind</Text>
          <Text style={sectionText}>
            Utilise BodyMind pour poser tes questions sport et nutrition. C’est
            ton espace rapide pour obtenir un éclairage sur ton alimentation,
            ton entraînement ou ta logique de progression.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#111827",
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: "rgba(96,165,250,0.18)",
            marginTop: 8,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
            Fonctions Premium
          </Text>

          <Text style={{ color: "#cbd5e1", marginTop: 10, lineHeight: 21 }}>
            Body Diet Premium donne accès aux fonctions les plus avancées de
            l’application.
          </Text>

          <Text style={premiumLine}>• Body Scan 3D</Text>
          <Text style={premiumLine}>• Body Repas</Text>
          <Text style={premiumLine}>• Scan repas illimité</Text>
          <Text style={premiumLine}>• Outils avancés de progression</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const sectionCard = {
  backgroundColor: "#0f172a",
  borderRadius: 18,
  padding: 16,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.06)",
  marginBottom: 14,
};

const sectionTitle = {
  color: "#fff",
  fontSize: 18,
  fontWeight: "800" as const,
};

const sectionText = {
  color: "#cbd5e1",
  marginTop: 10,
  lineHeight: 21,
};

const hintText = {
  color: "#93C5FD",
  marginTop: 10,
  lineHeight: 20,
  fontWeight: "700" as const,
};

const bullet = {
  color: "#fff",
  marginTop: 8,
  fontWeight: "700" as const,
};

const premiumLine = {
  color: "#fff",
  marginTop: 8,
  fontWeight: "700" as const,
};