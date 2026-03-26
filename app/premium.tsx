import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  getPremiumPackages,
  purchasePackage,
  restorePurchases,
} from "../lib/revenuecat";

export default function PremiumScreen() {
  const router = useRouter();
  const [annualPackage, setAnnualPackage] = useState<any | null>(null);
  const [lifetimePackage, setLifetimePackage] = useState<any | null>(null);
  const [buying, setBuying] = useState(false);

useEffect(() => {
  (async () => {
    const { annual, lifetime } = await getPremiumPackages();

    console.log("ANNUAL ID =", annual?.product?.identifier);
    console.log("ANNUAL PRICE =", annual?.product?.priceString);
    console.log("ANNUAL TYPE =", annual?.packageType);

    console.log("LIFETIME ID =", lifetime?.product?.identifier);
    console.log("LIFETIME PRICE =", lifetime?.product?.priceString);
    console.log("LIFETIME TYPE =", lifetime?.packageType);

    setAnnualPackage(annual);
    setLifetimePackage(lifetime);
  })();
}, []);

  const offersLoading = !annualPackage && !lifetimePackage && !buying;

  async function handleSubscribeAnnual() {
    try {
      setBuying(true);

      if (!annualPackage) {
        Alert.alert("Offre indisponible", "Le plan annuel n'a pas été trouvé.");
        return;
      }

      const success = await purchasePackage(annualPackage);

      if (success) {
        Alert.alert("Abonnement activé", "Body Diet Premium annuel est maintenant débloqué.");
        router.back();
      } else {
        Alert.alert("Achat non finalisé", "L'abonnement annuel n'a pas été activé.");
      }
    } catch {
      Alert.alert("Erreur", "Impossible de lancer l'abonnement annuel.");
    } finally {
      setBuying(false);
    }
  }

  async function handleSubscribeLifetime() {
    try {
      setBuying(true);

      if (!lifetimePackage) {
        Alert.alert("Offre indisponible", "Le plan à vie n'a pas été trouvé.");
        return;
      }

      const success = await purchasePackage(lifetimePackage);

      if (success) {
        Alert.alert("Accès activé", "Body Diet Premium à vie est maintenant débloqué.");
        router.back();
      } else {
        Alert.alert("Achat non finalisé", "L'accès à vie n'a pas été activé.");
      }
    } catch {
      Alert.alert("Erreur", "Impossible de lancer l'achat à vie.");
    } finally {
      setBuying(false);
    }
  }

  async function handleRestore() {
    try {
      setBuying(true);
      const restored = await restorePurchases();

      if (restored) {
        Alert.alert("Achats restaurés", "Votre accès Premium a bien été réactivé.");
        router.back();
      } else {
        Alert.alert("Aucun achat trouvé", "Aucun achat actif n'a été retrouvé.");
      }
    } catch {
      Alert.alert("Erreur", "Impossible de restaurer les achats.");
    } finally {
      setBuying(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a1235" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text
          style={{
            color: "#fff",
            fontSize: 26,
            fontWeight: "900",
            textAlign: "center",
            marginTop: 12,
          }}
        >
          Body Diet Premium
        </Text>

        <Text
          style={{
            color: "#94a3b8",
            textAlign: "center",
            marginTop: 10,
            lineHeight: 20,
            fontSize: 15,
          }}
        >
          Débloque l’expérience complète : Body Scan 3D, scans repas illimités
          et outils premium Body Diet.
        </Text>

        {offersLoading && (
          <Text
            style={{
              color: "#94a3b8",
              textAlign: "center",
              marginTop: 12,
              fontSize: 13,
            }}
          >
            Chargement des offres…
          </Text>
        )}
        <Text style={{ color: "#fff", textAlign: "center", marginTop: 8 }}>
  Annual: {annualPackage ? "OK" : "NULL"} | Lifetime: {lifetimePackage ? "OK" : "NULL"}
</Text>

        <View
          style={{
            marginTop: 22,
            padding: 14,
            borderRadius: 18,
            backgroundColor: "#020617",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 17 }}>
            Ce que débloque Premium
          </Text>

          <Text style={{ color: "#cbd5e1", marginTop: 12, lineHeight: 22 }}>
            📸 Scan repas illimité
          </Text>
          <Text style={{ color: "#cbd5e1", marginTop: 6, lineHeight: 22 }}>
            🧠 Body Scan 3D - analyse de ton corps et de ton potentiel
          </Text>
          <Text style={{ color: "#cbd5e1", marginTop: 6, lineHeight: 22 }}>
            🍽 Repas optimisés Body Diet
          </Text>
          <Text style={{ color: "#cbd5e1", marginTop: 6, lineHeight: 22 }}>
            📈 BodyMind - tes diagnostiques illimités
          </Text>
        </View>

        <View
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 18,
            backgroundColor: "#020617",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
            Offre annuelle
          </Text>
          <Text style={{ color: "#94a3b8", marginTop: 8, lineHeight: 20 }}>
            Idéal pour profiter de toutes les fonctions premium pendant 1 an.
          </Text>
          <Text
            style={{
              color: "#22c55e",
              marginTop: 8,
              fontWeight: "900",
              fontSize: 15,
            }}
          >
            19 € / an
          </Text>

          <TouchableOpacity
            onPress={handleSubscribeAnnual}
            disabled={buying || !annualPackage}
            style={{
              marginTop: 14,
              backgroundColor: "#ffffff",
              paddingVertical: 12,
              borderRadius: 16,
              alignItems: "center",
              opacity: buying || !annualPackage ? 0.6 : 1,
            }}
          >
            <Text style={{ color: "#0b1220", fontWeight: "900" }}>
              🔓 Activer l’abonnement annuel
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 18,
            backgroundColor: "#020617",
            borderWidth: 1,
            borderColor: "#22c55e",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
            Accès à vie
          </Text>
          <Text style={{ color: "#94a3b8", marginTop: 8, lineHeight: 20 }}>
            Un seul paiement pour garder Body Diet Premium sans abonnement.
          </Text>
          <Text
            style={{
              color: "#22c55e",
              marginTop: 8,
              fontWeight: "900",
              fontSize: 15,
            }}
          >
            39 € paiement unique
          </Text>

          <TouchableOpacity
            onPress={handleSubscribeLifetime}
            disabled={buying || !lifetimePackage}
            style={{
              marginTop: 14,
              backgroundColor: "#ffffff",
              paddingVertical: 12,
              borderRadius: 16,
              alignItems: "center",
              opacity: buying || !lifetimePackage ? 0.6 : 1,
            }}
          >
            <Text style={{ color: "#0b1220", fontWeight: "900" }}>
              ⭐ Activer l’accès à vie
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleRestore}
          disabled={buying}
          style={{
            marginTop: 22,
            alignItems: "center",
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: "#38BDF8", fontWeight: "800", fontSize: 15 }}>
            Restaurer mes achats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 8,
            alignItems: "center",
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: "#94a3b8", fontWeight: "800" }}>← Retour</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}