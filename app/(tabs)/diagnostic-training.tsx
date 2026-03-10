import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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

export default function DiagnosticTrainingScreen() {
  const router = useRouter();

  const [selected, setSelected] = useState<DiagnosticCase | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any[] | null>(null);
  const [testState, setTestState] = useState<any | null>(null);

  function answer(qid: string, value: any) {
    setAnswers((prev) => ({
      ...prev,
      [qid]: value,
    }));
  }

  function runDiagnostic() {
    if (!selected) return;

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
                </View>
              </View>
            ))}

            <TouchableOpacity
              onPress={runDiagnostic}
              style={{
                marginTop: 18,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: "#ffffff",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "900",
                  color: "#0b1220",
                }}
              >
                Lancer le diagnostic
              </Text>
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

            <View style={{ marginTop: 12 }}>
              {result.slice(1, 3).map((c) => (
                <Text key={c.id} style={{ color: "#cbd5e1" }}>
                  {c.label} — {c.score}%
                </Text>
              ))}
            </View>

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
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}