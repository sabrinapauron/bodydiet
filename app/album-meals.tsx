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

const FRAME = require("../assets/images/body diet 2 .png");
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
          overflow: "visible", // important si on superpose le cadre
        }}
      >
        {/* effet brillant (gloss) */}
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.18)",
            "rgba(255,255,255,0.02)",
            "rgba(0,0,0,0.35)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            borderRadius: 28,
            padding: 12,
          }}
        >
          {/* “moulure” interne */}
          <View
            style={{
              flex: 1,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.10)",
              overflow: "visible",
              backgroundColor: "#0b1220",
            }}
          >
           {/* PHOTO */}
<View
  style={{
    width: "100%",
    aspectRatio: 1, // ✅ rend la zone carrée
    backgroundColor: "#111827",
  }}
>
  {item.photo && (
    <Image
      source={{ uri: `data:image/jpeg;base64,${item.photo}` }}
      style={{
        width: "100%",
        height: "100%",
      }}
      resizeMode="cover"
    />
  )}
</View>
            {/* ✅ FILTRE (vraiment ON/OFF) */}
           
{shareFilter && (
  <>
    {/* vignette douce (sans barre) */}
    <LinearGradient
      colors={[
        "rgba(0,0,0,0.55)",
        "rgba(0,0,0,0.10)",
        "rgba(0,0,0,0.10)",
        "rgba(0,0,0,0.65)",
      ]}
      locations={[0, 0.35, 0.65, 1]}
      style={{ position: "absolute", left: 0, top: 0, right: 0, height: 780 }}
    />

    {/* highlight léger */}
    <LinearGradient
      colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0)"]}
      locations={[0, 1]}
      style={{ position: "absolute", left: 0, top: 0, right: 0, height: 260 }}
    />
  </>
)}
            {/* BADGE BODY DIET */}
            <View
    style={{
      position: "absolute",
      right: 40,
      bottom: 40,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 999,
      backgroundColor: "rgba(2,6,23,0.65)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.25)",
    }}
  >
    <Text
      style={{
        color: "#e5e7eb",
        fontWeight: "900",
        letterSpacing: 2,
        fontSize: 28,
      }}
    >
      BODY DIET
    </Text>
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

            
          {/* ✅ CADRE BAROQUE (capturé aussi) */}
{shareFrame && (
  <View
    pointerEvents="none"
    style={[StyleSheet.absoluteFillObject, { zIndex: 999 }]}
  >
    <Image
      source={FRAME}
      resizeMode="stretch"
      style={StyleSheet.absoluteFillObject}
    />
  </View>
)}
          </View>
        </LinearGradient>
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

 

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
    <View style={{ padding: 16 }}>
  {/* Ligne 1: titre + poubelle */}
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <Text
      style={{ color: "#fff", fontSize: 20, fontWeight: "900", flex: 1, paddingRight: 10 }}
      numberOfLines={2}
    >
      ALBUM REPAS - clic et partage tes photos
    </Text>

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
      style={{ padding: 6, borderRadius: 8 }}
    >
      <Text style={{ fontSize: 20 }}>🗑️</Text>
    </TouchableOpacity>
  </View>

  {/* Ligne 2: switches */}
  <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
    <Text style={{ color: "#94a3b8" }}>Cadre baroque</Text>
    <Switch
      value={shareFrame}
      onValueChange={async (v) => {
        setShareFrame(v);
        await setShareFrameEnabled(v);
      }}
    />
  </View>

  <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
    <Text style={{ color: "#94a3b8" }}>Filtre premium</Text>
    <Switch
      value={shareFilter}
      onValueChange={async (v) => {
        setShareFilter(v);
        await setShareFilterEnabled(v);
      }}
    />
  </View>
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

    {/* CADRE (au-dessus de la photo/carte) */}
{shareFrame && (
  <Image
    source={FRAME}
    resizeMode="stretch"
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
      zIndex: 50,
    }}
  />
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
    zIndex: 60, // ✅ badge AU-DESSUS du cadre
  }}
>
  <Text style={{ color: "#e5e7eb", fontWeight: "900", letterSpacing: 1 }}>
    BODY DIET
  </Text>
</View>


     </View>

    
 

    {/* petit texte pour rassurer (pas capturé) */}
    <Text style={{ color: "#fff", opacity: 0.65, marginTop: 12 }}>
      Génération de l’image…
    </Text>
  </Pressable>
</Modal>
{/* ✅ Zone cachée pour générer l’image partage */}
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