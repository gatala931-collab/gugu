export type Goal = "lose" | "gain" | "maintain" | "healthy";
export type Sex = "male" | "female" | "other";
export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export type Profile = {
  name: string;
  country: string;
  goal: Goal;
  budget: number;
  age: number;
  sex: Sex;
  height: number;
  weight: number;
  targetWeight: number;
  activity: string;
  diet: string;
  obstacles: string[];
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
};

export type Food = {
  id: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cost: number;
  emoji: string;
};

export type FoodLog = Food & { logId: string; meal: MealType; time: string };

export type SuggestedMeal = {
  id: string;
  name: string;
  category: MealType;
  emoji: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cost: number;
  prepTime: string;
  tag: string;
  whyForYou: string;
  ingredients: string[];
};

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

export type NourishState = {
  onboarded: boolean;
  profile: Profile;
  logs: FoodLog[];
  water: number;
  favorites: string[];
  weightHistory: { label: string; value: number }[];
  notifications: boolean;
  units: "metric" | "imperial";
};

export const foods: Food[] = [
  { id: "ugali", name: "Ugali", serving: "1 cup", calories: 365, protein: 8, carbs: 79, fat: 2, cost: 35, emoji: "◒" },
  { id: "sukuma", name: "Sukuma wiki", serving: "1 cup", calories: 65, protein: 4, carbs: 9, fat: 2, cost: 25, emoji: "♧" },
  { id: "beans", name: "Stewed beans", serving: "1 cup", calories: 245, protein: 15, carbs: 44, fat: 2, cost: 45, emoji: "●" },
  { id: "githeri", name: "Githeri", serving: "1 bowl", calories: 390, protein: 17, carbs: 70, fat: 6, cost: 90, emoji: "◉" },
  { id: "chapati", name: "Chapati", serving: "1 piece", calories: 210, protein: 5, carbs: 36, fat: 6, cost: 30, emoji: "◯" },
  { id: "avocado", name: "Avocado", serving: "½ fruit", calories: 160, protein: 2, carbs: 9, fat: 15, cost: 45, emoji: "◆" },
  { id: "egg", name: "Boiled egg", serving: "1 large", calories: 74, protein: 6, carbs: 1, fat: 5, cost: 25, emoji: "◍" },
  { id: "rice", name: "Steamed rice", serving: "1 cup", calories: 205, protein: 4, carbs: 45, fat: 1, cost: 40, emoji: "✦" },
  { id: "chicken", name: "Grilled chicken", serving: "120 g", calories: 230, protein: 36, carbs: 0, fat: 9, cost: 180, emoji: "◈" },
  { id: "banana", name: "Banana", serving: "1 medium", calories: 105, protein: 1, carbs: 27, fat: 0, cost: 20, emoji: "◡" },
  { id: "omena", name: "Omena", serving: "1 cup", calories: 180, protein: 27, carbs: 4, fat: 6, cost: 80, emoji: "≈" },
  { id: "porridge", name: "Millet porridge", serving: "1 bowl", calories: 190, protein: 5, carbs: 39, fat: 2, cost: 35, emoji: "∪" },
];

