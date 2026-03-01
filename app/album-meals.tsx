import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { loadLog, LogEntry } from "../storage/bodyStore";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

export default function AlbumMeals() {
  const router = useRouter();
  const [meals, setMeals] = useState<LogEntry[]>([]);

  useEffect(() => {
    (async () => {
      const log = await loadLog();
      setMeals(log.filter((m) => m.photo));
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>
          ALBUM REPAS
        </Text>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#60a5fa", marginTop: 6 }}>Retour</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={meals}
        keyExtractor={(item) => String(item.t)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View
            style={{
              marginBottom: 16,
              borderRadius: 14,
              overflow: "hidden",
              backgroundColor: "#111827",
            }}
          >
            {item.photo && (
              <Image
                source={{ uri: `data:image/jpeg;base64,${item.photo}` }}
                style={{ width: "100%", height: 200 }}
              />
            )}

            <View style={{ padding: 12 }}>
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                {fmtDate(item.t)}
              </Text>

              <Text style={{ color: "#fff", marginTop: 4 }}>
                {item.p}P • {item.carb}G • {item.f}L • {item.c} kcal
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}