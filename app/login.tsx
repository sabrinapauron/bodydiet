import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";

import { saveAuthUser } from "../storage/auth";
import { loginRevenueCat } from "../lib/revenuecat";

function makeUserIdFromEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

const handleLogin = async () => {
  if (loading) return;

  const cleanEmail = email.trim().toLowerCase();

  if (!isValidEmail(cleanEmail)) {
    Alert.alert("Adresse invalide", "Entre une adresse email valide.");
    return;
  }

  const user = {
    id: makeUserIdFromEmail(cleanEmail),
    email: cleanEmail,
  };

  try {
    setLoading(true);

    await loginRevenueCat(user.id);
    await saveAuthUser(user);

    router.replace("/onboarding");
  } catch (error) {
    console.log("❌ login error", error);
    Alert.alert(
      "Connexion impossible",
      "Un problème est survenu pendant la connexion. Réessaie."
    );
  } finally {
    setLoading(false);
  }
};
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
      <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
        <Text
          style={{
            color: "#fff",
            fontSize: 28,
            fontWeight: "900",
            marginBottom: 8,
          }}
        >
          Connexion
        </Text>

        <Text
          style={{
            color: "#94A3B8",
            lineHeight: 21,
            marginBottom: 18,
          }}
        >
          Connecte-toi avec ton compte Body Diet pour retrouver ton premium.
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Adresse email"
          placeholderTextColor="#64748B"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!loading}
          style={{
            backgroundColor: "#111827",
            color: "#fff",
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />

        <TouchableOpacity
          onPress={handleLogin}
          activeOpacity={0.9}
          disabled={loading}
          style={{
            marginTop: 16,
            backgroundColor: loading ? "#1D4ED8" : "#2563EB",
            paddingVertical: 15,
            borderRadius: 14,
            alignItems: "center",
            opacity: loading ? 0.8 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
              Continuer
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}