export const suggestedMeals: SuggestedMeal[] = [
  {
    id: "sugg-1",
    name: "Ugali & Sukuma Wiki with 2 Eggs",
    category: "Dinner",
    emoji: "🍳",
    serving: "1 plate",
    calories: 480,
    protein: 20,
    carbs: 81,
    fat: 11,
    cost: 85,
    prepTime: "15 min",
    tag: "Budget Classic",
    whyForYou: "High-fiber greens with quick complete protein. Leaves plenty of room in today's food budget.",
    ingredients: ["1 cup white ugali", "1 cup sauteed sukuma wiki", "2 boiled or pan-fried eggs"],
  },
  {
    id: "sugg-2",
    name: "Githeri with Fresh Avocado",
    category: "Lunch",
    emoji: "🥑",
    serving: "1 bowl",
    calories: 550,
    protein: 19,
    carbs: 79,
    fat: 21,
    cost: 135,
    prepTime: "10 min",
    tag: "Sustained Energy",
    whyForYou: "Slow-digesting plant fiber and heart-healthy monounsaturated fats keep you satisfied all afternoon.",
    ingredients: ["1 large bowl stewed githeri (maize & beans)", "½ ripe avocado with lemon slice"],
  },
  {
    id: "sugg-3",
    name: "Grilled Chicken with Steamed Rice & Greens",
    category: "Dinner",
    emoji: "🍗",
    serving: "1 plate",
    calories: 500,
    protein: 44,
    carbs: 54,
    fat: 11,
    cost: 245,
    prepTime: "25 min",
    tag: "High Protein",
    whyForYou: "Powerhouse 44g protein plate designed to accelerate muscle recovery and maintain fullness.",
    ingredients: ["150g seasoned grilled chicken breast", "1 cup steamed fragrant rice", "Sauteed spinach"],
  },
  {
    id: "sugg-4",
    name: "Stewed Yellow Beans with 2 Soft Chapatis",
    category: "Lunch",
    emoji: "🫓",
    serving: "1 serving",
    calories: 665,
    protein: 25,
    carbs: 116,
    fat: 14,
    cost: 105,
    prepTime: "15 min",
    tag: "Crowd Favorite",
    whyForYou: "Maximizes energy and protein at just KSh 105 without breaking your daily allowance.",
    ingredients: ["1 rich bowl simmered beans in tomato gravy", "2 warm layered wheat chapatis"],
  },
  {
    id: "sugg-5",
    name: "Crispy Omena Stew with Ugali & Kachumbari",
    category: "Dinner",
    emoji: "🐟",
    serving: "1 plate",
    calories: 545,
    protein: 35,
    carbs: 83,
    fat: 8,
    cost: 120,
    prepTime: "20 min",
    tag: "Omega-3 Superfood",
    whyForYou: "Exceptional source of calcium, iron, and zinc. High protein at an unbeatable price point.",
    ingredients: ["1 cup fried omena with onions & tomatoes", "1 cup warm ugali", "Fresh diced kachumbari"],
  },
  {
    id: "sugg-6",
    name: "Warm Millet Porridge & Boiled Egg with Banana",
    category: "Breakfast",
    emoji: "🥣",
    serving: "1 bowl + sides",
    calories: 369,
    protein: 12,
    carbs: 67,
    fat: 7,
    cost: 80,
    prepTime: "10 min",
    tag: "Clean Morning Fuel",
    whyForYou: "Whole-grain complex carbs combined with complete protein to prevent mid-morning crashes.",
    ingredients: ["1 bowl fermented millet uji", "1 boiled egg", "1 medium sweet banana"],
  },
  {
    id: "sugg-7",
    name: "Sliced Avocado & Boiled Eggs with Kachumbari",
    category: "Breakfast",
    emoji: "🥗",
    serving: "1 bowl",
    calories: 310,
    protein: 14,
    carbs: 12,
    fat: 24,
    cost: 90,
    prepTime: "5 min",
    tag: "Low Carb",
    whyForYou: "Great for fat adaptation or keto: zero refined carbs, packed with healthy fats and electrolytes.",
    ingredients: ["2 large boiled eggs", "½ sliced fresh avocado", "Tomato, coriander & lime salad"],
  },
  {
    id: "sugg-8",
    name: "Matoke Green Banana Stew with Tender Beef",
    category: "Dinner",
    emoji: "🍲",
    serving: "1 bowl",
    calories: 520,
    protein: 32,
    carbs: 68,
    fat: 14,
    cost: 210,
    prepTime: "30 min",
    tag: "Hearty & Nourishing",
    whyForYou: "Potassium-rich plantains with highly absorbable heme iron and savory broth.",
    ingredients: ["3 stewed green plantains (matoke)", "100g cubed beef chunks", "Carrots & onions in rich stew"],
  },
  {
    id: "sugg-9",
    name: "Banana with Roasted Peanuts (Njugu)",
    category: "Snack",
    emoji: "🥜",
    serving: "1 handful",
    calories: 265,
    protein: 9,
    carbs: 33,
    fat: 12,
    cost: 45,
    prepTime: "1 min",
    tag: "Pocket Snack",
    whyForYou: "Instant natural energy under KSh 50. Convenient to grab from street vendors or pack in advance.",
    ingredients: ["1 sweet ripe banana", "30g lightly roasted Kenyan peanuts"],
  },
];

