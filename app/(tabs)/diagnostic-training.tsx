import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

import {
  canUseBodyMind,
  incrementBodyMindCount,
  getBodyMindCount,
  FREE_BODYMIND_LIMIT,
} from "../../storage/usageLimits";

const SERVER_URL = "http://192.168.1.45:4000";

export default function DiagnosticTrainingScreen() {
  const router = useRouter();

  // Remplace plus tard par ton vrai statut premium
  const isPremium = false;

  const [problem, setProblem] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [bodyMindReply, setBodyMindReply] = useState<any | null>(null);
  const [bodyMindCount, setBodyMindCount] = useState(0);

  useEffect(() => {
    (async () => {
      const count = await getBodyMindCount();
      setBodyMindCount(count);
    })();
  }, []);

  async function runBodyMind() {
    const cleanProblem = problem.trim();

    if (!cleanProblem) return;

    const allowed = await canUseBodyMind(isPremium);

    if (!allowed) {
      Alert.alert(
        "Limite atteinte",
        "Tu as utilisé tes analyses gratuites. Passe en Premium pour continuer à utiliser BodyMind."
      );
      return;
    }

    try {
      setLoadingAi(true);
      setBodyMindReply(null);

      const resp = await fetch(`${SERVER_URL}/bodymind-diagnostic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ problem: cleanProblem }),
      });

      const json = await resp.json();

      if (!json?.ok || !json?.data) {
        setBodyMindReply({
          title: "Analyse indisponible",
          summary: "L’IA n’a pas pu répondre correctement pour le moment.",
          likelyCause: "Impossible à déterminer",
          explanation: "Réessaie avec une description un peu plus précise.",
          checks: [
            "Précise depuis quand le problème est présent.",
            "Précise sur quel exercice ou situation ça arrive.",
            "Précise si c’est une gêne, une douleur ou une stagnation.",
          ],
          actions: [
            "Teste un seul ajustement à la fois.",
            "Observe tes sensations sur quelques séances.",
            "Évite de tout changer d’un coup.",
          ],
          warning: "",
          motivation: "On affine souvent mieux avec une description plus précise.",
        });
        return;
      }

      setBodyMindReply(json.data);
      if (!isPremium) {
  const nextCount = await incrementBodyMindCount();
  setBodyMindCount(nextCount);
}

      // On incrémente seulement si la réponse a bien marché
      if (!isPremium) {
        const nextCount = await incrementBodyMindCount();
        setBodyMindCount(nextCount);
      }
    } catch (e) {
      setBodyMindReply({
        title: "Erreur de connexion",
        summary: "Le serveur n’a pas répondu.",
        likelyCause: "Connexion ou route serveur",
        explanation:
          "Vérifie l’URL du serveur et que la route /bodymind-diagnostic tourne bien.",
        checks: [
          "Vérifie SERVER_URL.",
          "Vérifie que le serveur tourne.",
          "Vérifie les logs serveur.",
        ],
        actions: [
          "Relance le serveur.",
          "Teste la route manuellement.",
          "Réessaie ensuite depuis l’app.",
        ],
        warning: "",
        motivation: "Une fois la route branchée, BodyMind répondra normalement.",
      });
    } finally {
      setLoadingAi(false);
    }
  }

  function resetAnalysis() {
    setProblem("");
    setBodyMindReply(null);
    setLoadingAi(false);
  }

  const remainingFree = Math.max(0, FREE_BODYMIND_LIMIT - bodyMindCount);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a1235" }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: 28,
          paddingBottom: 40,
        }}
      >
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

        <Text
          style={{
            color: "#fff",
            fontSize: 22,
            fontWeight: "900",
          }}
        >
          Diagnostic entraînement IA
        </Text>

        <Text
          style={{
            color: "#94a3b8",
            marginTop: 8,
            lineHeight: 20,
          }}
        >
          Décris librement ton blocage, ta stagnation, une douleur suspecte, un
          problème de récupération ou une question sur ton entraînement.
          BodyMind, l’IA spécialisée fitness, te répond.
        </Text>

        {!isPremium && (
          <Text
            style={{
              color: "#38BDF8",
              marginTop: 10,
              fontWeight: "800",
            }}
          >
         Il te reste {Math.max(0, FREE_BODYMIND_LIMIT - bodyMindCount)} analyses BodyMind gratuites
  </Text>
)}

        {!bodyMindReply && (
          <View style={{ marginTop: 20 }}>
            <View
              style={{
                padding: 14,
                borderRadius: 14,
                backgroundColor: "#020617",
                borderWidth: 1,
                borderColor: "#1f2937",
              }}
            >
              <Text style={{ color: "#38BDF8", fontWeight: "900", fontSize: 14 }}>
                ✨ IA BodyMind
              </Text>

              <Text style={{ color: "#94a3b8", marginTop: 6, lineHeight: 20 }}>
                Exemple : "Je stagne sur les bras malgré 3 séances", "J’ai mal
                au bas du dos au squat", "Je progresse puis je rechute chaque
                semaine".
              </Text>

              <TextInput
                value={problem}
                onChangeText={setProblem}
                placeholder="Décris ton problème ici"
                placeholderTextColor="#64748b"
                multiline
                textAlignVertical="top"
                style={{
                  marginTop: 12,
                  minHeight: 140,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: "#111827",
                  borderWidth: 1,
                  borderColor: "#1f2937",
                  color: "#fff",
                }}
              />
            </View>

            <TouchableOpacity
              onPress={loadingAi ? undefined : runBodyMind}
              style={{
                marginTop: 18,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: loadingAi ? "#cbd5e1" : "#ffffff",
                opacity: loadingAi ? 0.8 : 1,
              }}
            >
              {loadingAi ? (
                <ActivityIndicator color="#0b1220" />
              ) : (
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "900",
                    color: "#0b1220",
                  }}
                >
                  Lancer l’analyse IA
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {bodyMindReply && (
          <View style={{ marginTop: 20 }}>
            <TouchableOpacity
              onPress={resetAnalysis}
              style={{
                alignSelf: "flex-start",
                marginBottom: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: "#111827",
                borderWidth: 1,
                borderColor: "#1f2937",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                ← Nouvelle analyse
              </Text>
            </TouchableOpacity>

            <View
              style={{
                marginTop: 2,
                padding: 14,
                borderRadius: 16,
                backgroundColor: "rgba(56,189,248,0.08)",
                borderWidth: 1,
                borderColor: "rgba(56,189,248,0.28)",
              }}
            >
              <Text
                style={{
                  color: "#38BDF8",
                  fontWeight: "900",
                  fontSize: 16,
                  letterSpacing: 0.4,
                }}
              >
                ✨ Analyse IA BodyMind
              </Text>

              <Text
                style={{
                  color: "#cbd5e1",
                  marginTop: 6,
                  lineHeight: 20,
                }}
              >
                Lecture personnalisée à partir de ta description.
              </Text>
            </View>

            <View
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 16,
                backgroundColor: "#111827",
                borderWidth: 1,
                borderColor: "rgba(56,189,248,0.25)",
              }}
            >
              <View
                style={{
                  alignSelf: "flex-start",
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: "rgba(56,189,248,0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(56,189,248,0.25)",
                }}
              >
                <Text style={{ color: "#38BDF8", fontWeight: "900", fontSize: 12 }}>
                  BODYMIND • LECTURE PERSONNALISÉE
                </Text>
              </View>

              <Text
                style={{
                  color: "#fff",
                  fontWeight: "900",
                  fontSize: 20,
                  marginTop: 12,
                }}
              >
                {bodyMindReply.title}
              </Text>

              <Text style={{ color: "#cbd5e1", marginTop: 8, lineHeight: 21 }}>
                {bodyMindReply.summary}
              </Text>

              <View
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: "rgba(34,197,94,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(34,197,94,0.18)",
                }}
              >
                <Text style={{ color: "#22c55e", fontWeight: "900" }}>
                  Cause probable
                </Text>
                <Text style={{ color: "#e5e7eb", marginTop: 6, lineHeight: 20 }}>
                  {bodyMindReply.likelyCause}
                </Text>
              </View>

              <View
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >
                <Text style={{ color: "#22c55e", fontWeight: "900" }}>
                  Explication
                </Text>
                <Text style={{ color: "#cbd5e1", marginTop: 6, lineHeight: 20 }}>
                  {bodyMindReply.explanation}
                </Text>
              </View>

              <View
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >
                <Text style={{ color: "#22c55e", fontWeight: "900" }}>
                  Vérifications utiles
                </Text>

                {bodyMindReply.checks?.map((item: string, i: number) => (
                  <Text
                    key={i}
                    style={{ color: "#cbd5e1", marginTop: 8, lineHeight: 20 }}
                  >
                    • {item}
                  </Text>
                ))}
              </View>

              <View
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: "rgba(56,189,248,0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(56,189,248,0.18)",
                }}
              >
                <Text style={{ color: "#38BDF8", fontWeight: "900" }}>
                  Actions à tester
                </Text>

                {bodyMindReply.actions?.map((item: string, i: number) => (
                  <Text
                    key={i}
                    style={{ color: "#e5e7eb", marginTop: 8, lineHeight: 20 }}
                  >
                    • {item}
                  </Text>
                ))}
              </View>

              {!!bodyMindReply.warning && (
                <View
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: "rgba(245,158,11,0.08)",
                    borderWidth: 1,
                    borderColor: "rgba(245,158,11,0.20)",
                  }}
                >
                  <Text style={{ color: "#f59e0b", fontWeight: "900" }}>
                    Prudence
                  </Text>
                  <Text style={{ color: "#fde68a", marginTop: 6, lineHeight: 20 }}>
                    {bodyMindReply.warning}
                  </Text>
                </View>
              )}

              <View
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: "rgba(255,255,255,0.06)",
                }}
              >
                <Text
                  style={{
                    color: "#38BDF8",
                    lineHeight: 20,
                    fontWeight: "800",
                  }}
                >
                  {bodyMindReply.motivation}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}