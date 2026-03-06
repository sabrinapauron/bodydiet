import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View, TextInput } from "react-native";
import {
  type EffortEntry,
  type EffortIntensity,
  type EffortLinearType,
  loadCoachWeeklyMission,
} from "../storage/bodyStore";

type Props = {
  visible: boolean;
  initial: EffortEntry | null;
  onClose: () => void;
  onSave: (effort: EffortEntry | null) => void;
};

const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: active ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)",
      backgroundColor: active ? "rgba(255,255,255,0.10)" : "rgba(17,24,39,1)",
      marginRight: 10,
      marginBottom: 10,
    }}
  >
    <Text style={{ color: "#fff", fontWeight: "800" }}>{label}</Text>
  </TouchableOpacity>
);

export default function EffortModal({ visible, initial, onClose, onSave }: Props) {
  const initialKind = initial?.kind ?? "linear";

  const [kind, setKind] = useState<"linear" | "gym">(initialKind);
  const [intensity, setIntensity] = useState<EffortIntensity>(initial?.intensity ?? "moderate");

  const [linearType, setLinearType] = useState<EffortLinearType>(
    initial?.kind === "linear" ? initial.type : "run"
  );
  const [km, setKm] = useState<string>(initial?.kind === "linear" ? String(initial.km) : "");
  const [minutes, setMinutes] = useState<string>(initial?.kind === "gym" ? String(initial.minutes) : "");
  const [coachMission, setCoachMission] = useState<string | null>(null);

  useEffect(() => {
    const loadMission = async () => {
      const m = await loadCoachWeeklyMission();
      setCoachMission(m?.text ?? null);
    };

    loadMission();
  }, []);

  // reset quand on ouvre sur un initial différent
  useEffect(() => {
    setKind(initial?.kind ?? "linear");
    setIntensity(initial?.intensity ?? "moderate");
    setLinearType(initial?.kind === "linear" ? initial.type : "run");
    setKm(initial?.kind === "linear" ? String(initial.km) : "");
    setMinutes(initial?.kind === "gym" ? String(initial.minutes) : "");
  }, [visible, initial?.kind, initial?.ts]);

  const canSave = useMemo(() => {
    if (kind === "linear") return Number(km) > 0;
    return Number(minutes) > 0;
  }, [kind, km, minutes]);

  const handleSave = () => {
    const ts = Date.now();

    if (!canSave) return;

    if (kind === "linear") {
      onSave({
        kind: "linear",
        km: Math.round(Number(km) * 10) / 10,
        type: linearType,
        intensity,
        ts,
      });
    } else {
      onSave({
        kind: "gym",
        minutes: Math.round(Number(minutes)),
        intensity,
        ts,
      });
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", padding: 18 }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#0b1220",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#1f2937",
            padding: 14,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Effort du jour</Text>
          <Text style={{ color: "#94a3b8", marginTop: 6 }}>
            Ajuste tes macros automatiquement (prudence 70%).
          </Text>

          {coachMission && (
            <View
              style={{
                marginTop: 14,
                marginBottom: 4,
                padding: 12,
                borderRadius: 12,
                backgroundColor: "#111827",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>Mission Coach BodyDiet</Text>

              <Text style={{ color: "#94a3b8", marginTop: 4 }}>{coachMission}</Text>
            </View>
          )}

          {/* Choix type */}
          <View style={{ flexDirection: "row", marginTop: 14 }}>
            <Chip label="Linéaire" active={kind === "linear"} onPress={() => setKind("linear")} />
            <Chip label="Salle" active={kind === "gym"} onPress={() => setKind("gym")} />
          </View>

          {/* Linéaire */}
          {kind === "linear" && (
            <>
              <Text style={{ color: "#fff", fontWeight: "900", marginTop: 6 }}>Sport</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
                <Chip label="Course" active={linearType === "run"} onPress={() => setLinearType("run")} />
                <Chip label="Marche" active={linearType === "walk"} onPress={() => setLinearType("walk")} />
                <Chip label="Vélo" active={linearType === "bike"} onPress={() => setLinearType("bike")} />
              </View>

              <Text style={{ color: "#fff", fontWeight: "900", marginTop: 6 }}>Kilomètres</Text>
              <TextInput
                value={km}
                onChangeText={setKm}
                keyboardType="decimal-pad"
                placeholder="ex: 3.5"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={{
                  marginTop: 8,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: "#111827",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              />
            </>
          )}

          {/* Salle */}
          {kind === "gym" && (
            <>
              <Text style={{ color: "#fff", fontWeight: "900", marginTop: 6 }}>Durée (minutes)</Text>
              <TextInput
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
                placeholder="ex: 60"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={{
                  marginTop: 8,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: "#111827",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              />
            </>
          )}

          {/* Intensité */}
          <Text style={{ color: "#fff", fontWeight: "900", marginTop: 14 }}>Intensité</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
            <Chip label="Léger" active={intensity === "light"} onPress={() => setIntensity("light")} />
            <Chip label="Modéré" active={intensity === "moderate"} onPress={() => setIntensity("moderate")} />
            <Chip label="Intense" active={intensity === "intense"} onPress={() => setIntensity("intense")} />
          </View>

          {/* Actions */}
          <View style={{ flexDirection: "row", marginTop: 14 }}>
            <TouchableOpacity
              onPress={() => onSave(null)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "#111827",
                marginRight: 10,
              }}
            >
              <Text style={{ textAlign: "center", color: "#fff", fontWeight: "900" }}>Supprimer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: canSave ? "#ffffff" : "rgba(255,255,255,0.25)",
              }}
            >
              <Text style={{ textAlign: "center", color: "#0b1220", fontWeight: "900" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}