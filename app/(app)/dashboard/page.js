"use client";

import { useEffect, useState, useCallback } from "react";
import TopBar from "@/components/TopBar";
import LogFoodModal from "@/components/LogFoodModal";
import { calcTargets, sumMacros, calcDailyScore, MEALS, todayISO } from "@/lib/nutrition";

const MEAL_META = {
  breakfast: { label: "Breakfast", icon: "🌅" },
  lunch: { label: "Lunch", icon: "☀️" },
  dinner: { label: "Dinner", icon: "🌙" },
  snacks: { label: "Snacks", icon: "🍎" },
};

function shiftDate(dateStr, delta) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const [date, setDate] = useState(todayISO());
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [waterMl, setWaterMl] = useState(0);
  const [streak, setStreak] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMeal, setModalMeal] = useState("breakfast");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [meRes, foodRes, waterRes, weeklyRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch(`/api/food-logs?date=${date}`),
      fetch(`/api/water-logs?date=${date}`),
      fetch("/api/weekly"),
    ]);
    const me = await meRes.json();
    const food = await foodRes.json();
    const water = await waterRes.json();
    const weekly = await weeklyRes.json();

    setUser(me.user);
    setItems(food.items || []);
    setWaterMl(water.totalMl || 0);
    setStreak(weekly.streak || 0);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function addWater() {
    await fetch("/api/water-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, amount_ml: 250 }),
    });
    load();
  }

  function openLogFood(meal = "breakfast") {
    setModalMeal(meal);
    setModalOpen(true);
  }

  if (loading || !user) {
    return <div className="text-maroonDark/60">Loading your dashboard…</div>;
  }

  const targets = calcTargets(user);
  const eaten = sumMacros(items);
  const kcalLeft = Math.max(0, targets.targetCalories - eaten.calories);
  const score = calcDailyScore({ eaten, targets, waterMl });
  const ringPct = Math.min(100, Math.round((eaten.calories / targets.targetCalories) * 100));

  const itemsByMeal = MEALS.reduce((acc, m) => {
    acc[m] = items.filter((i) => i.meal === m);
    return acc;
  }, {});

  return (
    <div>
      <TopBar
        date={date}
        onPrevDay={() => setDate((d) => shiftDate(d, -1))}
        onNextDay={() => setDate((d) => shiftDate(d, 1))}
        streak={streak}
        waterMl={waterMl}
        waterTarget={targets.waterTargetMl}
        onAddWater={addWater}
        onLogFood={() => openLogFood("breakfast")}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs font-bold text-plum tracking-wide">DAILY ENERGY BALANCE</div>
              <h2 className="text-2xl font-bold text-maroonDark">Calories Remaining</h2>
            </div>
            <div className="bg-blush/40 rounded-full px-4 py-1.5 text-sm font-bold text-maroonDark">
              SCORE {score}/100
            </div>
          </div>

          <div className="flex items-center gap-8 mt-6">
            <div
              className="w-48 h-48 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: `conic-gradient(#B04A6B ${ringPct}%, #F6C9C6 ${ringPct}% 100%)`,
              }}
            >
              <div className="w-36 h-36 rounded-full bg-creamLight flex flex-col items-center justify-center">
                <div className="text-3xl font-extrabold text-maroonDark">{kcalLeft.toLocaleString()}</div>
                <div className="text-xs text-maroonDark/60">kcal left</div>
                <div className="text-[10px] bg-blush/50 rounded-full px-2 py-0.5 mt-2">
                  Target: {targets.targetCalories.toLocaleString()} kcal
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <StatDot color="bg-plum" label="Eaten" value={`${Math.round(eaten.calories)} kcal`} />
              <StatDot color="bg-blushDark" label="Target (TDEE)" value={`${targets.tdee} kcal`} />
              <StatDot color="bg-peach" label="Basal (BMR)" value={`${targets.bmr} kcal`} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold text-plum tracking-wide">MACRONUTRIENT SPLIT</div>
              <h2 className="text-2xl font-bold text-maroonDark">Target vs Intake</h2>
            </div>
            <div className="bg-blush/40 rounded-full px-4 py-1.5 text-sm font-bold text-maroonDark capitalize">
              {user.goal}
            </div>
          </div>

          <MacroRow label="Protein" perGram="4 kcal/g" value={eaten.protein_g} target={targets.proteinG} />
          <MacroRow label="Carbohydrates" perGram="4 kcal/g" value={eaten.carbs_g} target={targets.carbsG} />
          <MacroRow label="Healthy Fats" perGram="9 kcal/g" value={eaten.fat_g} target={targets.fatG} />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-blush/30 rounded-xl p-4 flex items-center gap-3">
              <span className="text-xl">💧</span>
              <div>
                <div className="text-xs text-maroonDark/60">Water</div>
                <div className="font-bold text-maroonDark">{waterMl} / {targets.waterTargetMl} ml</div>
              </div>
            </div>
            <div className="bg-blush/30 rounded-xl p-4 flex items-center gap-3">
              <span className="text-xl">🌿</span>
              <div>
                <div className="text-xs text-maroonDark/60">Fiber</div>
                <div className="font-bold text-maroonDark">{Math.round(eaten.fiber_g)} / {targets.fiberG}g</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-maroonDark">Today's Meals &amp; Diary</h2>
            <p className="text-maroonDark/60 text-sm">Log meals to track real-time calories, macros, and hydration.</p>
          </div>
          <button onClick={() => openLogFood("snacks")} className="btn-secondary">+ Add Food</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {MEALS.map((meal) => {
            const mealItems = itemsByMeal[meal];
            const mealKcal = mealItems.reduce((s, i) => s + Number(i.calories), 0);
            return (
              <div key={meal} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span>{MEAL_META[meal].icon}</span>
                    <div>
                      <div className="font-bold text-maroonDark">{MEAL_META[meal].label}</div>
                      <div className="text-xs text-plum font-semibold">{Math.round(mealKcal)} kcal</div>
                    </div>
                  </div>
                  <button
                    onClick={() => openLogFood(meal)}
                    className="w-8 h-8 rounded-full bg-plum text-white flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <div className="border-t border-blush/50 pt-3 flex flex-col gap-2">
                  {mealItems.length === 0 && (
                    <div className="text-sm text-maroonDark/40 italic text-center py-2">No items logged yet.</div>
                  )}
                  {mealItems.map((i) => (
                    <div key={i.id} className="bg-blush/20 rounded-lg px-3 py-2 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm text-maroonDark">{i.food_name}</div>
                        <div className="text-xs text-maroonDark/50">{i.portion}</div>
                      </div>
                      <div className="text-sm font-bold text-plum">{Math.round(i.calories)} kcal</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <LogFoodModal
        open={modalOpen}
        defaultMeal={modalMeal}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
}

function StatDot({ color, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <div>
        <div className="text-xs text-maroonDark/50">{label}</div>
        <div className="font-bold text-maroonDark">{value}</div>
      </div>
    </div>
  );
}

function MacroRow({ label, perGram, value, target }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-semibold text-maroonDark">
          <span className="w-2 h-2 inline-block rounded-full bg-plum mr-2" />
          {label} <span className="text-maroonDark/40">({perGram})</span>
        </span>
        <span className="font-bold text-maroonDark">
          {Math.round(value)}g / {target}g
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