export const defaultProfile: Profile = {
  name: "Guyo",
  country: "Kenya",
  goal: "healthy",
  budget: 12000,
  age: 28,
  sex: "male",
  height: 175,
  weight: 72,
  targetWeight: 68,
  activity: "Moderately active",
  diet: "Balanced",
  obstacles: ["Unhealthy eating habits"],
  calorieTarget: 2050,
  proteinTarget: 120,
  carbTarget: 245,
  fatTarget: 68,
};

export const defaultState: NourishState = {
  onboarded: false,
  profile: defaultProfile,
  logs: [],
  water: 3,
  favorites: ["githeri", "egg"],
  weightHistory: [
    { label: "Apr", value: 75 },
    { label: "May", value: 74.4 },
    { label: "Jun", value: 73.8 },
    { label: "Jul", value: 73.2 },
    { label: "Aug", value: 72.7 },
    { label: "Sep", value: 72 },
  ],
  notifications: true,
  units: "metric",
};

export function calculateTargets(profile: Profile): Profile {
  const base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
  const sexAdjustment = profile.sex === "male" ? 5 : profile.sex === "female" ? -161 : -78;
  const multipliers: Record<string, number> = {
    "Lightly active": 1.35,
    "Moderately active": 1.5,
    "Very active": 1.7,
  };
  const goalAdjustment = profile.goal === "lose" ? -350 : profile.goal === "gain" ? 350 : 0;
  const calories = Math.max(1200, Math.round((base + sexAdjustment) * (multipliers[profile.activity] ?? 1.35) + goalAdjustment));
  return {
    ...profile,
    calorieTarget: calories,
    proteinTarget: Math.round(profile.weight * 1.6),
    fatTarget: Math.round((calories * 0.28) / 9),
    carbTarget: Math.round((calories - profile.weight * 1.6 * 4 - calories * 0.28) / 4),
  };
}

export function getTotals(logs: FoodLog[]) {
  return logs.reduce(
    (total, item) => ({
      calories: total.calories + item.calories,
      protein: total.protein + item.protein,
      carbs: total.carbs + item.carbs,
      fat: total.fat + item.fat,
      cost: total.cost + item.cost,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 },
  );
}

export function demoCoachReply(message: string, state: NourishState) {
  const totals = getTotals(state.logs);
  const remaining = Math.max(0, state.profile.calorieTarget - totals.calories);
  const dailyBudget = Math.round(state.profile.budget / 30);
  const budgetLeft = Math.max(0, dailyBudget - totals.cost);
  const lower = message.toLowerCase();

  if (lower.includes("protein")) {
    return `You have logged ${totals.protein}g protein today. Aim for another ${Math.max(0, state.profile.proteinTarget - totals.protein)}g — eggs with beans would be an affordable fit.`;
  }
  if (lower.includes("cheap") || lower.includes("budget")) {
    return `You have about KSh ${budgetLeft} left in today's food budget. Githeri or beans with sukuma wiki will keep you full without stretching it.`;
  }
  if (lower.includes("eat") || lower.includes("meal")) {
    return `You have ${remaining} calories remaining. Try grilled chicken, sukuma wiki and a small serving of ugali — balanced, local, and around KSh 240.`;
  }
  if (lower.includes("too much") || lower.includes("over")) {
    return "One meal does not undo your progress. Keep your next meal vegetable-forward, drink water, and return to your usual plan — no compensation needed.";
  }
  return `Based on today's ${totals.calories} calories and your ${state.profile.goal === "lose" ? "weight-loss" : "wellness"} goal, focus next on protein and vegetables. What food options do you have nearby?`;
}
