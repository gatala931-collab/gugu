import express, { type Request, type Response } from "express";
import http from "http";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { demoCoachReply, type NourishState } from "./src/lib/nourish-data";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.GEMINI_API_KEY;

function getAiClient(): GoogleGenAI | null {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      return new GoogleGenAI({ apiKey: key });
    }
    return new GoogleGenAI({});
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI client:", err);
    return null;
  }
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // Health check endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // Coach AI endpoint
  app.post("/api/coach", async (req: Request, res: Response) => {
    const { message, history, context } = req.body || {};

    if (!message) {
      return res.status(400).json({ ok: false, error: "Missing message" });
    }

    const ai = getAiClient();
    if (ai) {
      try {
        const { profile, consumed } = context || {};
        const dailyBudget = Math.round((profile?.budget || 12000) / 30);
        const caloriesLeft = Math.max(0, (profile?.calorieTarget || 2000) - (consumed?.calories || 0));

        const systemPrompt = [
          "You are Nutry AI, a warm, practical nutrition assistant for everyday people in East Africa.",
          "Answer in plain language, 2-5 short sentences or a tight bullet list. No markdown headings.",
          "Always respect the user's calories left and money left for the day. Suggest affordable local foods.",
          "Never give medical advice or diagnose. Add no disclaimers; the app shows one already.",
          "",
          `User: ${profile?.name || "Friend"}, ${profile?.age || 28}, ${profile?.sex || "unspecified"}, ${profile?.country || "Kenya"}.`,
          `Goal: ${profile?.goal || "healthy"}. Diet: ${profile?.diet || "Balanced"}. Activity: ${profile?.activity || "Moderately active"}.`,
          `Body: ${profile?.weight || 70} kg, ${profile?.height || 175} cm, target ${profile?.targetWeight || 68} kg.`,
          `Daily targets: ${profile?.calorieTarget || 2050} kcal, ${profile?.proteinTarget || 120}g protein, ${profile?.carbTarget || 245}g carbs, ${profile?.fatTarget || 68}g fat.`,
          `Eaten today: ${consumed?.calories || 0} kcal, ${consumed?.protein || 0}g protein, ${consumed?.carbs || 0}g carbs, ${consumed?.fat || 0}g fat.`,
          `Calories left: ${caloriesLeft}.`,
          `Food budget: KSh ${dailyBudget}/day, KSh ${consumed?.cost || 0} already spent today.`,
          `Water: ${context?.water ?? 0} cups. Logged today: ${(context?.loggedToday || []).join(", ") || "nothing yet"}.`,
        ].join("\n");

        const formattedContents = [
          ...(Array.isArray(history) ? history.slice(-6) : []).map((msg: { role: string; content: string }) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          })),
          {
            role: "user",
            parts: [{ text: message }],
          },
        ];

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: formattedContents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          },
        });

        const replyText = response.text?.trim();
        if (replyText) {
          return res.json({ ok: true, text: replyText });
        }
      } catch (geminiError) {
        console.warn("Gemini coach call encountered issue, falling back to local coach reply:", geminiError);
      }
    }

    // Fallback coach reply
    const mockState: NourishState = {
      onboarded: true,
      profile: context?.profile || {
        name: "Friend",
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
        obstacles: [],
        calorieTarget: 2050,
        proteinTarget: 120,
        carbTarget: 245,
        fatTarget: 68,
      },
      logs: (context?.loggedToday || []).map((name: string, idx: number) => ({
        id: `mock-${idx}`,
        name,
        serving: "1 serving",
        calories: 300,
        protein: 15,
        carbs: 40,
        fat: 5,
        cost: 60,
        emoji: "◉",
        logId: `log-${idx}`,
        meal: "Lunch" as const,
        time: "1:00 PM",
      })),
      water: context?.water || 3,
      favorites: [],
      weightHistory: [],
      notifications: true,
      units: "metric",
    };

    const fallbackText = demoCoachReply(message, mockState);
    return res.json({ ok: true, text: fallbackText });
  });

  // Meal Suggestion AI endpoint
  app.post("/api/suggest-meal", async (req: Request, res: Response) => {
    const { category, prompt, context } = req.body || {};
    const { profile, consumed } = context || {};
    const dailyBudget = Math.round((profile?.budget || 12000) / 30);
    const caloriesLeft = Math.max(0, (profile?.calorieTarget || 2050) - (consumed?.calories || 0));
    const budgetLeft = Math.max(0, dailyBudget - (consumed?.cost || 0));
    const country = profile?.country || "Kenya";

    const ai = getAiClient();
    if (ai) {
      try {
        const systemPrompt = `You are Nutry AI's expert meal planner for ${country} and East Africa.
Generate 3 realistic, healthy, and culturally authentic meal suggestions tailored to the user's specific targets:
- Goal: ${profile?.goal || "healthy"}
- Diet preference: ${profile?.diet || "Balanced"}
- Remaining calories for today: ${caloriesLeft} kcal
- Remaining food budget for today: KSh ${budgetLeft} (Daily budget: KSh ${dailyBudget})
- Category requested: ${category || "any"}
- Specific request: ${prompt || "standard healthy meal"}

Ensure realistic local dish names (like Ugali with Sukuma & Eggs, Githeri with Avocado, Grilled Tilapia, Stewed Beans with Chapati, Omena, Matoke stew, Millet uji, etc.), accurate portion sizes, macro counts (calories, protein, carbs, fat), local street/home preparation cost in Kenyan Shillings (KSh), and prep time. Return only valid JSON.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [
            {
              role: "user",
              parts: [{ text: `Generate 3 ${category || "balanced"} meal suggestions for ${country}. Prompt: ${prompt || "healthy local meals"}` }],
            },
          ],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                meals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      category: { type: "string", enum: ["Breakfast", "Lunch", "Dinner", "Snack"] },
                      emoji: { type: "string" },
                      serving: { type: "string" },
                      calories: { type: "number" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" },
                      cost: { type: "number" },
                      prepTime: { type: "string" },
                      tag: { type: "string" },
                      whyForYou: { type: "string" },
                      ingredients: { type: "array", items: { type: "string" } },
                    },
                    required: ["name", "category", "emoji", "serving", "calories", "protein", "carbs", "fat", "cost", "prepTime", "tag", "whyForYou", "ingredients"],
                  },
                },
              },
              required: ["meals"],
            },
          },
        });

        const rawJson = response.text?.trim();
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          if (Array.isArray(parsed.meals) && parsed.meals.length > 0) {
            const mealsWithIds = parsed.meals.map((m: any, idx: number) => ({
              ...m,
              id: `ai-meal-${Date.now()}-${idx}`,
              calories: Math.round(m.calories),
              protein: Math.round(m.protein),
              carbs: Math.round(m.carbs),
              fat: Math.round(m.fat),
              cost: Math.round(m.cost),
            }));
            return res.json({ ok: true, meals: mealsWithIds });
          }
        }
      } catch (err) {
        console.warn("Gemini meal suggestion call failed, falling back to local dataset:", err);
      }
    }

    // Dynamic contextual fallback suggestions based on category, prompt, and user targets
    const fallbackMealsList = [
      {
        id: `fb-1-${Date.now()}`,
        name: prompt && prompt.toLowerCase().includes("egg") ? "Scrambled Eggs with Spinach & Sweet Potato" : "High-Protein Dengu (Green Grams) with Steamed Rice",
        category: (category && ["Breakfast", "Lunch", "Dinner", "Snack"].includes(category) ? category : "Lunch") as "Breakfast" | "Lunch" | "Dinner" | "Snack",
        emoji: "🍲",
        serving: "1 medium plate",
        calories: Math.min(650, Math.max(380, Math.round(caloriesLeft * 0.45) || 520)),
        protein: 26,
        carbs: 72,
        fat: 10,
        cost: Math.min(budgetLeft || 150, 110),
        prepTime: "25 min",
        tag: "Budget Protein",
        whyForYou: `Fits your ${profile?.goal || "healthy"} goal with 26g clean protein while using only KSh 110 of your daily food budget.`,
        ingredients: ["1 cup boiled green grams (dengu)", "1 cup steamed white or brown rice", "Fresh diced tomatoes, onions & cilantro"],
      },
      {
        id: `fb-2-${Date.now()}`,
        name: prompt && prompt.toLowerCase().includes("protein") ? "Grilled Chicken Strips with Sukuma & Ugali" : "Sukuma Wiki & Tomato Scramble with Hot Ugali",
        category: (category && ["Breakfast", "Lunch", "Dinner", "Snack"].includes(category) ? category : "Dinner") as "Breakfast" | "Lunch" | "Dinner" | "Snack",
        emoji: "🥗",
        serving: "1 standard plate",
        calories: Math.min(580, Math.max(320, Math.round(caloriesLeft * 0.4) || 480)),
        protein: prompt && prompt.toLowerCase().includes("protein") ? 34 : 20,
        carbs: 64,
        fat: 8,
        cost: prompt && prompt.toLowerCase().includes("protein") ? 160 : 85,
        prepTime: "15 min",
        tag: "Quick & Wholesome",
        whyForYou: `High micronutrient density with collard greens (vitamins A, C, K) leaving ample calories for the rest of your day.`,
        ingredients: ["2 cups shredded sukuma wiki sauteed in light vegetable oil", "1 portion warm ugali", "Fresh tomatoes & scallions"],
      },
      {
        id: `fb-3-${Date.now()}`,
        name: category === "Snack" ? "Roasted Groundnuts & Fresh Banana" : "Creamy Red Bean & Pumpkin Stew with Chapati",
        category: (category && ["Breakfast", "Lunch", "Dinner", "Snack"].includes(category) ? category : "Dinner") as "Breakfast" | "Lunch" | "Dinner" | "Snack",
        emoji: category === "Snack" ? "🥜" : "🫓",
        serving: "1 serving",
        calories: category === "Snack" ? 270 : 490,
        protein: category === "Snack" ? 10 : 21,
        carbs: category === "Snack" ? 34 : 68,
        fat: category === "Snack" ? 12 : 11,
        cost: category === "Snack" ? 50 : 95,
        prepTime: "20 min",
        tag: "Fiber Champion",
        whyForYou: `Long-lasting satiety to curb unnecessary cravings and sustain your energy without energy slumps.`,
        ingredients: category === "Snack" ? ["1 ripe banana", "Handful of roasted peanuts"] : ["Slow-cooked red kidney beans", "Tender pumpkin slices", "1 soft whole-wheat chapati"],
      },
    ];

    return res.json({ ok: true, meals: fallbackMealsList });
  });

  // Food Scan AI endpoint
  app.post("/api/analyze-meal", async (req: Request, res: Response) => {
    const { imageBase64, mimeType, country, meal } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ ok: false, error: "Missing image" });
    }

    const ai = getAiClient();
    if (ai) {
      try {
        const prompt = `You identify food in photos and estimate nutrition. The user is in ${country || "Kenya"}; recognise local dishes (ugali, sukuma wiki, githeri, chapati, nyama choma, mandazi, matoke, pilau, omena, beans, rice). Estimate the whole plate as one entry, for a normal adult portion. Cost is the typical street/home cost of that portion in Kenyan shillings (KSh). Return only valid JSON.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: imageBase64,
                  },
                },
                { text: `This is the user's ${(meal || "lunch").toLowerCase()}. Identify it and estimate nutrition accurately.` },
              ],
            },
          ],
          config: {
            systemInstruction: prompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                name: { type: "string" },
                serving: { type: "string" },
                calories: { type: "number" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                cost: { type: "number" },
                emoji: { type: "string" },
                items: { type: "array", items: { type: "string" } },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                note: { type: "string" },
              },
              required: ["name", "serving", "calories", "protein", "carbs", "fat", "cost", "emoji", "items", "confidence", "note"],
            },
          },
        });

        const rawJson = response.text?.trim();
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          return res.json({
            ok: true,
            analysis: {
              food: {
                id: `scan-${Date.now()}`,
                name: parsed.name,
                serving: parsed.serving,
                calories: Math.round(parsed.calories),
                protein: Math.round(parsed.protein),
                carbs: Math.round(parsed.carbs),
                fat: Math.round(parsed.fat),
                cost: Math.round(parsed.cost),
                emoji: parsed.emoji || "◉",
              },
              items: parsed.items ?? [],
              confidence: parsed.confidence ?? "medium",
              note: parsed.note ?? "",
            },
          });
        }
      } catch (err) {
        console.warn("Vision model analysis failed, providing smart fallback estimation:", err);
      }
    }

    // Default recognition response when vision is unavailable
    return res.json({
      ok: true,
      analysis: {
        food: {
          id: `scan-${Date.now()}`,
          name: "Local Mixed Plate (Ugali & Sukuma)",
          serving: "1 standard plate",
          calories: 430,
          protein: 12,
          carbs: 88,
          fat: 4,
          cost: 65,
          emoji: "◒",
        },
        items: ["Ugali", "Sukuma wiki"],
        confidence: "medium",
        note: "Estimated local staple portion. You can adjust the details before saving.",
      },
    });
  });

  // Food Search AI endpoint
  app.post("/api/search-food", async (req: Request, res: Response) => {
    const { query, country } = req.body || {};
    if (!query || typeof query !== "string") {
      return res.status(400).json({ ok: false, error: "Missing query" });
    }

    const ai = getAiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Estimate the nutrition facts and typical local street/home portion price in ${country || "Kenya"} for 1 standard serving of "${query}". Return only valid JSON.`,
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                name: { type: "string" },
                serving: { type: "string" },
                calories: { type: "number" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                cost: { type: "number" },
                emoji: { type: "string" },
              },
              required: ["name", "serving", "calories", "protein", "carbs", "fat", "cost", "emoji"],
            },
          },
        });

        const raw = response.text?.trim();
        if (raw) {
          const parsed = JSON.parse(raw);
          return res.json({
            ok: true,
            food: {
              id: `ai-food-${Date.now()}`,
              name: parsed.name || query,
              serving: parsed.serving || "1 serving",
              calories: Math.round(parsed.calories || 300),
              protein: Math.round(parsed.protein || 10),
              carbs: Math.round(parsed.carbs || 40),
              fat: Math.round(parsed.fat || 8),
              cost: Math.round(parsed.cost || 80),
              emoji: parsed.emoji || "🍲",
            },
          });
        }
      } catch (e) {
        console.warn("AI food search failed, falling back:", e);
      }
    }

    return res.json({
      ok: true,
      food: {
        id: `ai-food-${Date.now()}`,
        name: query,
        serving: "1 standard serving",
        calories: 320,
        protein: 14,
        carbs: 45,
        fat: 8,
        cost: 85,
        emoji: "🍲",
      },
    });
  });

  // Serve static assets in production or use Vite middlewares in development
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: PORT,
        hmr: false,
        watch: null,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Nutry server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
