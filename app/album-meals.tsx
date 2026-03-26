import React, { useEffect, useState,useRef  } from "react";
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
  Switch,
  StyleSheet,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  loadLog,
  LogEntry,
  clearMealPhotos,
  removeMealPhoto,
  renameMeal,
  setShareFrameEnabled,
  setShareFilterEnabled,
  loadState,
} from "../storage/bodyStore";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Dimensions } from "react-native";

const NUM_COLS = 2;
const GAP = 12;
const PAD = 16;

const W = Dimensions.get("window").width;
const TILE = Math.floor((W - PAD * 2 - GAP * (NUM_COLS - 1)) / NUM_COLS);

function formatMeals(data: any[]) {
  const out: any[] = [...data];
  const fullRows = Math.floor(out.length / NUM_COLS);
  let itemsLastRow = out.length - fullRows * NUM_COLS;

  while (itemsLastRow !== 0 && itemsLastRow < NUM_COLS) {
    out.push({ _empty: true, t: `empty-${itemsLastRow}` });
    itemsLastRow++;
  }
  return out;
}
const FRAME = require("../assets/images/body.png");
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
function ShareCard({
  item,
  shareFrame,
  shareFilter,
}: {
  item: LogEntry;
  shareFrame: boolean;
  shareFilter: boolean;
}) {
  const title = deriveTitle(item);

  return (
    <View
      style={{
        width: 1080,
        height: 1350,
        padding: 34,
        backgroundColor: "#0b1220",
      }}
    >
      {/* ✅ CONTENU (tout ce qui est capturé) */}
      <View
        style={{
          flex: 1,
          borderRadius: 34,
          padding: 14,
          backgroundColor: "#05070c",
          overflow: "visible",
          position: "relative",
          
        }}
      >
       
          {/* “moulure” interne */}
          <View
            style={{
              flex: 1,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: "rgba(124, 125, 129, 0.66)",
              overflow: "visible",
              backgroundColor: "#121a2b",
            }}
          >
        {/* ✅ PHOTO BOX (carré) */}
<View
  style={{
    width: "100%",
    aspectRatio: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#111827",
    position: "relative",
    padding: 14, // ajuste 10/12/14/16 selon épaisseur du cadre
  }}
>
  {/* photo (inset) */}
  <View style={{ flex: 1, borderRadius: 12, overflow: "hidden", position: "relative" }}>
    {item.photo ? (
      <Image
        source={{ uri: `data:image/jpeg;base64,${item.photo}` }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
    ) : null}

    {/* ✅ FILTRE (1 seule fois, sur la photo) */}
    {shareFilter && (
      <>
        <LinearGradient
          colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
        />
        <LinearGradient
          colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: "absolute", left: 0, top: 0, right: 0, height: 220 }}
        />
      </>
    )}
  
  </View>

  {/* ✅ BADGE (sur la photo) */}
  <View
    style={{
      position: "absolute",
      right: 18,
      bottom: 18,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 999,
      backgroundColor: "rgba(2,6,23,0.65)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
    }}
  >
    <Text style={{ color: "#e5e7eb", fontWeight: "900", letterSpacing: 2, fontSize: 24 }}>
      BODY DIET
    </Text>
  </View>
</View> 

 


            {/* INFOS */}
            <View style={{ padding: 28 }}>
              <Text
                style={{ color: "#fff", fontSize: 46, fontWeight: "900" }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>

              <Text style={{ color: "#cbd5e1", marginTop: 10, fontSize: 26 }}>
                {fmtDate(item.t)} • {fmtTime(item.t)}
              </Text>

              <View style={{ marginTop: 22, flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
                <View
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    backgroundColor: "#111827",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 26 }}>{item.p}P</Text>
                </View>

                <View
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    backgroundColor: "#111827",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 26 }}>
                    {item.carb}G
                  </Text>
                </View>

                <View
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    backgroundColor: "#111827",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 26 }}>{item.f}L</Text>
                </View>

                <View
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    backgroundColor: "#111827",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 26 }}>
                    {item.c} kcal
                  </Text>
                </View>
              </View>

              <Text style={{ color: "#94a3b8", marginTop: 18, fontSize: 20 }}>
                Scan & album — Body Diet
              </Text>
            </View>

            
         
          </View>
      
      </View>
    </View>
  );
}

export default function AlbumMeals() {
  const router = useRouter();
  const [meals, setMeals] = useState<LogEntry[]>([]);
const [renameOpen, setRenameOpen] = useState(false);
const [renameValue, setRenameValue] = useState("");
const [renameTargetTs, setRenameTargetTs] = useState<number | null>(null);
const [shareOpen, setShareOpen] = useState(false);
const [shareItem, setShareItem] = useState<LogEntry | null>(null);
const sharePreviewRef = useRef<View>(null);  // (optionnel, juste si tu veux capturer le preview)
const shareCaptureRef = useRef<View>(null);  // ✅ celui qui sert à captureRef
const [shareFrame, setShareFrame] = useState(false);
const [shareFilter, setShareFilter] = useState(true);
const openShare = (item: LogEntry) => {
  setShareItem(item);
  setShareOpen(true);
};
// ✅ recharge la liste depuis storage (utile après delete/rename)
const refreshMeals = async () => {
  const log = await loadLog();
  setMeals(log.filter((m) => m.photo));
  const s = await loadState();
setShareFrame(!!s?.shareFrame);
setShareFilter(s?.shareFilter ?? true);
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

    setShareItem(item);

    // laisse le temps au composant caché de se rendre
    // laisse le temps au composant caché de se rendre
await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
await new Promise((r) => setTimeout(r, 80));

    if (!shareCaptureRef.current) {
  Alert.alert("Partage", "Impossible de préparer la carte.");
  return;
}

const uri = await captureRef(shareCaptureRef.current, {
  format: "png",
  quality: 1,
  result: "tmpfile",
});
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert("Partage", "Partage indisponible sur cet appareil.");
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: "image/png",
      dialogTitle: "Partager ton repas",
      UTI: "public.png",
    });
  } catch (e) {
    console.log("shareMeal error:", e);
    Alert.alert("Partage", "Impossible de générer l’image.");
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
          await removeMealPhoto(item.t);
          await refreshMeals();
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
      await refreshMeals();
    })();

    return () => {
      alive = false;
    };
  }, [])
);

 

