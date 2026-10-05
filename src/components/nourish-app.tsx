import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Apple,
  ArrowLeft,
  BarChart3,
  Bell,
  Camera,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock,
  Droplets,
  Flame,
  Heart,
  Home,
  Leaf,
  Minus,
  PencilLine,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Target,
  Upload,
  Utensils,
  UtensilsCrossed,
  WalletCards,
  Smartphone,
  X,
  ChefHat,
  Bookmark,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useNourish } from "@/hooks/use-nourish";
import {
  calculateTargets,
  defaultProfile,
  foods,
  getTotals,
  suggestedMeals,
  type Food,
  type Goal,
  type MealType,
  type Profile,
  type SuggestedMeal,
} from "@/lib/nourish-data";
import mealImage from "@/assets/nourish-meal.jpg";
import { cn } from "@/lib/utils";
import {
  analyzeMeal,
  getMealSuggestions,
  searchFoodAI,
  useServerFn,
  type MealAnalysis,
} from "@/lib/nourish-ai.functions";
import { PWAInstallButton } from "@/components/PWAInstallButton";

type Tab = "home" | "meals" | "history" | "profile";
type AddMode = "menu" | "search" | "scan" | "manual" | null;

const goals: { value: Goal; label: string; detail: string; icon: string }[] = [
  { value: "lose", label: "Lose weight", detail: "Build a steady, sustainable calorie deficit", icon: "↓" },
  { value: "gain", label: "Gain weight", detail: "Add strength and healthy body mass", icon: "+" },
  { value: "maintain", label: "Maintain weight", detail: "Keep your current balance", icon: "=" },
  { value: "healthy", label: "Eat healthier", detail: "Improve your choices without pressure", icon: "♡" },
];

const countries = ["Kenya", "Uganda", "Tanzania", "Nigeria", "Ghana", "South Africa"];
const countryFlags: Record<string, string> = {
  Kenya: "🇰🇪",
  Uganda: "🇺🇬",
  Tanzania: "🇹🇿",
  Nigeria: "🇳🇬",
  Ghana: "🇬🇭",
  "South Africa": "🇿🇦",
};

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 font-black tracking-normal", compact ? "text-xl" : "text-2xl")}>
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
        <Leaf className="size-5" />
      </span>
      <span>Nutry AI</span>
    </div>
  );
}

function Ring({
  value,
  size = 118,
  children,
  accent = "stroke-primary",
}: {
  value: number;
  size?: number;
  children: React.ReactNode;
  accent?: string;
}) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" className="stroke-surface-strong" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          className={accent}
          strokeLinecap="round"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, value)))}
        />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}

// Android Bottom Navigation Gesture Bar
function AndroidGestureBar() {
  return (
    <div className="h-4 w-full flex items-center justify-center pb-1">
      <div className="h-1 w-32 rounded-full bg-foreground/30" />
    </div>
  );
}

function Onboarding({
  initial,
  onComplete,
}: {
  initial: Profile;
  onComplete: (profile: Profile) => void;
}) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(initial);
  const [generating, setGenerating] = useState(false);
  const steps = 10;
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((current) => ({ ...current, [key]: value }));
  const next = () => {
    if (step === 8) {
      setGenerating(true);
      window.setTimeout(() => {
        setGenerating(false);
        setStep(9);
      }, 1400);
      return;
    }
    if (step === 9) onComplete(calculateTargets(profile));
    else setStep((current) => Math.min(9, current + 1));
  };
  const panels = [
    <div key="welcome" className="flex min-h-[72vh] flex-col justify-between pt-8">
      <div>
        <Brand />
        <div className="mt-8 overflow-hidden rounded-[2rem] bg-surface shadow-xs">
          <img
            src={mealImage}
            alt="Ugali, greens, beans and avocado"
            width={1200}
            height={912}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      </div>
      <div className="pb-4 pt-6">
        <h1 className="text-3xl font-black leading-tight">
          Eat better.
          <br />
          Spend smarter.
        </h1>
        <p className="mt-3 text-base leading-6 text-muted-foreground">
          Smart meal suggestions and nutrition tracking that understand your local food, your body, and your budget.
        </p>
      </div>
    </div>,
    <Question key="country" title="Where are you from?" subtitle="We'll tailor foods and prices to where you live.">
      <div className="space-y-3">
        {countries.map((country) => (
          <Choice
            key={country}
            selected={profile.country === country}
            onClick={() => update("country", country)}
            icon={countryFlags[country] ?? "◉"}
            label={country}
          />
        ))}
      </div>
    </Question>,
    <Question key="goal" title="What's your main goal?" subtitle="This shapes your daily nutrition target.">
      <div className="space-y-3">
        {goals.map((goal) => (
          <Choice
            key={goal.value}
            selected={profile.goal === goal.value}
            onClick={() => update("goal", goal.value)}
            icon={goal.icon}
            label={goal.label}
            detail={goal.detail}
          />
        ))}
      </div>
    </Question>,
    <Question key="budget" title="What's your monthly food budget?" subtitle="We'll keep every recommendation realistic.">
      <div className="rounded-3xl bg-surface p-6 text-center">
        <p className="text-sm text-muted-foreground">Monthly budget</p>
        <div className="mt-2 flex items-baseline justify-center gap-2">
          <span className="text-xl font-bold">KSh</span>
          <span className="text-5xl font-black">{profile.budget.toLocaleString()}</span>
        </div>
        <Slider
          className="mt-8"
          min={5000}
          max={30000}
          step={500}
          value={[profile.budget]}
          onValueChange={([value]) => update("budget", value ?? 12000)}
        />
        <div className="mt-5 flex justify-between text-xs text-muted-foreground">
          <span>KSh 5k</span>
          <span>KSh 30k</span>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        About <strong className="text-foreground">KSh {Math.round(profile.budget / 30)}</strong> per day
      </p>
    </Question>,
    <Question key="body" title="Tell us about you" subtitle="We use this to estimate your energy needs.">
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Age" value={profile.age} suffix="years" onChange={(v) => update("age", v)} />
        <NumberField label="Height" value={profile.height} suffix="cm" onChange={(v) => update("height", v)} />
        <NumberField label="Weight" value={profile.weight} suffix="kg" onChange={(v) => update("weight", v)} />
        <NumberField
          label="Goal weight"
          value={profile.targetWeight}
          suffix="kg"
          onChange={(v) => update("targetWeight", v)}
        />
      </div>
    </Question>,
    <Question key="sex" title="Choose your sex" subtitle="This helps personalize your experience.">
      <div className="space-y-3">
        {(["male", "female", "other"] as const).map((sex) => (
          <Choice
            key={sex}
            selected={profile.sex === sex}
            onClick={() => update("sex", sex)}
            icon={sex === "male" ? "♂" : sex === "female" ? "♀" : "◇"}
            label={sex.charAt(0).toUpperCase() + sex.slice(1)}
          />
        ))}
      </div>
    </Question>,
    <Question key="activity" title="How active are you?" subtitle="Include work, walking and planned exercise.">
      <div className="space-y-3">
        {["Lightly active", "Moderately active", "Very active"].map((activity) => (
          <Choice
            key={activity}
            selected={profile.activity === activity}
            onClick={() => update("activity", activity)}
            icon="↗"
            label={activity}
          />
        ))}
      </div>
    </Question>,
    <Question key="diet" title="Do you follow a specific diet?" subtitle="We'll keep suggestions relevant to you.">
      <div className="space-y-3">
        {["Balanced", "Whole-food", "Vegetarian", "Vegan", "Low-carb"].map((diet) => (
          <Choice
            key={diet}
            selected={profile.diet === diet}
            onClick={() => update("diet", diet)}
            icon={diet === "Balanced" ? "◐" : "◌"}
            label={diet}
          />
        ))}
      </div>
    </Question>,
    <Question
      key="obstacle"
      title="What's stopping you from reaching your goals?"
      subtitle="Choose the biggest challenge right now."
    >
      <div className="space-y-3">
        {["Lack of consistency", "Unhealthy eating habits", "Lack of support", "Busy schedule", "Lack of meal options"].map(
          (item) => (
            <Choice
              key={item}
              selected={profile.obstacles.includes(item)}
              onClick={() => update("obstacles", [item])}
              icon="·"
              label={item}
            />
          )
        )}
      </div>
    </Question>,
    <PlanReady key="ready" profile={calculateTargets(profile)} />,
  ];
  if (generating)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
        <div className="relative mb-8 grid size-32 place-items-center rounded-full bg-surface">
          <Leaf className="size-12 animate-pulse text-primary" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Building your plan</p>
        <h1 className="mt-3 text-3xl font-black">Making every meal fit.</h1>
        <div className="mt-8 w-full max-w-xs space-y-3 text-left text-sm">
          <Status label="Calculating energy needs" />
          <Status label="Balancing your food budget" />
          <Status label="Curating smart local meal suggestions" />
        </div>
      </div>
    );
  return (
    <main className="mx-auto flex min-h-dvh max-w-mobile flex-col bg-background px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5">
      {step > 0 && (
        <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5 mt-2">
          <Button
            aria-label="Go back"
            variant="soft"
            size="icon"
            className="size-11 rounded-full"
            onClick={() => setStep((current) => current - 1)}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-strong">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(step / (steps - 1)) * 100}%` }}
            />
          </div>
        </header>
      )}
      <div className="flex-1">{panels[step]}</div>
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-mobile border-t border-border/70 bg-background/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur">
        <Button variant="nourish" size="pill" className="w-full" onClick={next}>
          {step === 0 ? "Get started" : step === 9 ? "View my plan" : "Continue"}
        </Button>
        {step === 0 && (
          <button
            className="mt-3 w-full text-center text-sm font-semibold text-muted-foreground"
            onClick={() => setStep(1)}
          >
            I already have an account
          </button>
        )}
      </div>
    </main>
  );
}

