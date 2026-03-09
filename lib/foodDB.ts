export type PriceMode = "eco" | "standard" | "bio";

export type FoodCategory = "protein" | "carb" | "fat" | "veg" | "extra";

export type FoodItem = {
  id: string;
  name: string;
  category: FoodCategory;

  // portion affichée à l'utilisateur
  portionLabel: string; // ex: "150 g", "2 œufs", "1 pot"

  // portions recommandées sur 7 jours
  weeklyPortions: [number, number]; // ex: [3, 5]

  // macros par portion
  protein: number;
  carbs: number;
  fat: number;
  calories: number;

  // prix par portion
  pricePerPortionEco?: number;
  pricePerPortionStandard?: number;
pricePerPortionBio?: number;
  // achat conseillé réel
  packLabel?: string; // ex: "1 barquette 600 g"
  packSizeInPortions?: number; // ex: 4
  packPriceEco?: number;
  packPriceStandard?: number;
  packPriceBio?: number;

  // pour signaler les ajouts protéinés utiles
  proteinBoost?: boolean;
};

export const FOOD_DB: FoodItem[] = [
  // =========================
  // PROTÉINES / VIANDES / POISSONS / LAITAGES
  // =========================
  {
    id: "chicken",
    name: "Poulet (blanc)",
    category: "protein",
    portionLabel: "150 g",
    weeklyPortions: [3, 5],
    protein: 32,
    carbs: 0,
    fat: 4,
    calories: 180,
    pricePerPortionEco: 1.42,
    pricePerPortionStandard: 1.79,
    pricePerPortionBio: 2.65,
    packLabel: "1 kg de filets",
    packSizeInPortions: 6,
    packPriceEco: 9.49,
    packPriceStandard: 10.74,
    packPriceBio: 15.90,
  },

  {
    id: "eggs",
    name: "Œufs",
    category: "protein",
    portionLabel: "2 œufs",
    weeklyPortions: [3, 5],
    protein: 14,
    carbs: 1,
    fat: 10,
    calories: 155,
    pricePerPortionEco: 0.43,
    pricePerPortionStandard: 0.55,
    pricePerPortionBio: 0.78,
    packLabel: "1 boîte de 12 œufs",
    packSizeInPortions: 6,
    packPriceEco: 2.58,
    packPriceStandard: 3.30,
    packPriceBio: 4.68,
  },

  {
    id: "tuna",
    name: "Thon",
    category: "protein",
    portionLabel: "120 g",
    weeklyPortions: [2, 3],
    protein: 28,
    carbs: 0,
    fat: 1,
    calories: 130,
    pricePerPortionEco: 1.35,
    pricePerPortionStandard: 1.75,
    pricePerPortionBio: 2.20,
    packLabel: "3 boîtes",
    packSizeInPortions: 3,
    packPriceEco: 4.05,
    packPriceStandard: 5.25,
    packPriceBio: 6.60,
  },

  {
    id: "white_fish",
    name: "Poisson blanc",
    category: "protein",
    portionLabel: "150 g",
    weeklyPortions: [2, 4],
    protein: 30,
    carbs: 0,
    fat: 2,
    calories: 145,
    pricePerPortionEco: 1.95,
    pricePerPortionStandard: 2.60,
    pricePerPortionBio: 3.40,
    packLabel: "600 g de filets surgelés",
    packSizeInPortions: 4,
    packPriceEco: 7.80,
    packPriceStandard: 10.40,
    packPriceBio: 13.60,
  },

  {
    id: "salmon",
    name: "Saumon rose",
    category: "protein",
    portionLabel: "150 g",
    weeklyPortions: [1, 3],
    protein: 30,
    carbs: 0,
    fat: 13,
    calories: 245,
    pricePerPortionEco: 3.20,
    pricePerPortionStandard: 4.10,
    pricePerPortionBio: 5.10,
    packLabel: "2 pavés de 150 g",
    packSizeInPortions: 2,
    packPriceEco: 6.40,
    packPriceStandard: 8.20,
    packPriceBio: 10.20,
  },

  {
    id: "ham",
    name: "Jambon blanc",
    category: "protein",
    portionLabel: "2 tranches",
    weeklyPortions: [2, 4],
    protein: 18,
    carbs: 1,
    fat: 4,
    calories: 115,
    pricePerPortionEco: 0.85,
    pricePerPortionStandard: 1.10,
    pricePerPortionBio: 1.55,
    packLabel: "4 tranches",
    packSizeInPortions: 2,
    packPriceEco: 1.70,
    packPriceStandard: 2.20,
    packPriceBio: 3.10,
  },

  {
    id: "pork_loin",
    name: "Porc (filet)",
    category: "protein",
    portionLabel: "150 g",
    weeklyPortions: [1, 3],
    protein: 31,
    carbs: 0,
    fat: 6,
    calories: 185,
    pricePerPortionEco: 1.35,
    pricePerPortionStandard: 1.75,
    pricePerPortionBio: 2.45,
    packLabel: "600 g de filet",
    packSizeInPortions: 4,
    packPriceEco: 5.40,
    packPriceStandard: 7.00,
    packPriceBio: 9.80,
  },

  {
    id: "pork_shoulder",
    name: "Porc (échine)",
    category: "protein",
    portionLabel: "150 g",
    weeklyPortions: [1, 2],
    protein: 25,
    carbs: 0,
    fat: 16,
    calories: 240,
    pricePerPortionEco: 1.10,
    pricePerPortionStandard: 1.45,
    pricePerPortionBio: 2.05,
    packLabel: "600 g d’échine",
    packSizeInPortions: 4,
    packPriceEco: 4.40,
    packPriceStandard: 5.80,
    packPriceBio: 8.20,
  },

  {
    id: "ground_beef_5",
    name: "Steak haché 5%",
    category: "protein",
    portionLabel: "125 g",
    weeklyPortions: [1, 3],
    protein: 26,
    carbs: 0,
    fat: 6,
    calories: 160,
    pricePerPortionEco: 1.70,
    pricePerPortionStandard: 2.05,
    pricePerPortionBio: 2.90,
    packLabel: "4 steaks de 125 g",
    packSizeInPortions: 4,
    packPriceEco: 6.80,
    packPriceStandard: 8.20,
    packPriceBio: 11.60,
  },

  {
    id: "sirloin",
    name: "Bœuf (faux-filet)",
    category: "protein",
    portionLabel: "180 g",
    weeklyPortions: [1, 2],
    protein: 37,
    carbs: 0,
    fat: 14,
    calories: 285,
    pricePerPortionEco: 3.20,
    pricePerPortionStandard: 4.10,
    pricePerPortionBio: 5.20,
    packLabel: "2 pièces de 180 g",
    packSizeInPortions: 2,
    packPriceEco: 6.40,
    packPriceStandard: 8.20,
    packPriceBio: 10.40,
  },

  {
    id: "duck_breast",
    name: "Canard (magret)",
    category: "protein",
    portionLabel: "150 g",
    weeklyPortions: [1, 2],
    protein: 28,
    carbs: 0,
    fat: 14,
    calories: 255,
    pricePerPortionEco: 3.50,
    pricePerPortionStandard: 4.40,
    pricePerPortionBio: 5.60,
    packLabel: "1 magret d’environ 300 g",
    packSizeInPortions: 2,
    packPriceEco: 7.00,
    packPriceStandard: 8.80,
    packPriceBio: 11.20,
  },

  {
    id: "lamb_leg_slice",
    name: "Mouton (tranche de gigot)",
    category: "protein",
    portionLabel: "150 g",
    weeklyPortions: [1, 2],
    protein: 28,
    carbs: 0,
    fat: 13,
    calories: 250,
    pricePerPortionEco: 3.40,
    pricePerPortionStandard: 4.30,
    pricePerPortionBio: 5.40,
    packLabel: "2 tranches de 150 g",
    packSizeInPortions: 2,
    packPriceEco: 6.80,
    packPriceStandard: 8.60,
    packPriceBio: 10.80,
  },

  {
    id: "sausage_knacki",
    name: "Saucisse type Knacki",
    category: "protein",
    portionLabel: "2 saucisses",
    weeklyPortions: [1, 3],
    protein: 12,
    carbs: 3,
    fat: 14,
    calories: 190,
    pricePerPortionEco: 0.80,
    pricePerPortionStandard: 1.05,
    pricePerPortionBio: 1.45,
    packLabel: "1 paquet de 6 saucisses",
    packSizeInPortions: 3,
    packPriceEco: 2.40,
    packPriceStandard: 3.15,
    packPriceBio: 4.35,
  },

  {
    id: "sausage_morteau",
    name: "Saucisse de Morteau",
    category: "protein",
    portionLabel: "120 g",
    weeklyPortions: [1, 2],
    protein: 18,
    carbs: 1,
    fat: 24,
    calories: 290,
    pricePerPortionEco: 1.70,
    pricePerPortionStandard: 2.10,
    pricePerPortionBio: 2.80,
    packLabel: "1 saucisse de 360 g",
    packSizeInPortions: 3,
    packPriceEco: 5.10,
    packPriceStandard: 6.30,
    packPriceBio: 8.40,
  },

  {
    id: "skyr",
    name: "Skyr",
    category: "protein",
    portionLabel: "150 g",
    weeklyPortions: [3, 5],
    protein: 17,
    carbs: 6,
    fat: 0,
    calories: 90,
    pricePerPortionEco: 0.55,
    pricePerPortionStandard: 0.75,
    pricePerPortionBio: 1.00,
    packLabel: "4 pots de 100 à 140 g",
    packSizeInPortions: 4,
    packPriceEco: 2.20,
    packPriceStandard: 3.00,
    packPriceBio: 4.00,
    proteinBoost: true,
  },

  {
    id: "protein_yogurt",
    name: "Yaourt protéiné",
    category: "protein",
    portionLabel: "1 pot",
    weeklyPortions: [2, 4],
    protein: 20,
    carbs: 12,
    fat: 2,
    calories: 150,
    pricePerPortionEco: 0.80,
    pricePerPortionStandard: 1.00,
    pricePerPortionBio: 1.35,
    packLabel: "4 pots",
    packSizeInPortions: 4,
    packPriceEco: 3.20,
    packPriceStandard: 4.00,
    packPriceBio: 5.40,
    proteinBoost: true,
  },

  {
    id: "fromage_blanc",
    name: "Fromage blanc",
    category: "protein",
    portionLabel: "150 g",
    weeklyPortions: [3, 6],
    protein: 12,
    carbs: 6,
    fat: 3,
    calories: 95,
    pricePerPortionEco: 0.30,
    pricePerPortionStandard: 0.40,
    pricePerPortionBio: 0.58,
    packLabel: "1 pot de 1 kg",
    packSizeInPortions: 6,
    packPriceEco: 1.80,
    packPriceStandard: 2.40,
    packPriceBio: 3.48,
    proteinBoost: true,
  },

  {
    id: "greek_yogurt",
    name: "Yaourt grec",
    category: "protein",
    portionLabel: "150 g",
    weeklyPortions: [2, 4],
    protein: 9,
    carbs: 5,
    fat: 7,
    calories: 120,
    pricePerPortionEco: 0.45,
    pricePerPortionStandard: 0.60,
    pricePerPortionBio: 0.90,
    packLabel: "1 pot de 500 g",
    packSizeInPortions: 3,
    packPriceEco: 1.35,
    packPriceStandard: 1.80,
    packPriceBio: 2.70,
  },

  {
    id: "cottage_cheese",
    name: "Cottage cheese",
    category: "protein",
    portionLabel: "150 g",
    weeklyPortions: [1, 3],
    protein: 16,
    carbs: 4,
    fat: 4,
    calories: 120,
    pricePerPortionEco: 0.65,
    pricePerPortionStandard: 0.85,
    pricePerPortionBio: 1.15,
    packLabel: "1 pot de 300 g",
    packSizeInPortions: 2,
    packPriceEco: 1.30,
    packPriceStandard: 1.70,
    packPriceBio: 2.30,
    proteinBoost: true,
  },

  {
    id: "protein_bar",
    name: "Barre protéinée",
    category: "extra",
    portionLabel: "1 barre",
    weeklyPortions: [2, 4],
    protein: 15,
    carbs: 20,
    fat: 7,
    calories: 200,
    pricePerPortionEco: 1.20,
    pricePerPortionStandard: 1.75,
    pricePerPortionBio: 2.30,
    packLabel: "Boîte de 6 barres",
    packSizeInPortions: 6,
    packPriceEco: 7.20,
    packPriceStandard: 10.50,
    packPriceBio: 13.80,
    proteinBoost: true,
  },

  // =========================
  // GLUCIDES / FÉCULENTS
  // =========================
  {
    id: "rice",
    name: "Riz",
    category: "carb",
    portionLabel: "100 g cru",
    weeklyPortions: [4, 7],
    protein: 7,
    carbs: 77,
    fat: 1,
    calories: 360,
    pricePerPortionEco: 0.20,
    pricePerPortionStandard: 0.22,
    pricePerPortionBio: 0.35,
    packLabel: "1 paquet de 1 kg",
    packSizeInPortions: 10,
    packPriceEco: 1.95,
    packPriceStandard: 2.24,
    packPriceBio: 3.50,
  },

  {
    id: "whole_pasta",
    name: "Pâtes complètes",
    category: "carb",
    portionLabel: "100 g cru",
    weeklyPortions: [3, 6],
    protein: 12,
    carbs: 70,
    fat: 2,
    calories: 350,
    pricePerPortionEco: 0.18,
    pricePerPortionStandard: 0.24,
    pricePerPortionBio: 0.35,
    packLabel: "1 paquet de 1 kg",
    packSizeInPortions: 10,
    packPriceEco: 1.80,
    packPriceStandard: 2.40,
    packPriceBio: 3.50,
  },

  {
    id: "potatoes",
    name: "Pommes de terre",
    category: "carb",
    portionLabel: "200 g",
    weeklyPortions: [3, 5],
    protein: 4,
    carbs: 34,
    fat: 0,
    calories: 150,
    pricePerPortionEco: 0.28,
    pricePerPortionStandard: 0.38,
    pricePerPortionBio: 0.50,
    packLabel: "1 filet de 2 kg",
    packSizeInPortions: 10,
    packPriceEco: 2.80,
    packPriceStandard: 3.80,
    packPriceBio: 5.00,
  },

  {
    id: "sweet_potato",
    name: "Patate douce",
    category: "carb",
    portionLabel: "200 g",
    weeklyPortions: [2, 4],
    protein: 4,
    carbs: 40,
    fat: 0,
    calories: 180,
    pricePerPortionEco: 0.65,
    pricePerPortionStandard: 0.85,
    pricePerPortionBio: 1.15,
    packLabel: "1 lot d’environ 1,2 kg",
    packSizeInPortions: 6,
    packPriceEco: 3.90,
    packPriceStandard: 5.10,
    packPriceBio: 6.90,
  },

  {
    id: "oats",
    name: "Flocons d'avoine",
    category: "carb",
    portionLabel: "60 g",
    weeklyPortions: [4, 7],
    protein: 8,
    carbs: 38,
    fat: 4,
    calories: 230,
    pricePerPortionEco: 0.12,
    pricePerPortionStandard: 0.14,
    pricePerPortionBio: 0.19,
    packLabel: "1 sachet de 500 g",
    packSizeInPortions: 8,
    packPriceEco: 0.96,
    packPriceStandard: 1.12,
    packPriceBio: 1.48,
  },

  {
    id: "quinoa",
    name: "Quinoa",
    category: "carb",
    portionLabel: "80 g cru",
    weeklyPortions: [1, 3],
    protein: 11,
    carbs: 51,
    fat: 5,
    calories: 295,
    pricePerPortionEco: 0.55,
    pricePerPortionStandard: 0.75,
    pricePerPortionBio: 1.05,
    packLabel: "1 paquet de 500 g",
    packSizeInPortions: 6,
    packPriceEco: 3.30,
    packPriceStandard: 4.50,
    packPriceBio: 6.30,
  },

  {
    id: "lentils",
    name: "Lentilles",
    category: "carb",
    portionLabel: "80 g cru",
    weeklyPortions: [2, 4],
    protein: 10,
    carbs: 42,
    fat: 1,
    calories: 250,
    pricePerPortionEco: 0.18,
    pricePerPortionStandard: 0.25,
    pricePerPortionBio: 0.38,
    packLabel: "1 sachet de 500 g",
    packSizeInPortions: 6,
    packPriceEco: 1.08,
    packPriceStandard: 1.50,
    packPriceBio: 2.28,
  },

  {
    id: "bread_whole",
    name: "Pain complet",
    category: "carb",
    portionLabel: "2 tranches",
    weeklyPortions: [3, 6],
    protein: 7,
    carbs: 28,
    fat: 2,
    calories: 165,
    pricePerPortionEco: 0.22,
    pricePerPortionStandard: 0.30,
    pricePerPortionBio: 0.44,
    packLabel: "1 pain tranché",
    packSizeInPortions: 8,
    packPriceEco: 1.76,
    packPriceStandard: 2.40,
    packPriceBio: 3.52,
  },

  {
    id: "wraps",
    name: "Wraps",
    category: "carb",
    portionLabel: "1 wrap",
    weeklyPortions: [2, 4],
    protein: 5,
    carbs: 24,
    fat: 4,
    calories: 155,
    pricePerPortionEco: 0.30,
    pricePerPortionStandard: 0.42,
    pricePerPortionBio: 0.58,
    packLabel: "Pack de 6 wraps",
    packSizeInPortions: 6,
    packPriceEco: 1.80,
    packPriceStandard: 2.52,
    packPriceBio: 3.48,
  },

  {
    id: "fruit_juice",
    name: "Jus de fruit",
    category: "carb",
    portionLabel: "200 ml",
    weeklyPortions: [2, 5],
    protein: 1,
    carbs: 22,
    fat: 0,
    calories: 92,
    pricePerPortionEco: 0.20,
    pricePerPortionStandard: 0.28,
    pricePerPortionBio: 0.42,
    packLabel: "1 bouteille de 1 L",
    packSizeInPortions: 5,
    packPriceEco: 1.00,
    packPriceStandard: 1.40,
    packPriceBio: 2.10,
  },

  // =========================
  // LÉGUMES
  // =========================
  {
    id: "spinach",
    name: "Épinards frais",
    category: "veg",
    portionLabel: "100 g",
    weeklyPortions: [2, 4],
    protein: 3,
    carbs: 4,
    fat: 0,
    calories: 23,
    pricePerPortionEco: 0.55,
    pricePerPortionStandard: 0.75,
    pricePerPortionBio: 1.10,
    packLabel: "1 sachet de 400 g",
    packSizeInPortions: 4,
    packPriceEco: 2.20,
    packPriceStandard: 3.00,
    packPriceBio: 4.40,
  },

  {
    id: "zucchini",
    name: "Courgettes",
    category: "veg",
    portionLabel: "150 g",
    weeklyPortions: [2, 4],
    protein: 2,
    carbs: 4,
    fat: 0,
    calories: 20,
    pricePerPortionEco: 0.35,
    pricePerPortionStandard: 0.50,
    pricePerPortionBio: 0.75,
    packLabel: "3 courgettes",
    packSizeInPortions: 3,
    packPriceEco: 1.05,
    packPriceStandard: 1.50,
    packPriceBio: 2.25,
  },

  {
    id: "carrots",
    name: "Carottes",
    category: "veg",
    portionLabel: "120 g",
    weeklyPortions: [3, 5],
    protein: 1,
    carbs: 10,
    fat: 0,
    calories: 40,
    pricePerPortionEco: 0.16,
    pricePerPortionStandard: 0.24,
    pricePerPortionBio: 0.36,
    packLabel: "1 sachet de 1 kg",
    packSizeInPortions: 8,
    packPriceEco: 1.28,
    packPriceStandard: 1.92,
    packPriceBio: 2.88,
  },

  {
    id: "parsnip",
    name: "Panais",
    category: "veg",
    portionLabel: "120 g",
    weeklyPortions: [1, 3],
    protein: 1,
    carbs: 18,
    fat: 0,
    calories: 75,
    pricePerPortionEco: 0.45,
    pricePerPortionStandard: 0.65,
    pricePerPortionBio: 0.95,
    packLabel: "1 lot d’environ 600 g",
    packSizeInPortions: 5,
    packPriceEco: 2.25,
    packPriceStandard: 3.25,
    packPriceBio: 4.75,
  },

  {
    id: "broccoli",
    name: "Brocoli",
    category: "veg",
    portionLabel: "150 g",
    weeklyPortions: [2, 4],
    protein: 4,
    carbs: 7,
    fat: 0,
    calories: 45,
    pricePerPortionEco: 0.45,
    pricePerPortionStandard: 0.60,
    pricePerPortionBio: 0.90,
    packLabel: "1 tête d’environ 450 g",
    packSizeInPortions: 3,
    packPriceEco: 1.35,
    packPriceStandard: 1.80,
    packPriceBio: 2.70,
  },

  {
    id: "green_beans",
    name: "Haricots verts",
    category: "veg",
    portionLabel: "150 g",
    weeklyPortions: [2, 4],
    protein: 3,
    carbs: 8,
    fat: 0,
    calories: 42,
    pricePerPortionEco: 0.35,
    pricePerPortionStandard: 0.50,
    pricePerPortionBio: 0.75,
    packLabel: "1 sachet de 600 g",
    packSizeInPortions: 4,
    packPriceEco: 1.40,
    packPriceStandard: 2.00,
    packPriceBio: 3.00,
  },

  {
    id: "tomatoes",
    name: "Tomates",
    category: "veg",
    portionLabel: "150 g",
    weeklyPortions: [2, 5],
    protein: 1,
    carbs: 5,
    fat: 0,
    calories: 27,
    pricePerPortionEco: 0.40,
    pricePerPortionStandard: 0.55,
    pricePerPortionBio: 0.85,
    packLabel: "1 barquette de 750 g",
    packSizeInPortions: 5,
    packPriceEco: 2.00,
    packPriceStandard: 2.75,
    packPriceBio: 4.25,
  },

  {
    id: "mushrooms",
    name: "Champignons",
    category: "veg",
    portionLabel: "150 g",
    weeklyPortions: [1, 3],
    protein: 4,
    carbs: 3,
    fat: 0,
    calories: 30,
    pricePerPortionEco: 0.55,
    pricePerPortionStandard: 0.70,
    pricePerPortionBio: 1.00,
    packLabel: "1 barquette de 300 g",
    packSizeInPortions: 2,
    packPriceEco: 1.10,
    packPriceStandard: 1.40,
    packPriceBio: 2.00,
  },

  {
    id: "peppers",
    name: "Poivrons",
    category: "veg",
    portionLabel: "150 g",
    weeklyPortions: [1, 3],
    protein: 1,
    carbs: 7,
    fat: 0,
    calories: 35,
    pricePerPortionEco: 0.55,
    pricePerPortionStandard: 0.75,
    pricePerPortionBio: 1.05,
    packLabel: "3 poivrons",
    packSizeInPortions: 3,
    packPriceEco: 1.65,
    packPriceStandard: 2.25,
    packPriceBio: 3.15,
  },

  // =========================
  // FRUITS / EXTRAS
  // =========================
  {
    id: "banana",
    name: "Banane",
    category: "extra",
    portionLabel: "1 banane",
    weeklyPortions: [4, 7],
    protein: 1,
    carbs: 23,
    fat: 0,
    calories: 90,
    pricePerPortionEco: 0.22,
    pricePerPortionStandard: 0.28,
    pricePerPortionBio: 0.40,
    packLabel: "1 main de 6 bananes",
    packSizeInPortions: 6,
    packPriceEco: 1.32,
    packPriceStandard: 1.68,
    packPriceBio: 2.40,
  },

  {
    id: "apple",
    name: "Pomme",
    category: "extra",
    portionLabel: "1 pomme",
    weeklyPortions: [4, 7],
    protein: 0,
    carbs: 20,
    fat: 0,
    calories: 80,
    pricePerPortionEco: 0.28,
    pricePerPortionStandard: 0.38,
    pricePerPortionBio: 0.55,
    packLabel: "1 sachet de 6 pommes",
    packSizeInPortions: 6,
    packPriceEco: 1.68,
    packPriceStandard: 2.28,
    packPriceBio: 3.30,
  },

  {
    id: "orange",
    name: "Orange",
    category: "extra",
    portionLabel: "1 orange",
    weeklyPortions: [3, 6],
    protein: 1,
    carbs: 15,
    fat: 0,
    calories: 62,
    pricePerPortionEco: 0.25,
    pricePerPortionStandard: 0.35,
    pricePerPortionBio: 0.52,
    packLabel: "1 filet de 6 oranges",
    packSizeInPortions: 6,
    packPriceEco: 1.50,
    packPriceStandard: 2.10,
    packPriceBio: 3.12,
  },

  {
    id: "nuts_mix",
    name: "Mélange de noix",
    category: "extra",
    portionLabel: "30 g",
    weeklyPortions: [2, 5],
    protein: 5,
    carbs: 5,
    fat: 16,
    calories: 180,
    pricePerPortionEco: 0.38,
    pricePerPortionStandard: 0.52,
    pricePerPortionBio: 0.78,
    packLabel: "1 sachet de 300 g",
    packSizeInPortions: 10,
    packPriceEco: 3.80,
    packPriceStandard: 5.20,
    packPriceBio: 7.80,
  },

  {
    id: "dark_chocolate",
    name: "Chocolat noir",
    category: "extra",
    portionLabel: "20 g",
    weeklyPortions: [1, 4],
    protein: 2,
    carbs: 9,
    fat: 8,
    calories: 120,
    pricePerPortionEco: 0.20,
    pricePerPortionStandard: 0.28,
    pricePerPortionBio: 0.42,
    packLabel: "1 tablette de 100 g",
    packSizeInPortions: 5,
    packPriceEco: 1.00,
    packPriceStandard: 1.40,
    packPriceBio: 2.10,
  },

  {
    id: "brown_sugar",
    name: "Sucre complet",
    category: "extra",
    portionLabel: "10 g",
    weeklyPortions: [1, 3],
    protein: 0,
    carbs: 10,
    fat: 0,
    calories: 40,
    pricePerPortionEco: 0.06,
    pricePerPortionStandard: 0.08,
    pricePerPortionBio: 0.12,
    packLabel: "1 sachet de 500 g",
    packSizeInPortions: 50,
    packPriceEco: 3.00,
    packPriceStandard: 4.00,
    packPriceBio: 6.00,
  },

  // =========================
  // MATIÈRES GRASSES / ASSAISONNEMENTS
  // =========================
  {
    id: "olive_oil",
    name: "Huile d'olive",
    category: "fat",
    portionLabel: "10 g",
    weeklyPortions: [5, 7],
    protein: 0,
    carbs: 0,
    fat: 10,
    calories: 90,
    pricePerPortionEco: 0.13,
    pricePerPortionStandard: 0.18,
    pricePerPortionBio: 0.24,
    packLabel: "1 bouteille de 1 L",
    packSizeInPortions: 90,
    packPriceEco: 11.70,
    packPriceStandard: 16.20,
    packPriceBio: 21.60,
  },

  {
    id: "rapeseed_oil",
    name: "Huile de colza",
    category: "fat",
    portionLabel: "10 g",
    weeklyPortions: [3, 6],
    protein: 0,
    carbs: 0,
    fat: 10,
    calories: 90,
    pricePerPortionEco: 0.04,
    pricePerPortionStandard: 0.06,
    pricePerPortionBio: 0.10,
    packLabel: "1 bouteille de 1 L",
    packSizeInPortions: 90,
    packPriceEco: 3.60,
    packPriceStandard: 5.40,
    packPriceBio: 9.00,
  },

  {
    id: "butter",
    name: "Beurre",
    category: "fat",
    portionLabel: "10 g",
    weeklyPortions: [2, 5],
    protein: 0,
    carbs: 0,
    fat: 8,
    calories: 75,
    pricePerPortionEco: 0.08,
    pricePerPortionStandard: 0.11,
    pricePerPortionBio: 0.17,
    packLabel: "1 plaquette de 250 g",
    packSizeInPortions: 25,
    packPriceEco: 2.00,
    packPriceStandard: 2.75,
    packPriceBio: 4.25,
  },

  {
    id: "cream",
    name: "Crème",
    category: "fat",
    portionLabel: "20 g",
    weeklyPortions: [2, 4],
    protein: 1,
    carbs: 1,
    fat: 7,
    calories: 70,
    pricePerPortionEco: 0.12,
    pricePerPortionStandard: 0.16,
    pricePerPortionBio: 0.24,
    packLabel: "1 brique de 20 cl",
    packSizeInPortions: 10,
    packPriceEco: 1.20,
    packPriceStandard: 1.60,
    packPriceBio: 2.40,
  },

  {
    id: "avocado",
    name: "Avocat",
    category: "fat",
    portionLabel: "1/2 avocat",
    weeklyPortions: [1, 4],
    protein: 2,
    carbs: 4,
    fat: 11,
    calories: 130,
    pricePerPortionEco: 0.55,
    pricePerPortionStandard: 0.75,
    pricePerPortionBio: 1.05,
    packLabel: "2 avocats",
    packSizeInPortions: 4,
    packPriceEco: 2.20,
    packPriceStandard: 3.00,
    packPriceBio: 4.20,
  },

  {
    id: "peanut_butter",
    name: "Beurre de cacahuète",
    category: "fat",
    portionLabel: "20 g",
    weeklyPortions: [1, 4],
    protein: 5,
    carbs: 3,
    fat: 10,
    calories: 125,
    pricePerPortionEco: 0.16,
    pricePerPortionStandard: 0.22,
    pricePerPortionBio: 0.34,
    packLabel: "1 pot de 350 g",
    packSizeInPortions: 17,
    packPriceEco: 2.72,
    packPriceStandard: 3.74,
    packPriceBio: 5.78,
  },
];

