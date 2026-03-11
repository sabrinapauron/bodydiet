import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
   ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

import {
  TRAINING_DIAGNOSTICS,
  DiagnosticCase,
} from "../../lib/trainingDiagnostics";

import {
  startDiagnosticTest,
  getDiagnosticTest,
} from "../../storage/trainingDiagnosticStore";

const SERVER_URL = "http://192.168.1.45:4000";
export default function DiagnosticTrainingScreen() {
  const router = useRouter();

  const [selected, setSelected] = useState<DiagnosticCase | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any[] | null>(null);
  const [testState, setTestState] = useState<any | null>(null);
const [loadingAi, setLoadingAi] = useState(false);
const [bodyMindReply, setBodyMindReply] = useState<any | null>(null);
  function answer(qid: string, value: any) {
    setAnswers((prev) => ({
      ...prev,
      [qid]: value,
    }));
  }

  async function runDiagnostic() {
  if (!selected) return;

  if (selected.id === "bodymind_ai") {
    const problem = String(answers.problem || "").trim();

    if (!problem) return;

    try {
      setLoadingAi(true);
      setBodyMindReply(null);
      setResult(null);

      const resp = await fetch(`${SERVER_URL}/bodymind-diagnostic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ problem }),
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

      setResult([
        {
          id: "bodymind_analysis",
          label: "Analyse personnalisée BodyMind",
          score: 100,
        },
      ]);
    } catch (e) {
      setBodyMindReply({
        title: "Erreur de connexion",
        summary: "Le serveur n’a pas répondu.",
        likelyCause: "Connexion ou route serveur",
        explanation: "Vérifie l’URL du serveur et que la route /bodymind-diagnostic tourne bien.",
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

    return;
  }

  const scores = selected.computeScores(answers);
  setResult(scores);
}

  async function startTest() {
    if (!selected) return;

    const state = await startDiagnosticTest(selected.id);
    setTestState(state);
  }

  function resetDiagnostic() {
  setSelected(null);
  setAnswers({});
  setResult(null);
  setTestState(null);
  setBodyMindReply(null);
  setLoadingAi(false);
}

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
          Diagnostic entraînement
        </Text>

        <Text
          style={{
            color: "#94a3b8",
            marginTop: 8,
            lineHeight: 20,
          }}
        >
          Identifier ce qui peut freiner ta progression et tester une
          solution pendant 14 jours.
        </Text>

        {!selected && (
          <View style={{ marginTop: 20 }}>
            {TRAINING_DIAGNOSTICS.map((d) => (
              <TouchableOpacity
                key={d.id}
                onPress={async () => {
  setSelected(d);
  setAnswers({});
  setResult(null);
  setBodyMindReply(null);
  setLoadingAi(false);

  const state = await getDiagnosticTest(d.id);
  setTestState(state);
}}
                style={{
                  marginTop: 10,
                  padding: 16,
                  borderRadius: 18,
                  backgroundColor: "#020617",
                  borderWidth: 1,
                  borderColor: "#1f2937",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "900",
                    fontSize: 16,
                  }}
                >
                  {d.title}
                </Text>

                <Text
                  style={{
                    color: "#94a3b8",
                    marginTop: 4,
                  }}
                >
                  {d.category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selected && !result && (
          <View style={{ marginTop: 20 }}>
            <Text
              style={{
                color: "#38BDF8",
                fontWeight: "900",
                fontSize: 14,
              }}
            >
              {selected.title}
            </Text>

            <Text
              style={{
                color: "#94a3b8",
                marginTop: 6,
                marginBottom: 10,
              }}
            >
              {selected.intro}
            </Text>

            {selected.questions.map((q) => (
              <View
                key={q.id}
                style={{
                  marginTop: 12,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: "#020617",
                  borderWidth: 1,
                  borderColor: "#1f2937",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {q.label}
                </Text>

                <View style={{ marginTop: 10 }}>
                  {q.type === "boolean" && (
                    <>
                      <TouchableOpacity
                        onPress={() => answer(q.id, true)}
                        style={{
                          marginTop: 6,
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          backgroundColor:
                            answers[q.id] === true ? "#22c55e" : "#111827",
                          borderWidth: 1,
                          borderColor:
                            answers[q.id] === true ? "#22c55e" : "#1f2937",
                        }}
                      >
                        <Text
                          style={{
                            color:
                              answers[q.id] === true ? "#0b1220" : "#cbd5e1",
                            fontWeight: "700",
                          }}
                        >
                          Oui
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => answer(q.id, false)}
                        style={{
                          marginTop: 6,
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          backgroundColor:
                            answers[q.id] === false ? "#22c55e" : "#111827",
                          borderWidth: 1,
                          borderColor:
                            answers[q.id] === false ? "#22c55e" : "#1f2937",
                        }}
                      >
                        <Text
                          style={{
                            color:
                              answers[q.id] === false ? "#0b1220" : "#cbd5e1",
                            fontWeight: "700",
                          }}
                        >
                          Non
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {q.type === "choice" &&
                    q.options.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => answer(q.id, opt.value)}
                        style={{
                          marginTop: 6,
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          backgroundColor:
                            answers[q.id] === opt.value ? "#22c55e" : "#111827",
                          borderWidth: 1,
                          borderColor:
                            answers[q.id] === opt.value ? "#22c55e" : "#1f2937",
                        }}
                      >
                        <Text
                          style={{
                            color:
                              answers[q.id] === opt.value
                                ? "#0b1220"
                                : "#cbd5e1",
                            fontWeight: "700",
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}

                  {q.type === "text" && (
                    <TextInput
                      value={answers[q.id] ?? ""}
                      onChangeText={(text) => answer(q.id, text)}
                      placeholder="Décris ton problème ici"
                      placeholderTextColor="#64748b"
                      multiline
                      textAlignVertical="top"
                      style={{
                        marginTop: 6,
                        minHeight: 120,
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        backgroundColor: "#111827",
                        borderWidth: 1,
                        borderColor: "#1f2937",
                        color: "#fff",
                      }}
                    />
                  )}
                </View>
              </View>
            ))}

            <TouchableOpacity
  onPress={loadingAi ? undefined : runDiagnostic}
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
      {selected?.id === "bodymind_ai" ? "Lancer l’analyse IA" : "Lancer le diagnostic"}
    </Text>
  )}
</TouchableOpacity>
          </View>
        )}

        {selected && result && (
          <View style={{ marginTop: 20 }}>
            <TouchableOpacity
              onPress={resetDiagnostic}
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
                ← Choisir un autre diagnostic
              </Text>
            </TouchableOpacity>

            {selected?.id !== "bodymind_ai" ? (
  <>
    <Text
      style={{
        color: "#22c55e",
        fontWeight: "900",
        fontSize: 18,
      }}
    >
      Cause principale probable
    </Text>

    <Text
      style={{
        color: "#fff",
        fontSize: 18,
        fontWeight: "900",
        marginTop: 6,
      }}
    >
      {result[0].label}
    </Text>

    <Text style={{ color: "#94a3b8", marginTop: 4 }}>
      Probabilité estimée
    </Text>

    <View
      style={{
        marginTop: 6,
        height: 8,
        borderRadius: 999,
        backgroundColor: "#1f2937",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${result[0].score}%`,
          height: 8,
          backgroundColor: "#22c55e",
        }}
      />
    </View>

    <Text style={{ color: "#94a3b8", marginTop: 4 }}>
      {result[0].score}%
    </Text>
  </>
) : (
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
)}
            
           {selected?.id === "bodymind_ai" && bodyMindReply && (
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
        <Text key={i} style={{ color: "#cbd5e1", marginTop: 8, lineHeight: 20 }}>
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
        <Text key={i} style={{ color: "#e5e7eb", marginTop: 8, lineHeight: 20 }}>
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
)}

            <View style={{ marginTop: 12 }}>
              {result.slice(1, 3).map((c) => (
                <Text key={c.id} style={{ color: "#cbd5e1" }}>
                  {c.label} — {c.score}%
                </Text>
              ))}
            </View>

           {/* CORRECTION */}
{selected?.id !== "bodymind_ai" && (
  <View style={{ marginTop: 16 }}>
    <Text style={{ color: "#22c55e", fontWeight: "800" }}>
      Correction
    </Text>

    {selected.correction.map((c, i) => (
      <Text key={i} style={{ color: "#cbd5e1", marginTop: 4 }}>
        • {c}
      </Text>
    ))}
  </View>
)}

{/* TEST 14 JOURS */}
{selected?.id !== "bodymind_ai" && (
  <>
    <View style={{ marginTop: 16 }}>
      <Text style={{ color: "#22c55e", fontWeight: "800" }}>
        Test recommandé (14 jours)
      </Text>

      {testState && (
        <View
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            backgroundColor: "#111827",
            borderWidth: 1,
            borderColor: "#1f2937",
          }}
        >
          <Text style={{ color: "#22c55e", fontWeight: "800" }}>
            Test en cours
          </Text>

          <Text style={{ color: "#cbd5e1", marginTop: 4 }}>
            Jour {testState.dayNumber} / 14
          </Text>
        </View>
      )}

      {selected.test14Days.map((c, i) => (
        <Text key={i} style={{ color: "#cbd5e1", marginTop: 4 }}>
          • {c}
        </Text>
      ))}
    </View>

    <TouchableOpacity
      onPress={testState?.isActive ? undefined : startTest}
      style={{
        marginTop: 18,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: testState?.isActive ? "#1f2937" : "#22c55e",
      }}
    >
      <Text
        style={{
          textAlign: "center",
          fontWeight: "900",
          color: testState?.isActive ? "#94a3b8" : "#020617",
        }}
      >
        {testState?.isActive ? "Test en cours" : "J’ai testé"}
      </Text>
    </TouchableOpacity>
  </>
)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}