function Question({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="pt-8">
      <h1 className="text-3xl font-black leading-tight">{title}</h1>
      <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Choice({
  selected,
  onClick,
  icon,
  label,
  detail,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  detail?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "grid min-h-16 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border bg-background p-4 text-left transition active:scale-[0.99]",
        selected ? "border-2 border-primary bg-primary/5" : "border-border hover:bg-surface"
      )}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-xl font-bold">{icon}</span>
      <span className="min-w-0">
        <span className="block font-bold capitalize">{label}</span>
        {detail && <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{detail}</span>}
      </span>
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full border-2",
          selected ? "border-primary bg-primary" : "border-border"
        )}
      >
        {selected && <span className="size-2 rounded-full bg-primary-foreground" />}
      </span>
    </button>
  );
}

function NumberField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-2xl bg-surface p-4 block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="mt-2 flex items-baseline gap-1">
        <input
          className="min-w-0 flex-1 bg-transparent text-3xl font-black outline-none"
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </span>
    </label>
  );
}

function Status({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
      <span className="grid size-6 place-items-center rounded-full bg-success text-success-foreground">
        <Check className="size-4" />
      </span>
      {label}
    </div>
  );
}

function PlanReady({ profile }: { profile: Profile }) {
  const title =
    profile.goal === "lose"
      ? `Reach ${profile.targetWeight} kg steadily`
      : profile.goal === "gain"
      ? `Gain strength toward ${profile.targetWeight} kg`
      : "Build your healthiest routine";
  return (
    <section className="pt-8 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-8" />
      </span>
      <h1 className="mx-auto mt-6 max-w-sm text-3xl font-black leading-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">Your practical daily recommendation</p>
      <div className="mt-8 rounded-3xl bg-surface p-6 text-left">
        <p className="text-sm font-bold">Daily nutrition target</p>
        <div className="mt-4 rounded-2xl bg-background p-5">
          <p className="text-4xl font-black">{profile.calorieTarget.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Calories per day</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <MacroMini value={`${profile.proteinTarget}g`} label="Protein" tone="text-protein" />
          <MacroMini value={`${profile.carbTarget}g`} label="Carbs" tone="text-carbs" />
          <MacroMini value={`${profile.fatTarget}g`} label="Fats" tone="text-fat" />
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-border p-4 text-left">
        <p className="text-sm font-bold">Built around your life</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile.country} · KSh {profile.budget.toLocaleString()}/month · {profile.diet}
        </p>
      </div>
    </section>
  );
}

function MacroMini({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-background p-3 text-center">
      <span className={cn("text-lg font-black", tone)}>{value}</span>
      <span className="block text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function NourishApp() {
  const store = useNourish();
  const [tab, setTab] = useState<Tab>("home");
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  if (!store.hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Leaf className="size-10 animate-pulse text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nutry AI</p>
        </div>
      </div>
    );
  }

  if (!store.state.onboarded) {
    return <Onboarding initial={store.state.profile} onComplete={store.completeOnboarding} />;
  }

  return (
    <div className="min-h-dvh bg-neutral-950 sm:py-6 flex items-center justify-center p-0 select-none">
      {/* Authentic Android Chassis Container on Desktop */}
      <div className="relative mx-auto w-full max-w-[430px] min-h-dvh sm:min-h-[890px] bg-background shadow-2xl sm:rounded-[44px] sm:border-[10px] sm:border-neutral-900 sm:ring-1 sm:ring-white/10 overflow-hidden flex flex-col justify-between">
        {/* Android Physical Button Mockups on Desktop Frame */}
        <div className="absolute -left-[14px] top-36 w-1 h-12 bg-neutral-800 rounded-l-md hidden sm:block" />
        <div className="absolute -left-[14px] top-52 w-1 h-12 bg-neutral-800 rounded-l-md hidden sm:block" />
        <div className="absolute -right-[14px] top-40 w-1 h-16 bg-neutral-800 rounded-r-md hidden sm:block" />

        {/* Top Speaker Slit on Desktop Frame */}
        <div className="w-16 h-1 bg-neutral-800/80 rounded-full mx-auto mt-2 hidden sm:block z-30" />

        {/* Main App Content Viewport */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-24 scrollbar-none">
          {tab === "home" && (
            <HomeScreen
              store={store}
              onAdd={() => setAddMode("menu")}
              onExploreMeals={() => setTab("meals")}
              onToast={showToast}
            />
          )}
          {tab === "meals" && (
            <MealSuggestionsScreen
              store={store}
              onAddMeal={(food, meal) => {
                store.addFood(food, meal);
                showToast(`✓ Logged "${food.name}" to today's ${meal}!`);
              }}
              onToast={showToast}
            />
          )}
          {tab === "history" && <HistoryScreen store={store} />}
          {tab === "profile" && <ProfileScreen store={store} onToast={showToast} />}
        </div>

        {/* Android Floating Notification / Snackbar */}
        {toastMessage && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-2xl bg-neutral-900/95 text-white px-4 py-2.5 text-xs font-bold shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <Sparkles className="size-3.5 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Android Material 3 Bottom Nav */}
        <BottomNav tab={tab} onTab={setTab} onAdd={() => setAddMode("menu")} />

        {/* Android Home Navigation Gesture Handle */}
        <AndroidGestureBar />

        {/* Log Food Bottom Sheet */}
        {addMode && (
          <AddFoodSheet
            mode={addMode}
            setMode={setAddMode}
            onAdd={(food, meal) => {
              store.addFood(food, meal);
              setAddMode(null);
              showToast(`✓ Logged "${food.name}" (+${food.calories} cal)`);
            }}
            favorites={store.state.favorites}
            onFavorite={store.toggleFavorite}
            profile={store.state.profile}
          />
        )}
      </div>
    </div>
  );
}

function ScreenHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 pb-3 pt-4">
      <div className="min-w-0">
        <Brand compact />
        <h1 className="mt-3 truncate text-2xl font-black">{title}</h1>
      </div>
      {action}
    </header>
  );
}