export function getPricePerPortion(item: FoodItem, mode: PriceMode): number {
  let price = 0;

  if (mode === "eco") {
    price = item.pricePerPortionEco ?? item.pricePerPortionStandard ?? item.pricePerPortionBio ?? 0;
  } else if (mode === "bio") {
    price = item.pricePerPortionBio ?? item.pricePerPortionStandard ?? item.pricePerPortionEco ?? 0;
  } else {
    price = item.pricePerPortionStandard ?? item.pricePerPortionEco ?? item.pricePerPortionBio ?? 0;
  }

  return Math.round(Number(price) * 100) / 100;
}

export function getWeeklyCostRange(
  item: FoodItem,
  mode: PriceMode
): { min: number; max: number; usesPack: boolean } {
  const [rawMin, rawMax] = item.weeklyPortions ?? [1, 1];

  const minPortions = Number(rawMin ?? 0);
  const maxPortions = Number(rawMax ?? 0);

  let packPrice: number | undefined;

  if (mode === "eco") {
    packPrice = item.packPriceEco ?? item.packPriceStandard ?? item.packPriceBio;
  } else if (mode === "bio") {
    packPrice = item.packPriceBio ?? item.packPriceStandard ?? item.packPriceEco;
  } else {
    packPrice = item.packPriceStandard ?? item.packPriceEco ?? item.packPriceBio;
  }

  const packSize = Number(item.packSizeInPortions ?? 0);

  if (packPrice != null && packSize > 0) {
    const minPacks = Math.ceil(minPortions / packSize);
    const maxPacks = Math.ceil(maxPortions / packSize);

    return {
      min: Math.round(minPacks * Number(packPrice) * 100) / 100,
      max: Math.round(maxPacks * Number(packPrice) * 100) / 100,
      usesPack: true,
    };
  }

  const pricePerPortion = getPricePerPortion(item, mode);

  return {
    min: Math.round(minPortions * pricePerPortion * 100) / 100,
    max: Math.round(maxPortions * pricePerPortion * 100) / 100,
    usesPack: false,
  };
}

export function getWeeklyBudgetRange(items: FoodItem[], mode: PriceMode) {
  try {
    const safeItems = Array.isArray(items) ? items : [];

    const total = safeItems.reduce(
      (acc, item) => {
        try {
          const range = getWeeklyCostRange(item, mode);

          acc.min += Number.isFinite(range?.min) ? range.min : 0;
          acc.max += Number.isFinite(range?.max) ? range.max : 0;
        } catch (e) {
          console.log("getWeeklyBudgetRange item error", item?.id, e);
        }

        return acc;
      },
      { min: 0, max: 0 }
    );

    return {
      min: Math.round(total.min * 100) / 100,
      max: Math.round(total.max * 100) / 100,
    };
  } catch (e) {
    console.log("getWeeklyBudgetRange global error", e);
    return { min: 0, max: 0 };
  }
}
  

export function euro(n?: number | null) {
  const safe = Number(n ?? 0);
  const finalValue = Number.isFinite(safe) ? safe : 0;
  return `${finalValue.toFixed(2).replace(".", ",")}€`;
}