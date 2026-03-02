import React, { useState,useRef  } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Pressable,

} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { loadLog, LogEntry, clearMealPhotos, removeMealPhoto, renameMeal } from "../storage/bodyStore";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";

export default function AlbumMeals() {
  const router = useRouter();
  const [meals, setMeals] = useState<LogEntry[]>([]);
const [renameOpen, setRenameOpen] = useState(false);
const [renameValue, setRenameValue] = useState("");
const [renameTargetTs, setRenameTargetTs] = useState<number | null>(null);
const [shareOpen, setShareOpen] = useState(false);
const [shareItem, setShareItem] = useState<LogEntry | null>(null);
const shareRef = useRef<View>(null);

const openShare = (item: LogEntry) => {
  setShareItem(item);
  setShareOpen(true);
};
// ✅ recharge la liste depuis storage (utile après delete/rename)
const refreshMeals = async () => {
  const log = await loadLog();
  setMeals(log.filter((m) => m.photo));
};

// ✅ ouvre le modal rename
const openRename = (item: LogEntry) => {
  setRenameTargetTs(item.t);
  setRenameValue(String((item as any).title ?? deriveTitle(item)) || "");
  setRenameOpen(true);
};

// ✅ sauvegarde rename
const confirmRename = async () => {
  const t = renameTargetTs;
  const nextTitle = renameValue.trim();

  setRenameOpen(false);
  setRenameTargetTs(null);

  if (!t) return;
  if (!nextTitle) return;

  // update local immédiat
  setMeals((prev) =>
    prev.map((m) => (m.t === t ? ({ ...(m as any), title: nextTitle } as any) : m))
  );

  // update storage (voir bodyStore plus bas)
  await renameMeal(t, nextTitle);
};



// ✅ partage (texte simple pour l’instant)
const shareMeal = async (item: LogEntry) => {
  try {
    if (!item.photo) {
      Alert.alert("Partage", "Aucune photo à partager.");
      return;
    }

    // ✅ legacy API => cacheDirectory / documentDirectory OK
    const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!baseDir) {
      Alert.alert("Partage", "Stockage temporaire indisponible.");
      return;
    }

    const fileUri = `${baseDir}bodydiet_${item.t}.jpg`;

    const rawB64 = item.photo.includes("base64,")
      ? item.photo.split("base64,")[1]
      : item.photo;

    await FileSystem.writeAsStringAsync(fileUri, rawB64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const contentUri = await FileSystem.getContentUriAsync(fileUri);

    await IntentLauncher.startActivityAsync("android.intent.action.SEND", {
      type: "image/jpeg",
      flags: 1,
      extra: {
        "android.intent.extra.STREAM": contentUri,
      },
    });
  } catch (e) {
    console.log("shareMeal error:", e);
    Alert.alert("Partage", "Impossible de partager.");
  }
};

const confirmDeleteOne = (item: LogEntry) => {
  Alert.alert(
    "Supprimer",
    "Supprimer cette photo de l’album ?",
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          // UI immédiat
          setMeals((prev) => prev.filter((m) => m.t !== item.t));
          // storage
          await removeMealPhoto(item.t);
        },
      },
    ]
  );
};
// ✅ menu long press
const onLongPressMeal = (item: LogEntry) => {
  Alert.alert("Photo", "Que veux-tu faire ?", [
    { text: "Annuler", style: "cancel" },
    { text: "Partager", onPress: () => shareMeal(item) },
    { text: "Supprimer", style: "destructive", onPress: () => confirmDeleteOne(item) },
  ]);
};

  useFocusEffect(
  React.useCallback(() => {
    let alive = true;

    (async () => {
      const log = await loadLog();
      if (!alive) return;
      setMeals(log.filter((m) => m.photo));
    })();

    return () => {
      alive = false;
    };
  }, [])
);

  const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

const fmtTime = (t: number) =>
  new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const deriveTitle = (e: LogEntry) => {
  if (e?.title) return e.title;

  if (Array.isArray(e?.foods) && e.foods.length && !String(e.foods[0]).includes("Photo repas")) {
    return String(e.foods[0]);
  }

  // fallback “jamais ridicule”
  const p = Number(e?.p) || 0;
  const g = Number(e?.carb) || 0;
  const l = Number(e?.f) || 0;
  const c = Number(e?.c) || 0;

  if (c > 0 && c <= 220) return "Collation";
  if (p >= 25 && g <= 20) return "Assiette protéinée";
  if (g >= 45) return "Repas énergie";
  if (l >= 18) return "Repas riche";
  return c > 0 ? "Repas maison" : "Photo repas";
};
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
     <View
  style={{
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  }}
>
  {/* TITRE */}
  <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>
    ALBUM REPAS
  </Text>

  {/* POUBELLE */}
  <TouchableOpacity
    onPress={() => {
      Alert.alert(
        "Vider l’album",
        "Es-tu sûr de vouloir supprimer toutes les photos de l’album ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Vider",
            style: "destructive",
            onPress: async () => {
              await clearMealPhotos();
              const log = await loadLog();
              setMeals(log.filter((m) => m.photo));
            },
          },
        ]
      );
    }}
    style={{
    padding: 6,
    borderRadius: 8,
  }}
  >
    <Text style={{ fontSize: 20 }}>🗑️</Text>
 
  </TouchableOpacity>