function HomeScreen({
  store,
  onAdd,
  onExploreMeals,
  onToast,
}: {
  store: ReturnType<typeof useNourish>;
  onAdd: () => void;
  onExploreMeals?: () => void;
  onToast: (msg: string) => void;
}) {
  const { state } = store;
  const totals = getTotals(state.logs);
  const remaining = Math.max(0, state.profile.calorieTarget - totals.calories);
  const dailyBudget = Math.round(state.profile.budget / 30);
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Contextual recommendation based on current meal time
  const currentCategory: MealType = hour < 11 ? "Breakfast" : hour < 16 ? "Lunch" : "Dinner";
  const heroSuggested =
    suggestedMeals.find((m) => m.category === currentCategory) || suggestedMeals[0];

  const handleQuickLogHero = () => {
    store.addFood(
      {
        id: `hero-${Date.now()}`,
        name: heroSuggested.name,
        serving: heroSuggested.serving,
        calories: heroSuggested.calories,
        protein: heroSuggested.protein,
        carbs: heroSuggested.carbs,
        fat: heroSuggested.fat,
        cost: heroSuggested.cost,
        emoji: heroSuggested.emoji,
      },
      heroSuggested.category
    );
    onToast(`✓ Logged ${heroSuggested.name} to ${heroSuggested.category}!`);
  };

  return (
    <div>
      <div className="bg-home-wash px-5 pb-5 pt-4">
        <div className="flex items-center justify-between">
          <Brand compact />
          <div className="flex items-center gap-2">
            <PWAInstallButton compact />
            <span className="rounded-full bg-background px-3 py-1 text-xs font-bold border border-border flex items-center gap-1 shadow-2xs">
              <Flame className="size-3.5 text-accent-warm" /> 4 days
            </span>
          </div>
        </div>

        <div className="mt-3">
          <span className="text-xs font-semibold text-muted-foreground">{greeting},</span>
          <h2 className="text-xl font-black text-foreground truncate">{state.profile.name}</h2>
        </div>

        {/* Weekly streak dots */}
        <div className="mt-5 grid grid-cols-7 gap-1.5 text-center">
          {days.map((day, i) => (
            <div key={`${day}-${i}`}>
              <span
                className={cn(
                  "mx-auto grid size-8 place-items-center rounded-full border text-xs font-bold transition-all",
                  i < 4
                    ? "border-success bg-success/10 text-success"
                    : i === 4
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-transparent text-muted-foreground"
                )}
              >
                {day}
              </span>
              <span className="mt-1 block text-[10px] font-semibold text-muted-foreground">{23 + i}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="px-5 pt-5 space-y-4">
        {/* Calories and Spend Cards */}
        <div className="grid grid-cols-[1.1fr_.9fr] gap-3">
          <div className="rounded-3xl bg-surface p-4 shadow-2xs border border-border/40">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Calories Left</p>
            <div className="mt-3 flex justify-center">
              <Ring value={totals.calories / state.profile.calorieTarget}>
                <Flame className="mx-auto size-5 text-accent-warm" />
                <strong className="mt-0.5 block text-lg font-black">{remaining}</strong>
                <span className="text-[10px] text-muted-foreground">kcal left</span>
              </Ring>
            </div>
            <p className="mt-2 text-center text-xs font-bold text-muted-foreground">
              {totals.calories.toLocaleString()} / {state.profile.calorieTarget.toLocaleString()}
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-3xl bg-primary p-4 text-primary-foreground shadow-xs">
            <div>
              <WalletCards className="size-5" />
              <p className="mt-2 text-xs opacity-75 font-semibold">Today's spend</p>
              <p className="mt-0.5 text-2xl font-black">KSh {totals.cost}</p>
            </div>
            <div>
              <p className="text-[11px] opacity-75">
                KSh {Math.max(0, dailyBudget - totals.cost)} left today
              </p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary-foreground/20">
                <div
                  className="h-full rounded-full bg-primary-foreground transition-all"
                  style={{ width: `${Math.min(100, (totals.cost / dailyBudget) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Macro Bars */}
        <div className="grid grid-cols-3 gap-2">
          <MacroProgress label="Protein" value={totals.protein} target={state.profile.proteinTarget} tone="bg-protein" />
          <MacroProgress label="Carbs" value={totals.carbs} target={state.profile.carbTarget} tone="bg-carbs" />
          <MacroProgress label="Fats" value={totals.fat} target={state.profile.fatTarget} tone="bg-fat" />
        </div>

        {/* Water Tracker */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-surface/50 p-3.5">
          <span className="grid size-11 place-items-center rounded-2xl bg-water-soft text-water">
            <Droplets className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold">Hydration</p>
            <p className="text-xs text-muted-foreground">
              {state.water} cups · {state.water * 250} ml
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button
              aria-label="Remove a cup"
              size="icon"
              variant="outline"
              className="size-8 rounded-full"
              onClick={() => {
                store.setWater(state.water - 1);
                onToast("Updated water intake");
              }}
            >
              <Minus className="size-3.5" />
            </Button>
            <Button
              aria-label="Add a cup"
              size="icon"
              className="size-8 rounded-full"
              onClick={() => {
                store.setWater(state.water + 1);
                onToast("+1 Cup of water logged");
              }}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Meal Suggestion Spotlight Card */}
        <div className="rounded-3xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent-warm">
              <Sparkles className="size-3.5" />
              <span>Suggested for {currentCategory}</span>
            </div>
            <button
              onClick={onExploreMeals}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="mt-3 flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface text-2xl">
              {heroSuggested.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-black text-sm text-foreground truncate">{heroSuggested.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {heroSuggested.calories} kcal · {heroSuggested.protein}g protein · KSh {heroSuggested.cost}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 italic">
                "{heroSuggested.whyForYou}"
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              Ready in ~{heroSuggested.prepTime}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full text-xs font-bold"
                onClick={onExploreMeals}
              >
                More meals
              </Button>
              <Button
                variant="nourish"
                size="sm"
                className="h-8 rounded-full text-xs font-bold gap-1"
                onClick={handleQuickLogHero}
              >
                <Plus className="size-3.5" /> Log Meal
              </Button>
            </div>
          </div>
        </div>

        {/* Recently Logged Section */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Today's Meals</h2>
            <button onClick={onAdd} className="text-xs font-bold text-primary hover:underline">
              + Add food
            </button>
          </div>
          <div className="mt-2.5 space-y-2.5">
            {state.logs.length === 0 ? (
              <EmptyLog onAdd={onAdd} />
            ) : (
              state.logs.slice(0, 5).map((item) => <FoodLogRow key={item.logId} food={item} />)
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MacroProgress({
  label,
  value,
  target,
  tone,
}: {
  label: string;
  value: number;
  target: number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl bg-surface p-3 text-center border border-border/30">
      <div
        className={cn("mx-auto mb-2 h-1.5 rounded-full", tone)}
        style={{ width: `${Math.max(12, Math.min(100, (value / target) * 100))}%` }}
      />
      <strong className="block text-sm font-black">{value}g</strong>
      <span className="block text-[10px] text-muted-foreground">
        of {target}g {label}
      </span>
    </div>
  );
}

function FoodLogRow({ food }: { food: Food & { meal?: MealType; time?: string } }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-surface p-3 border border-border/40">
      <span className="grid size-11 place-items-center rounded-xl bg-background text-xl">{food.emoji}</span>
      <div className="min-w-0">
        <p className="truncate font-bold text-sm">{food.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          <Flame className="mr-0.5 inline size-3.5 text-accent-warm" />
          {food.calories} cal · {food.protein}g protein · KSh {food.cost}
        </p>
      </div>
      {food.time && <span className="self-start rounded-full bg-background px-2 py-0.5 text-[9px] font-bold text-muted-foreground">{food.time}</span>}
    </div>
  );
}

function EmptyLog({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-border p-6 text-center bg-surface/30">
      <Utensils className="mx-auto size-7 text-muted-foreground" />
      <p className="mt-2 text-sm font-bold">Nothing logged yet</p>
      <p className="mt-1 text-xs text-muted-foreground">Add your first meal to see today's balance.</p>
      <Button size="sm" className="mt-3 rounded-full text-xs font-bold" onClick={onAdd}>
        Add food
      </Button>
    </div>
  );
}

// Android Material 3 Navigation Bar
function BottomNav({
  tab,
  onTab,
  onAdd,
}: {
  tab: Tab;
  onTab: (tab: Tab) => void;
  onAdd: () => void;
}) {
  const items: { tab: Tab; icon: typeof Home; label: string }[] = [
    { tab: "home", icon: Home, label: "Home" },
    { tab: "meals", icon: Sparkles, label: "Suggestions" },
    { tab: "history", icon: BarChart3, label: "History" },
    { tab: "profile", icon: CircleUserRound, label: "Profile" },
  ];

  return (
    <nav
      aria-label="Android navigation"
      className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-5 items-center border-t border-border bg-background/95 px-2 pb-[calc(.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
    >
      {items.slice(0, 2).map((item) => (
        <NavButton key={item.tab} {...item} active={tab === item.tab} onClick={() => onTab(item.tab)} />
      ))}

      {/* Floating Action Button (FAB) for quick add */}
      <div className="flex justify-center">
        <Button
          aria-label="Add food"
          onClick={onAdd}
          className="size-13 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-transform"
          size="icon"
        >
          <Plus className="size-7" />
        </Button>
      </div>

      {items.slice(2).map((item) => (
        <NavButton key={item.tab} {...item} active={tab === item.tab} onClick={() => onTab(item.tab)} />
      ))}
    </nav>
  );
}

function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col items-center gap-1 py-1 transition-all active:scale-95",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "grid place-items-center rounded-full px-3 py-1 transition-colors",
          active ? "bg-primary/15" : "bg-transparent"
        )}
      >
        <Icon className="size-5" strokeWidth={active ? 2.6 : 2} />
      </span>
      <span className={cn("truncate text-[10px] font-bold", active ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
    </button>
  );
}

// Full-featured Meal Suggestions Screen
function MealSuggestionsScreen({
  store,
  onAddMeal,
  onToast,
}: {
  store: ReturnType<typeof useNourish>;
  onAddMeal: (food: Food, meal: MealType) => void;
  onToast: (msg: string) => void;
}) {
  const { state } = store;
  const totals = getTotals(state.logs);
  const remainingCalories = Math.max(0, state.profile.calorieTarget - totals.calories);
  const remainingProtein = Math.max(0, state.profile.proteinTarget - totals.protein);
  const dailyBudget = Math.round(state.profile.budget / 30);
  const budgetLeft = Math.max(0, dailyBudget - totals.cost);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiMeals, setAiMeals] = useState<SuggestedMeal[]>([]);
  const [loggedId, setLoggedId] = useState<string | null>(null);
  const [selectedMealForDetail, setSelectedMealForDetail] = useState<SuggestedMeal | null>(null);

  // Fridge / Pantry Chef state
  const [showPantryMode, setShowPantryMode] = useState(false);
  const [pantryIngredients, setPantryIngredients] = useState("");

  const categories = [
    "All",
    "Breakfast",
    "Lunch",
    "Dinner",
    "Snack",
    "High Protein",
    "Budget (≤ 100)",
    "Quick (< 15 min)",
  ];

  const quickPrompts = [
    "High protein lunch under KSh 150",
    "Light dinner for weight loss",
    "Quick breakfast with eggs",
    "Vegetarian staple under KSh 100",
    "Post-workout recovery",
  ];

  const handleGenerate = async (promptText?: string) => {
    const query = promptText !== undefined ? promptText : customPrompt;
    setLoading(true);
    try {
      const result = await getMealSuggestions({
        data: {
          category: selectedCategory === "All" ? undefined : selectedCategory,
          prompt: query.trim() || undefined,
          context: {
            profile: state.profile,
            consumed: totals,
            water: state.water,
            loggedToday: state.logs.map((l) => l.name),
          },
        },
      });
      if (result.ok && result.meals && result.meals.length > 0) {
        setAiMeals(result.meals);
        onToast(`Generated ${result.meals.length} fresh suggestions!`);
      }
    } catch (err) {
      console.warn("Failed to generate AI meal suggestions:", err);
      onToast("Generated local suggestions based on your plan.");
    }
    setLoading(false);
  };

  const handlePantryGenerate = async () => {
    if (!pantryIngredients.trim()) return;
    const query = `Create meals using ingredients I have at home: ${pantryIngredients.trim()}`;
    await handleGenerate(query);
    setShowPantryMode(false);
  };

  const allMeals = [...aiMeals, ...suggestedMeals];

  const filteredMeals = allMeals.filter((meal) => {
    if (selectedCategory === "All") return true;
    if (selectedCategory === "High Protein") return meal.protein >= 25 || meal.tag.toLowerCase().includes("protein");
    if (selectedCategory === "Budget (≤ 100)") return meal.cost <= 100;
    if (selectedCategory === "Quick (< 15 min)") {
      const mins = parseInt(meal.prepTime) || 20;
      return mins <= 15;
    }
    return meal.category === selectedCategory;
  });

  const handleLogMeal = (meal: SuggestedMeal) => {
    const foodItem: Food = {
      id: `sugg-${Date.now()}`,
      name: meal.name,
      serving: meal.serving,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      cost: meal.cost,
      emoji: meal.emoji,
    };
    onAddMeal(foodItem, meal.category);
    setLoggedId(meal.id);
    setTimeout(() => setLoggedId(null), 2000);
  };

  return (
    <div className="pb-8">
      <header className="px-5 pb-3 pt-4">
        <Brand compact />
        <div className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Meal Suggestions</h1>
            <p className="text-xs text-muted-foreground">Smart plates tailored to your remaining macros & budget</p>
          </div>
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-xs">
            <Sparkles className="size-5" />
          </span>
        </div>
      </header>

      {/* Target status bar */}
      <section className="px-5 pt-2">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface p-3 border border-border/40 shadow-2xs">
          <div className="text-center">
            <span className="block text-[10px] font-bold text-muted-foreground uppercase">Calories Left</span>
            <span className="text-sm font-black text-foreground">{remainingCalories.toLocaleString()} kcal</span>
          </div>
          <div className="text-center border-x border-border/80">
            <span className="block text-[10px] font-bold text-muted-foreground uppercase">Protein Need</span>
            <span className="text-sm font-black text-protein">{remainingProtein}g</span>
          </div>
          <div className="text-center">
            <span className="block text-[10px] font-bold text-muted-foreground uppercase">Budget Left</span>
            <span className="text-sm font-black text-foreground">KSh {budgetLeft}</span>
          </div>
        </div>
      </section>

      {/* Pantry / Fridge Chef toggle */}
      <section className="px-5 pt-3">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <ChefHat className="size-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-foreground">Pantry & Fridge Chef</p>
              <p className="text-[10px] text-muted-foreground">Build meals with items in your kitchen</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs rounded-full font-bold"
            onClick={() => setShowPantryMode(!showPantryMode)}
          >
            {showPantryMode ? "Hide" : "Open"}
          </Button>
        </div>

        {showPantryMode && (
          <div className="mt-2 rounded-2xl bg-surface p-3.5 border border-border animate-in fade-in duration-150">
            <p className="text-xs font-bold text-foreground mb-1.5">What ingredients do you have right now?</p>
            <Input
              value={pantryIngredients}
              onChange={(e) => setPantryIngredients(e.target.value)}
              placeholder="e.g. Eggs, tomatoes, spinach, sukuma, maize flour..."
              className="h-10 text-xs bg-background rounded-xl border-border"
            />
            <div className="mt-2.5 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs rounded-full"
                onClick={() => setShowPantryMode(false)}
              >
                Cancel
              </Button>
              <Button
                variant="nourish"
                size="sm"
                className="h-7 text-xs rounded-full font-bold gap-1"
                disabled={loading || !pantryIngredients.trim()}
                onClick={handlePantryGenerate}
              >
                <Sparkles className="size-3" /> Find Meals
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* AI Ask / Generator bar */}
      <section className="px-5 pt-3">
        <div className="rounded-3xl border border-border bg-surface p-3.5 shadow-2xs">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
            Ask AI for custom meal ideas
          </label>
          <div className="flex gap-2">
            <Input
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="e.g. Dinner under KSh 120 with beans..."
              className="h-10 rounded-2xl border-0 bg-background text-xs shadow-2xs"
            />
            <Button
              onClick={() => handleGenerate()}
              disabled={loading}
              className="h-10 rounded-2xl px-3.5 gap-1.5 text-xs font-bold shadow-2xs shrink-0"
              variant="nourish"
            >
              {loading ? (
                <div className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  <span>Generate</span>
                </>
              )}
            </Button>
          </div>

          {/* Quick filter chips */}
          <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  setCustomPrompt(prompt);
                  handleGenerate(prompt);
                }}
                className="shrink-0 rounded-full bg-background border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filter Chips */}
      <section className="px-5 pt-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface text-muted-foreground hover:bg-surface-strong"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Meals list */}
      <section className="px-5 pt-3 space-y-3.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {filteredMeals.length} curated options
          </p>
          {aiMeals.length > 0 && (
            <span className="text-[11px] font-bold text-accent-warm flex items-center gap-1">
              <Sparkles className="size-3" /> AI Tailored Active
            </span>
          )}
        </div>

        {filteredMeals.map((meal) => {
          const isJustLogged = loggedId === meal.id;
          const isFavorited = state.favorites.includes(meal.id);

          return (
            <div
              key={meal.id}
              className="rounded-3xl border border-border bg-card p-4 shadow-2xs transition-all hover:shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex items-center gap-3 min-w-0 cursor-pointer"
                  onClick={() => setSelectedMealForDetail(meal)}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface text-2xl">
                    {meal.emoji}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-black text-sm text-foreground truncate hover:text-primary transition-colors">
                      {meal.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{meal.category}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {meal.prepTime}
                      </span>
                      <span>·</span>
                      <span className="rounded-md bg-surface px-1.5 py-0.5 text-[9px] font-bold text-accent-warm">
                        {meal.tag}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => store.toggleFavorite(meal.id)}
                      className="text-muted-foreground hover:text-protein transition-colors p-1"
                    >
                      <Heart className={cn("size-4", isFavorited && "fill-protein text-protein")} />
                    </button>
                    <span className="text-sm font-black text-foreground">KSh {meal.cost}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{meal.serving}</span>
                </div>
              </div>

              {/* Macro breakdown */}
              <div className="mt-3 grid grid-cols-4 gap-1.5 rounded-2xl bg-surface p-2 text-center">
                <div>
                  <span className="block text-xs font-black text-foreground">{meal.calories}</span>
                  <span className="text-[9px] text-muted-foreground">kcal</span>
                </div>
                <div>
                  <span className="block text-xs font-black text-protein">{meal.protein}g</span>
                  <span className="text-[9px] text-muted-foreground">protein</span>
                </div>
                <div>
                  <span className="block text-xs font-black text-carbs">{meal.carbs}g</span>
                  <span className="text-[9px] text-muted-foreground">carbs</span>
                </div>
                <div>
                  <span className="block text-xs font-black text-fat">{meal.fat}g</span>
                  <span className="text-[9px] text-muted-foreground">fat</span>
                </div>
              </div>

              {/* Why it fits your plan */}
              <div className="mt-2.5 rounded-2xl bg-surface/60 p-2.5 border border-border/40">
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Why this fits: </strong>
                  {meal.whyForYou}
                </p>
              </div>

              {/* Action buttons */}
              <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
                <button
                  onClick={() => setSelectedMealForDetail(meal)}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <UtensilsCrossed className="size-3.5" /> Recipe & Prep
                </button>

                <Button
                  size="sm"
                  variant={isJustLogged ? "default" : "nourish"}
                  onClick={() => handleLogMeal(meal)}
                  className={cn(
                    "h-8 rounded-xl gap-1 px-3 text-xs font-bold shadow-2xs active:scale-95 transition-all",
                    isJustLogged && "bg-success text-success-foreground"
                  )}
                >
                  {isJustLogged ? (
                    <>
                      <Check className="size-3.5" />
                      <span>Logged!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="size-3.5" />
                      <span>Log Meal</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Recipe Detail Modal / Bottom Sheet */}
      {selectedMealForDetail && (
        <MealDetailSheet
          meal={selectedMealForDetail}
          onClose={() => setSelectedMealForDetail(null)}
          onLog={() => {
            handleLogMeal(selectedMealForDetail);
            setSelectedMealForDetail(null);
          }}
          caloriesLeft={remainingCalories}
          budgetLeft={budgetLeft}
        />
      )}
    </div>
  );
}

// Detailed Meal Bottom Sheet
function MealDetailSheet({
  meal,
  onClose,
  onLog,
  caloriesLeft,
  budgetLeft,
}: {
  meal: SuggestedMeal;
  onClose: () => void;
  onLog: () => void;
  caloriesLeft: number;
  budgetLeft: number;
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-end bg-overlay/50 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-h-[88%] overflow-y-auto rounded-t-[2.5rem] bg-background p-5 shadow-sheet border-t border-border/80">
        <div className="mx-auto h-1 w-10 rounded-full bg-border" />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-surface text-3xl">
              {meal.emoji}
            </span>
            <div>
              <span className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-bold text-accent-warm">
                {meal.category} · {meal.tag}
              </span>
              <h2 className="text-lg font-black text-foreground mt-0.5">{meal.name}</h2>
            </div>
          </div>
          <Button variant="soft" size="icon" className="size-8 rounded-full" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Nutrition Overview */}
        <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl bg-surface p-3 text-center">
          <div>
            <span className="block text-sm font-black text-foreground">{meal.calories}</span>
            <span className="text-[10px] text-muted-foreground">Calories</span>
          </div>
          <div>
            <span className="block text-sm font-black text-protein">{meal.protein}g</span>
            <span className="text-[10px] text-muted-foreground">Protein</span>
          </div>
          <div>
            <span className="block text-sm font-black text-carbs">{meal.carbs}g</span>
            <span className="text-[10px] text-muted-foreground">Carbs</span>
          </div>
          <div>
            <span className="block text-sm font-black text-fat">{meal.fat}g</span>
            <span className="text-[10px] text-muted-foreground">Fat</span>
          </div>
        </div>

        {/* Cost & Satiety */}
        <div className="mt-3 rounded-2xl border border-border p-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-muted-foreground">Local market price:</span>
            <strong className="block text-sm text-foreground">KSh {meal.cost}</strong>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground">Budget impact:</span>
            <span className="block font-bold text-success">
              Leaves KSh {Math.max(0, budgetLeft - meal.cost)}
            </span>
          </div>
        </div>

        {/* Why it fits */}
        <div className="mt-3 rounded-2xl bg-surface/70 p-3.5">
          <p className="text-xs font-bold text-foreground mb-1">Nutry AI Goal Fit</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{meal.whyForYou}</p>
        </div>

        {/* Ingredients Checklist */}
        {meal.ingredients && meal.ingredients.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Ingredients ({meal.serving})
            </p>
            <div className="space-y-1.5">
              {meal.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-foreground bg-surface/40 p-2 rounded-xl">
                  <Check className="size-3.5 text-primary shrink-0" />
                  <span>{ing}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-2">
          <Button variant="outline" size="pill" onClick={onClose}>
            Back
          </Button>
          <Button variant="nourish" size="pill" onClick={onLog} className="gap-1.5">
            <Plus className="size-4" /> Log this meal now
          </Button>
        </div>
      </div>
    </div>
  );
}

function HistoryScreen({ store }: { store: ReturnType<typeof useNourish> }) {
  const totals = getTotals(store.state.logs);
  return (
    <div>
      <ScreenHeader title="History" />
      <section className="px-5 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Summary value={totals.calories.toLocaleString()} label="Calories" />
          <Summary value={`${totals.protein}g`} label="Protein" />
          <Summary value={`KSh ${totals.cost}`} label="Spent" />
        </div>
        <h2 className="text-lg font-black pt-2">Today's Logged Items</h2>
        <div className="space-y-2.5">
          {store.state.logs.length ? (
            store.state.logs.map((item) => <FoodLogRow key={item.logId} food={item} />)
          ) : (
            <EmptyLog onAdd={() => undefined} />
          )}
        </div>
        <div className="rounded-3xl bg-surface p-4 border border-border/40">
          <p className="font-bold text-sm">Weekly Summary</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            You're building momentum with Nutry AI. Logging meals consistently ensures smart suggestions stay highly
            accurate for your calorie needs and food budget.
          </p>
        </div>
      </section>
    </div>
  );
}

function Summary({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-surface p-3 text-center border border-border/30">
      <strong className="block truncate text-base font-black">{value}</strong>
      <span className="text-[10px] text-muted-foreground font-semibold">{label}</span>
    </div>
  );
}

function ProgressScreen({ store }: { store: ReturnType<typeof useNourish> }) {
  const { profile, weightHistory } = store.state;
  const total = Math.abs(defaultProfile.weight - profile.targetWeight) || 1;
  const complete = Math.min(1, Math.abs(defaultProfile.weight - profile.weight) / total);
  const [range, setRange] = useState("90 Days");
  const [weight, setWeight] = useState(profile.weight);

  return (
    <div>
      <ScreenHeader title="Progress" />
      <section className="px-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-surface p-4 text-center border border-border/40">
            <Ring value={complete} size={95}>
              <Target className="mx-auto size-5" />
            </Ring>
            <p className="font-bold text-xs mt-2">Current weight</p>
            <p className="text-lg font-black">{profile.weight} kg</p>
          </div>
          <div className="rounded-3xl bg-surface p-4 text-center border border-border/40">
            <Ring value={Math.min(1, store.state.logs.length / 7)} size={95} accent="stroke-chart-blue">
              <Apple className="mx-auto size-5" />
            </Ring>
            <p className="font-bold text-xs mt-2">Days logged</p>
            <p className="text-lg font-black">{store.state.logs.length ? 1 : 0} logged</p>
          </div>
        </div>

        <div className="grid grid-cols-4 rounded-2xl bg-surface p-1 text-xs">
          {["90 Days", "6 Months", "1 Year", "All time"].map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={cn("rounded-xl px-1 py-1.5", range === item && "bg-background font-bold shadow-2xs")}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black">Goal progress</h2>
              <p className="text-xs text-muted-foreground">Target {profile.targetWeight} kg</p>
            </div>
            <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-bold text-success">
              {Math.round(complete * 100)}% done
            </span>
          </div>
          <WeightChart values={weightHistory} />
        </div>

        <div className="rounded-2xl bg-surface p-3.5 border border-border/40">
          <label className="text-xs font-bold">Log current weight</label>
          <div className="mt-2 flex gap-2">
            <Input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="h-9 text-xs"
            />
            <Button size="sm" className="rounded-xl h-9 text-xs font-bold" onClick={() => store.updateWeight(weight)}>
              Save
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function WeightChart({ values }: { values: { label: string; value: number }[] }) {
  const min = Math.min(...values.map((v) => v.value)) - 1;
  const max = Math.max(...values.map((v) => v.value)) + 1;
  const points = values
    .map(
      (v, i) =>
        `${20 + i * (260 / Math.max(1, values.length - 1))},${130 - ((v.value - min) / (max - min)) * 95}`
    )
    .join(" ");

  return (
    <div className="mt-4">
      <svg viewBox="0 0 300 155" className="w-full" role="img" aria-label="Weight trend">
        <path d="M20 35H280 M20 82H280 M20 130H280" className="stroke-border" strokeDasharray="4 5" />
        <polyline
          points={points}
          fill="none"
          className="stroke-primary"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {values.map((v, i) => (
          <circle
            key={`${v.label}-${i}`}
            cx={20 + i * (260 / Math.max(1, values.length - 1))}
            cy={130 - ((v.value - min) / (max - min)) * 95}
            r="4"
            className="fill-background stroke-primary"
            strokeWidth="3"
          />
        ))}
      </svg>
      <div
        className="grid text-center text-[10px] text-muted-foreground mt-1"
        style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}
      >
        {values.map((v, i) => (
          <span key={`${v.label}-label-${i}`} className="truncate">
            {v.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProfileScreen({
  store,
  onToast,
}: {
  store: ReturnType<typeof useNourish>;
  onToast: (msg: string) => void;
}) {
  const { profile } = store.state;
  return (
    <div>
      <ScreenHeader
        title="Profile"
        action={
          <Button variant="soft" size="icon" className="size-9 rounded-full">
            <Settings className="size-4" />
          </Button>
        }
      />
      <section className="px-5 space-y-4">
        <div className="flex items-center gap-3.5 rounded-3xl bg-primary p-4 text-primary-foreground shadow-xs">
          <span className="grid size-14 place-items-center rounded-full bg-primary-foreground text-primary">
            <CircleUserRound className="size-8" />
          </span>
          <div>
            <h2 className="text-lg font-black">{profile.name}</h2>
            <p className="text-xs opacity-80">
              {profile.country} · {profile.diet}
            </p>
            <span className="inline-block mt-1 text-[10px] rounded-full bg-primary-foreground/20 px-2 py-0.5 font-bold">
              Android Edition
            </span>
          </div>
        </div>

        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">Your Nutrition Plan</h3>
        <div className="divide-y divide-border overflow-hidden rounded-2xl bg-surface border border-border/40">
          <ProfileRow label="Goal" value={goals.find((g) => g.value === profile.goal)?.label ?? profile.goal} />
          <ProfileRow label="Daily calorie target" value={`${profile.calorieTarget} kcal`} />
          <ProfileRow label="Monthly food budget" value={`KSh ${profile.budget.toLocaleString()}`} />
          <ProfileRow label="Current body" value={`${profile.weight} kg · ${profile.height} cm`} />
        </div>

        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">Preferences</h3>
        <div className="divide-y divide-border overflow-hidden rounded-2xl bg-surface border border-border/40">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center p-3.5">
            <div>
              <p className="font-bold text-sm">Meal Reminders</p>
              <p className="text-[11px] text-muted-foreground">Notifications for hydration & smart meal ideas</p>
            </div>
            <Switch
              checked={store.state.notifications}
              onCheckedChange={() => {
                store.toggleNotifications();
                onToast("Preferences updated");
              }}
            />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center p-3.5">
            <div>
              <p className="font-bold text-sm">Units</p>
              <p className="text-[11px] text-muted-foreground">Metric or Imperial</p>
            </div>
            <div className="flex rounded-full bg-background p-1 text-xs">
              {(["metric", "imperial"] as const).map((unit) => (
                <button
                  key={unit}
                  className={cn(
                    "rounded-full px-2.5 py-1 capitalize",
                    store.state.units === unit && "bg-primary text-primary-foreground font-bold"
                  )}
                  onClick={() => store.setUnits(unit)}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Android App Install Card */}
        <div className="rounded-2xl bg-surface p-4 border border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="size-5" />
            </span>
            <div>
              <p className="font-bold text-sm">Android App</p>
              <p className="text-[11px] text-muted-foreground">Installed to Home Screen</p>
            </div>
          </div>
          <PWAInstallButton />
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            size="pill"
            className="w-full text-xs"
            onClick={() => {
              store.reset();
              onToast("Resetting onboarding...");
            }}
          >
            <RotateCcw className="size-3.5" /> Restart onboarding
          </Button>
        </div>
      </section>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3.5">
      <span className="font-bold text-xs">{label}</span>
      <span className="text-right text-xs text-muted-foreground font-semibold">{value}</span>
    </div>
  );
}

function AddChoice({
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  icon: typeof Camera;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-28 flex-col items-start justify-between rounded-3xl bg-surface p-4 text-left transition-colors hover:bg-surface-strong border border-border/40"
    >
      <span className="grid size-10 place-items-center rounded-full bg-background shadow-2xs">
        <Icon className="size-4" />
      </span>
      <span>
        <strong className="block text-sm">{title}</strong>
        <span className="text-[11px] text-muted-foreground">{detail}</span>
      </span>
    </button>
  );
}

function AddFoodSheet({
  mode,
  setMode,
  onAdd,
  favorites,
  onFavorite,
  profile,
}: {
  mode: Exclude<AddMode, null>;
  setMode: (mode: AddMode) => void;
  onAdd: (food: Food, meal: MealType) => void;
  favorites: string[];
  onFavorite: (id: string) => void;
  profile: Profile;
}) {
  const [meal, setMeal] = useState<MealType>("Lunch");
  const [query, setQuery] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const analyze = useServerFn(analyzeMeal);
  const [customFoods, setCustomFoods] = useState<Food[]>([]);
  const [searchingAI, setSearchingAI] = useState(false);

  const handleAiSearch = async () => {
    if (!query.trim()) return;
    setSearchingAI(true);
    try {
      const res = await searchFoodAI({ data: { query: query.trim(), country: profile.country } });
      if (res.ok && res.food) {
        setCustomFoods((prev) => [res.food!, ...prev]);
      }
    } catch (e) {
      console.warn("AI search error", e);
    }
    setSearchingAI(false);
  };

  const [manual, setManual] = useState<Food>({
    id: "manual",
    name: "",
    serving: "1 serving",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    cost: 0,
    emoji: "✎",
  });
  const filtered = foods.filter((food) => food.name.toLowerCase().includes(query.toLowerCase()));
  const allSearchFoods = [...customFoods, ...filtered];

  const startScan = async (event: FormEvent<HTMLInputElement>) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    setScanError(null);
    setAnalyzing(true);
    setAnalysis(null);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("read-failed"));
      reader.readAsDataURL(file);
    });
    setPreview(dataUrl);
    try {
      const result = await analyze({
        data: {
          imageBase64: dataUrl.split(",")[1] ?? "",
          mimeType: file.type || "image/jpeg",
          country: profile.country,
          meal,
        },
      });
      if (result.ok && result.analysis) setAnalysis(result.analysis);
      else setScanError("We couldn't read that photo. Try another one, or enter the meal yourself.");
    } catch {
      setScanError("We couldn't read that photo. Try another one, or enter the meal yourself.");
    }
    setAnalyzing(false);
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-end bg-overlay/50 backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) setMode(null);
      }}
    >
      <section className="max-h-[92%] w-full overflow-y-auto rounded-t-[2.5rem] bg-background px-5 pb-8 pt-4 shadow-sheet border-t border-border">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-border" />
        <header className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick add</p>
            <h2 className="text-xl font-black">
              {mode === "menu"
                ? "Log food"
                : mode === "search"
                ? "Food database"
                : mode === "scan"
                ? "Scan a meal"
                : "Manual entry"}
            </h2>
          </div>
          <Button aria-label="Close" variant="soft" size="icon" className="size-8 rounded-full" onClick={() => setMode(null)}>
            <X className="size-4" />
          </Button>
        </header>

        {mode === "menu" && (
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <AddChoice icon={Camera} title="Scan food" detail="Use phone camera" onClick={() => setMode("scan")} />
            <AddChoice icon={Search} title="Search" detail="Local food database" onClick={() => setMode("search")} />
            <AddChoice icon={PencilLine} title="Enter manually" detail="Add exact values" onClick={() => setMode("manual")} />
            <AddChoice icon={Upload} title="Scan label" detail="Packaged food" onClick={() => setMode("scan")} />
          </div>
        )}

        {mode !== "menu" && <MealPicker meal={meal} setMeal={setMeal} />}

        {mode === "search" && (
          <div className="mt-4">
            <label className="relative block">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe what you ate (e.g. Mandazi, Pilau, Tilapia...)"
                className="h-11 rounded-2xl border-0 bg-surface pl-10 text-xs"
              />
            </label>

            {/* AI Estimation for custom queries */}
            {query.trim().length > 0 && (
              <div className="mt-2.5 p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    Ask AI for "{query.trim()}"
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Calculate nutrition & local price
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="nourish"
                  className="h-8 rounded-full text-xs font-bold shrink-0 gap-1"
                  disabled={searchingAI}
                  onClick={handleAiSearch}
                >
                  {searchingAI ? (
                    <div className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      <span>Estimate</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="mt-3.5 flex items-center justify-between">
              <h3 className="text-sm font-black">Suggestions</h3>
              <span className="text-[10px] text-muted-foreground">{allSearchFoods.length} foods</span>
            </div>
            <div className="mt-2.5 space-y-2 max-h-60 overflow-y-auto pr-1">
              {allSearchFoods.map((food) => (
                <div
                  key={food.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-2xl bg-surface p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-xs">{food.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {food.calories} cal · {food.serving} · KSh {food.cost}
                    </p>
                  </div>
                  <button
                    aria-label={
                      favorites.includes(food.id)
                        ? `Remove ${food.name} from favorites`
                        : `Save ${food.name} as favorite`
                    }
                    onClick={() => onFavorite(food.id)}
                    className={favorites.includes(food.id) ? "text-protein" : "text-muted-foreground"}
                  >
                    <Heart className={cn("size-4", favorites.includes(food.id) && "fill-current")} />
                  </button>
                  <Button
                    aria-label={`Add ${food.name}`}
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={() => onAdd(food, meal)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === "scan" && (
          <div className="mt-4">
            {!analysis ? (
              <div className="rounded-3xl border border-dashed border-border bg-surface p-6 text-center">
                <div className="mx-auto grid size-16 place-items-center overflow-hidden rounded-full bg-background">
                  {preview && analyzing ? (
                    <img src={preview} alt="" className="size-full object-cover" />
                  ) : (
                    <Camera className="size-7" />
                  )}
                </div>
                <h3 className="mt-4 text-base font-black">{analyzing ? "Reading your plate…" : "Choose a meal photo"}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {scanError ?? "We'll estimate each food and let you edit before saving."}
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={startScan}
                />
                {analyzing ? (
                  <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-border">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
                  </div>
                ) : (
                  <Button
                    variant="nourish"
                    size="pill"
                    className="mt-4 w-full text-xs font-bold"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Camera className="size-4" /> Take or choose photo
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <img
                  src={preview ?? mealImage}
                  alt="Analyzed meal preview"
                  className="aspect-[2/1] w-full rounded-2xl object-cover"
                />
                <div className="mt-4 rounded-2xl bg-surface p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Foods detected · {analysis.confidence} confidence</p>
                      <p className="truncate font-black text-sm">{analysis.food.name}</p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                        {analysis.items.join(" · ") || analysis.food.serving}
                      </p>
                    </div>
                    <PencilLine className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    <MacroMini value={`${analysis.food.calories}`} label="cal" tone="text-foreground" />
                    <MacroMini value={`${analysis.food.protein}g`} label="protein" tone="text-protein" />
                    <MacroMini value={`${analysis.food.carbs}g`} label="carbs" tone="text-carbs" />
                    <MacroMini value={`${analysis.food.cost}`} label="KSh" tone="text-foreground" />
                  </div>
                </div>
                {analysis.note && <p className="mt-2 text-center text-[10px] text-muted-foreground">{analysis.note}</p>}
                <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-2">
                  <Button
                    variant="outline"
                    size="pill"
                    onClick={() => {
                      setAnalysis(null);
                      setPreview(null);
                    }}
                  >
                    Retake
                  </Button>
                  <Button variant="nourish" size="pill" onClick={() => onAdd(analysis.food, meal)}>
                    Confirm & log
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "manual" && (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (manual.name.trim()) onAdd({ ...manual, id: `manual-${Date.now()}` }, meal);
            }}
          >
            <Field label="Food name">
              <Input
                required
                value={manual.name}
                onChange={(e) => setManual({ ...manual, name: e.target.value })}
                placeholder="e.g. Homemade stew"
                className="h-10 text-xs"
              />
            </Field>
            <Field label="Serving">
              <Input
                value={manual.serving}
                onChange={(e) => setManual({ ...manual, serving: e.target.value })}
                className="h-10 text-xs"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              {(["calories", "protein", "carbs", "fat", "cost"] as const).map((key) => (
                <Field key={key} label={key === "cost" ? "Cost (KSh)" : key.charAt(0).toUpperCase() + key.slice(1)}>
                  <Input
                    type="number"
                    min="0"
                    value={manual[key]}
                    onChange={(e) => setManual({ ...manual, [key]: Number(e.target.value) })}
                    className="h-9 text-xs"
                  />
                </Field>
              ))}
            </div>
            <Button variant="nourish" size="pill" className="w-full mt-2" type="submit">
              Add food
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}

function MealPicker({ meal, setMeal }: { meal: MealType; setMeal: (meal: MealType) => void }) {
  return (
    <div className="mt-3.5 grid grid-cols-4 rounded-full bg-surface p-1">
      {(["Breakfast", "Lunch", "Dinner", "Snack"] as MealType[]).map((item) => (
        <button
          key={item}
          onClick={() => setMeal(item)}
          className={cn(
            "truncate rounded-full px-2 py-1.5 text-xs font-bold transition-all",
            meal === item && "bg-background shadow-2xs text-foreground"
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
