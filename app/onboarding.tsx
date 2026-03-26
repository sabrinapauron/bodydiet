import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Dimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { setOnboardingSeen } from "../storage/onboarding";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Complète ton profil",
    text: "Indique ton objectif, ton poids et ta taille pour adapter automatiquement tes macros.",
    image: require("../assets/images/onboarding-profil.png"),
  },
  {
    id: "2",
    title: "Rien a peser ! ",
    text: "compose tes assiettes de cette manière et scan ton repas pour visualiser l’équilibre de tes macros.",
    image: require("../assets/images/onboarding-assiette.png"),
  },
  {
    id: "3",
    title: "Découvre Body Scan 3D",
    text: "Analyse ta silhouette, suis ta progression et avance vers ton objectif.",
    image: require("../assets/images/onboarding-bodyscan.png"),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const finishOnboarding = async () => {
     console.log("👉 finishOnboarding");
    await setOnboardingSeen();
    router.replace("/(tabs)");
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      await finishOnboarding();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
       renderItem={({ item }) => (
  <View
    style={{
      width,
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    }}
  >
    <Image
      source={item.image}
      resizeMode="contain"
      style={{
        width: width * 0.82,
        height: 300,
        marginBottom: 26,
      }}
    />

    <Text
      style={{
        color: "#fff",
        fontSize: 26,
        fontWeight: "900",
        textAlign: "center",
      }}
    >
      {item.title}
    </Text>

    <Text
      style={{
        color: "#cbd5e1",
        fontSize: 16,
        lineHeight: 24,
        textAlign: "center",
        marginTop: 12,
        paddingHorizontal: 10,
      }}
    >
      {item.text}
    </Text>
  </View>
)}
/>

<View style={{ paddingHorizontal: 24, paddingBottom: 28 }}>
  <View
    style={{
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 18,
    }}
  >
    {slides.map((_, index) => (
      <View
        key={index}
        style={{
          width: currentIndex === index ? 22 : 8,
          height: 8,
          borderRadius: 999,
          marginHorizontal: 4,
          backgroundColor:
            currentIndex === index ? "#60A5FA" : "rgba(255,255,255,0.18)",
        }}
      />
    ))}
  </View>

  <TouchableOpacity
    onPress={handleNext}
    activeOpacity={0.9}
    style={{
      backgroundColor: "#2563EB",
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "rgba(147,197,253,0.35)",
      shadowColor: "#60A5FA",
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    }}
  >
    <Text
      style={{
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "900",
        letterSpacing: 0.3,
      }}
    >
      {currentIndex === slides.length - 1 ? "Commencer" : "Suivant"}
    </Text>
  </TouchableOpacity>
</View>
    </SafeAreaView>
  );
}