</View>

   <FlatList
  data={meals}
  keyExtractor={(item) => String(item.t)}
  numColumns={2}
  columnWrapperStyle={{ gap: 12 }}
  contentContainerStyle={{ padding: 16, gap: 12 }}
  renderItem={({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={() => onLongPressMeal(item)}
      delayLongPress={250}
      style={{
        flex: 1,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#111827",
      }}
    >
      {/* IMAGE */}
      {item.photo ? (
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${item.photo}` }}
            style={{ width: "100%", height: 120 }}
          />

          {/* BADGE BODY DIET */}
          <View
            style={{
              position: "absolute",
              right: 8,
              bottom: 8,
              paddingVertical: 4,
              paddingHorizontal: 8,
              borderRadius: 999,
              backgroundColor: "rgba(2,6,23,0.65)",
              borderWidth: 1,
              borderColor: "rgba(191,167,106,0.35)",
            }}
          >
            <Text
              style={{
                color: "#e5e7eb",
                fontWeight: "900",
                fontSize: 10,
                letterSpacing: 0.6,
              }}
            >
              BODY DIET
            </Text>
          </View>
        </View>
      ) : null}

      {/* TEXTS */}
      <View style={{ padding: 10 }}>
        <Text
          style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}
          numberOfLines={1}
        >
          {deriveTitle(item)}
        </Text>

        <Text style={{ color: "#fff", opacity: 0.7, marginTop: 2, fontSize: 11 }}>
          {fmtDate(item.t)} • {fmtTime(item.t)}
        </Text>

        <Text style={{ color: "#fff", opacity: 0.9, marginTop: 4, fontSize: 11 }}>
          {item.p}P • {item.carb}G • {item.f}L • {item.c} kcal
        </Text>
      </View>
    </TouchableOpacity>
  )}
/> 

<Modal transparent visible={renameOpen} animationType="fade" onRequestClose={() => setRenameOpen(false)}>
  <Pressable
    onPress={() => setRenameOpen(false)}
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      padding: 18,
    }}
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
      <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>Renommer</Text>

      <TextInput
        value={renameValue}
        onChangeText={setRenameValue}
        placeholder="Nom du repas"
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 12,
          backgroundColor: "#111827",
          color: "#fff",
          fontSize: 16,
          fontWeight: "700",
        }}
      />

      <View style={{ flexDirection: "row", marginTop: 12 }}>
        <TouchableOpacity
          onPress={() => setRenameOpen(false)}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: "#111827",
            marginRight: 10,
          }}
        >
          <Text style={{ textAlign: "center", color: "#fff", fontWeight: "900" }}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={confirmRename}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: "#ffffff",
          }}
        >
          <Text style={{ textAlign: "center", color: "#0b1220", fontWeight: "900" }}>OK</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  </Pressable>
</Modal>
<Modal transparent visible={shareOpen} animationType="fade">
  <Pressable
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.65)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    }}
  >
    {/* Carte capturée */}
    
    <View
  ref={shareRef}
  style={{
    width: 320,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0b1220",
    borderWidth: 2,
    borderColor: "rgba(191,167,106,0.55)",
  }}
>
    
      {/* Photo */}
      {shareItem?.photo ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${shareItem.photo}` }}
          style={{ width: "100%", height: 260 }}
        />
      ) : (
        <View style={{ height: 260, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#fff", opacity: 0.7 }}>PHOTO</Text>
        </View>
      )}

      {/* Overlay watermark */}
      <View
        style={{
          position: "absolute",
          right: 10,
          bottom: 90,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: "rgba(2,6,23,0.65)",
          borderWidth: 1,
          borderColor: "rgba(191,167,106,0.5)",
        }}
      >
        <Text style={{ color: "#e5e7eb", fontWeight: "900", letterSpacing: 1 }}>
          BODY DIET
        </Text>
      </View>

      {/* Infos */}
      <View style={{ padding: 12 }}>
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }} numberOfLines={1}>
          {shareItem ? deriveTitle(shareItem) : ""}
        </Text>

        <Text style={{ color: "#fff", opacity: 0.75, marginTop: 4 }}>
          {shareItem ? `${fmtDate(shareItem.t)} • ${fmtTime(shareItem.t)}` : ""}
        </Text>

        <View
          style={{
            marginTop: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 14,
            backgroundColor: "#111827",
            borderWidth: 1,
            borderColor: "#1f2937",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>
            {shareItem ? `${shareItem.p}P • ${shareItem.carb}G • ${shareItem.f}L` : ""}
          </Text>
          <Text style={{ color: "#fff", opacity: 0.8, marginTop: 4 }}>
            {shareItem ? `${shareItem.c} kcal` : ""}
          </Text>
        </View>
      </View>
    </View>

    {/* petit texte pour rassurer (pas capturé) */}
    <Text style={{ color: "#fff", opacity: 0.65, marginTop: 12 }}>
      Génération de l’image…
    </Text>
  </Pressable>
</Modal>

    </SafeAreaView>
  );
}