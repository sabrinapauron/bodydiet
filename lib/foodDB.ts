export type PriceMode = "eco" | "standard" | "bio";

export type FoodItem = {
  id: string;
  name: string;
  category:
    | "protein"
    | "carb"
    | "fat"
    | "veg"
    | "fruit"
    | "dairy"
    | "snack";
  portionLabel: string;

  protein: number;
  carbs: number;
  fat: number;
  calories: number;

  priceEco: number;
  priceStandard: number;
  priceBio: number;
};

export const FOOD_DB: FoodItem[] = [

  // PROTEINES
  {
    id: "chicken",
    name: "Poulet",
    category: "protein",
    portionLabel: "150 g",
    protein: 32,
    carbs: 0,
    fat: 4,
    calories: 180,
    priceEco: 1.8,
    priceStandard: 2.6,
    priceBio: 3.8,
  },

  {
    id: "eggs",
    name: "Œufs",
    category: "protein",
    portionLabel: "2 œufs",
    protein: 14,
    carbs: 1,
    fat: 10,
    calories: 155,
    priceEco: 0.7,
    priceStandard: 1.1,
    priceBio: 1.6,
  },

  {
    id: "tuna",
    name: "Thon",
    category: "protein",
    portionLabel: "120 g",
    protein: 28,
    carbs: 0,
    fat: 1,
    calories: 130,
    priceEco: 1.4,
    priceStandard: 2,
    priceBio: 2.8,
  },

  {
    id: "skyr",
    name: "Skyr",
    category: "dairy",
    portionLabel: "150 g",
    protein: 17,
    carbs: 6,
    fat: 0,
    calories: 90,
    priceEco: 0.9,
    priceStandard: 1.3,
    priceBio: 1.9,
  },

  {
    id: "protein_yogurt",
    name: "Yaourt protéiné",
    category: "dairy",
    portionLabel: "1 pot",
    protein: 20,
    carbs: 12,
    fat: 2,
    calories: 150,
    priceEco: 1.1,
    priceStandard: 1.7,
    priceBio: 2.3,
  },

  {
    id: "protein_bar",
    name: "Barre protéinée",
    category: "snack",
    portionLabel: "1 barre",
    protein: 15,
    carbs: 20,
    fat: 7,
    calories: 200,
    priceEco: 1.4,
    priceStandard: 2.2,
    priceBio: 2.8,
  },

  // GLUCIDES
  {
    id: "rice",
    name: "Riz",
    category: "carb",
    portionLabel: "100 g cru",
    protein: 7,
    carbs: 77,
    fat: 1,
    calories: 360,
    priceEco: 0.35,
    priceStandard: 0.5,
    priceBio: 0.9,
  },

  {
    id: "whole_pasta",
    name: "Pâtes complètes",
    category: "carb",
    portionLabel: "100 g cru",
    protein: 12,
    carbs: 70,
    fat: 2,
    calories: 350,
    priceEco: 0.4,
    priceStandard: 0.6,
    priceBio: 1,
  },

  {
    id: "potatoes",
    name: "Pommes de terre",
    category: "carb",
    portionLabel: "200 g",
    protein: 4,
    carbs: 34,
    fat: 0,
    calories: 150,
    priceEco: 0.5,
    priceStandard: 0.8,
    priceBio: 1.4,
  },

  {
    id: "sweet_potato",
    name: "Patate douce",
    category: "carb",
    portionLabel: "200 g",
    protein: 4,
    carbs: 40,
    fat: 0,
    calories: 180,
    priceEco: 0.8,
    priceStandard: 1.2,
    priceBio: 1.9,
  },

  {
    id: "oats",
    name: "Flocons d'avoine",
    category: "carb",
    portionLabel: "60 g",
    protein: 8,
    carbs: 38,
    fat: 4,
    calories: 230,
    priceEco: 0.3,
    priceStandard: 0.5,
    priceBio: 0.9,
  },

  // LEGUMES
  {
    id: "spinach",
    name: "Épinards frais",
    category: "veg",
    portionLabel: "100 g",
    protein: 3,
    carbs: 4,
    fat: 0,
    calories: 23,
    priceEco: 0.7,
    priceStandard: 1.2,
    priceBio: 1.8,
  },

  {
    id: "zucchini",
    name: "Courgettes",
    category: "veg",
    portionLabel: "150 g",
    protein: 2,
    carbs: 4,
    fat: 0,
    calories: 20,
    priceEco: 0.5,
    priceStandard: 0.9,
    priceBio: 1.4,
  },

  {
    id: "carrots",
    name: "Carottes",
    category: "veg",
    portionLabel: "120 g",
    protein: 1,
    carbs: 10,
    fat: 0,
    calories: 40,
    priceEco: 0.3,
    priceStandard: 0.6,
    priceBio: 1,
  },

  {
    id: "parsnip",
    name: "Panais",
    category: "veg",
    portionLabel: "120 g",
    protein: 1,
    carbs: 18,
    fat: 0,
    calories: 75,
    priceEco: 0.6,
    priceStandard: 1,
    priceBio: 1.6,
  },

  // FRUITS
  {
    id: "banana",
    name: "Banane",
    category: "fruit",
    portionLabel: "1 banane",
    protein: 1,
    carbs: 23,
    fat: 0,
    calories: 90,
    priceEco: 0.25,
    priceStandard: 0.4,
    priceBio: 0.6,
  },

  {
    id: "apple",
    name: "Pomme",
    category: "fruit",
    portionLabel: "1 pomme",
    protein: 0,
    carbs: 20,
    fat: 0,
    calories: 80,
    priceEco: 0.3,
    priceStandard: 0.5,
    priceBio: 0.8,
  },

  // MATIERES GRASSES
  {
    id: "olive_oil",
    name: "Huile d'olive",
    category: "fat",
    portionLabel: "10 g",
    protein: 0,
    carbs: 0,
    fat: 10,
    calories: 90,
    priceEco: 0.15,
    priceStandard: 0.25,
    priceBio: 0.4,
  },

  {
    id: "cream",
    name: "Crème",
    category: "fat",
    portionLabel: "20 g",
    protein: 1,
    carbs: 1,
    fat: 7,
    calories: 70,
    priceEco: 0.2,
    priceStandard: 0.35,
    priceBio: 0.6,
  },

  {
    id: "brown_sugar",
    name: "Sucre complet",
    category: "carb",
    portionLabel: "10 g",
    protein: 0,
    carbs: 10,
    fat: 0,
    calories: 40,
    priceEco: 0.1,
    priceStandard: 0.15,
    priceBio: 0.25,
  },
];