return (
  <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 8,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          marginRight: 12,
        }}
      >
        <Text style={{ color: "#e2e8f0", fontSize: 18, fontWeight: "900" }}>←</Text>
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>
          Album repas
        </Text>
        <Text style={{ color: "#94a3b8", marginTop: 3, fontSize: 13 }}>
          Retrouve et partage tes repas enregistrés
        </Text>
      </View>
    </View>

    <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
      <View
        style={{
          padding: 14,
          borderRadius: 18,
          backgroundColor: "rgba(255,255,255,0.04)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}>
              Tes photos repas
            </Text>
            <Text
              style={{
                color: "#94a3b8",
                marginTop: 4,
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              Appui long sur une photo pour partager ou supprimer.
            </Text>
          </View>

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
                      await refreshMeals();
                    },
                  },
                ]
              );
            }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: "#111827",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>Vider</Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            marginTop: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.06)",
          }}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>
              Filtre lumière
            </Text>
            <Text style={{ color: "#94a3b8", marginTop: 2, fontSize: 12 }}>
              Ajoute un rendu plus doux sur les cartes de partage
            </Text>
          </View>

          <Switch
            value={shareFilter}
            onValueChange={async (v) => {
              setShareFilter(v);
              await setShareFilterEnabled(v);
            }}
            trackColor={{ false: "#1f2937", true: "#1c2fe2" }}
            thumbColor={shareFilter ? "#dbeafe" : "#9ca3af"}
            ios_backgroundColor="#1f2937"
          />
        </View>
      </View>
    </View> 



<FlatList
  data={formatMeals(meals)}
  keyExtractor={(item: any) => String(item.t)}
  numColumns={2}
  columnWrapperStyle={{ gap: GAP }}
  contentContainerStyle={{ padding: PAD, gap: GAP }}
  renderItem={({ item }: any) => {
    if (item._empty) {
      return <View style={{ width: TILE }} />; // placeholder invisible
    }

 return (
  <TouchableOpacity
    activeOpacity={0.9}
    onLongPress={() => onLongPressMeal(item)}
    delayLongPress={250}
    style={{
      width: TILE,
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: "#0f172a",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    }}
  >
    {item.photo ? (
      <View style={{ position: "relative" }}>
        <Image
          source={{ uri: `data:image/jpeg;base64,${item.photo}` }}
          style={{ width: "100%", height: TILE }}
          resizeMode="cover"
        />

        <View
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: "rgba(2,6,23,0.72)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 10,
              fontWeight: "900",
              letterSpacing: 1,
            }}
          >
            BODY
          </Text>
        </View>
      </View>
    ) : null}

    <View style={{ padding: 11 }}>
      <Text
        style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}
        numberOfLines={1}
      >
        {deriveTitle(item)}
      </Text>

      <Text
        style={{
          color: "#94a3b8",
          marginTop: 3,
          fontSize: 11,
        }}
      >
        {fmtDate(item.t)} • {fmtTime(item.t)}
      </Text>

      <View
        style={{
          marginTop: 7,
          paddingVertical: 6,
          paddingHorizontal: 8,
          borderRadius: 10,
          backgroundColor: "rgba(255,255,255,0.04)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <Text style={{ color: "#e5e7eb", fontSize: 11, fontWeight: "800" }}>
          {item.p}P • {item.carb}G • {item.f}L • {item.c} kcal
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);
  }}
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
      backgroundColor: "rgba(2,6,23,0.75)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    }}
  >
    <View
      style={{
        width: 220,
        paddingVertical: 22,
        paddingHorizontal: 18,
        borderRadius: 20,
        backgroundColor: "#020617",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        alignItems: "center",
      }}
    >
      {/* loader cercle */}
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 999,
          borderWidth: 3,
          borderColor: "rgba(255,255,255,0.08)",
          borderTopColor: "#1c2fe2",
          marginBottom: 14,
        }}
      />

      <Text
        style={{
          color: "#fff",
          fontWeight: "900",
          fontSize: 14,
          letterSpacing: 0.5,
        }}
      >
        Préparation du visuel
      </Text>

      <Text
        style={{
          color: "#94a3b8",
          fontSize: 12,
          marginTop: 6,
          textAlign: "center",
        }}
      >
        Optimisation de la photo et des macros
      </Text>
    </View>
  </Pressable>
</Modal>

{/* ✅ Zone cachée pour générer l’image partage */}
<View
  style={{
    position: "absolute",
    left: -9999,
    top: -9999,
  }}
>
  <View ref={shareCaptureRef} collapsable={false}>
    {shareItem ? (
      <ShareCard item={shareItem} shareFrame={shareFrame} shareFilter={shareFilter} />
    ) : null}
  </View>
</View>
    </SafeAreaView>
  );
}