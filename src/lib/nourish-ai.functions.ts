import type { Food, MealType, Profile, SuggestedMeal } from "@/lib/nourish-data";

export type CoachContext = {
  profile: Profile;
  consumed: { calories: number; protein: number; carbs: number; fat: number; cost: number };
  water: number;
  loggedToday: string[];
};

export type MealAnalysis = {
  food: Food;
  items: string[];
  confidence: "high" | "medium" | "low";
  note: string;
};

export async function coachReply({
  data,
}: {
  data: {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
    context: CoachContext;
  };
}): Promise<{ ok: boolean; text: string }> {
  try {
    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn("coachReply client fetch failed, fallback to local coach:", error);
    return { ok: false, text: "" };
  }
}

export async function analyzeMeal({
  data,
}: {
  data: { imageBase64: string; mimeType: string; country: string; meal: MealType };
}): Promise<{ ok: boolean; analysis: MealAnalysis | null }> {
  try {
    const res = await fetch("/api/analyze-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn("analyzeMeal client fetch failed:", error);
    return { ok: false, analysis: null };
  }
}

export async function getMealSuggestions({
  data,
}: {
  data: {
    category?: string;
    prompt?: string;
    context: CoachContext;
  };
}): Promise<{ ok: boolean; meals: SuggestedMeal[] }> {
  try {
    const res = await fetch("/api/suggest-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn("getMealSuggestions fetch failed:", error);
    return { ok: false, meals: [] };
  }
}

export async function searchFoodAI({
  data,
}: {
  data: { query: string; country: string };
}): Promise<{ ok: boolean; food: Food | null }> {
  try {
    const res = await fetch("/api/search-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn("searchFoodAI fetch failed:", error);
    return { ok: false, food: null };
  }
}

export function useServerFn<TInput, TOutput>(fn: (input: TInput) => Promise<TOutput>) {
  return fn;
}
