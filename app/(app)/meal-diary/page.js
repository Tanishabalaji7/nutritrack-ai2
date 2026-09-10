"use client";

import { useEffect, useState, useCallback } from "react";
import TopBar from "@/components/TopBar";
import LogFoodModal from "@/components/LogFoodModal";
import { MEALS, sumMacros, calcTargets, todayISO } from "@/lib/nutrition";

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

export default function MealDiaryPage() {
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
    setUser((await meRes.json()).user);
    setItems((await foodRes.json()).items || []);
    setWaterMl((await waterRes.json()).totalMl || 0);
    setStreak((await weeklyRes.json()).streak || 0);
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

  async function deleteItem(id) {
    await fetch(`/api/food-logs?id=${id}`, { method: "DELETE" });
    load();
  }

  if (loading || !user) {
    return <div className="text-maroonDark/60">Loading your diary…</div>;
  }

  const targets = calcTargets(user);

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
        onLogFood={() => { setModalMeal("breakfast"); setModalOpen(true); }}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs font-bold text-plum tracking-wide">LOG HISTORY &amp; BREAKDOWN</div>
          <h1 className="text-3xl font-bold text-maroonDark">Interactive Daily Food Diary</h1>
          <p className="text-maroonDark/60 text-sm mt-1">Inspect individual logged foods, macro contributions, and timestamp history.</p>
        </div>
        <button onClick={() => { setModalMeal("breakfast"); setModalOpen(true); }} className="btn-primary">
          + Log Food Item
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {MEALS.map((meal) => {
          const mealItems = items.filter((i) => i.meal === meal);
          const totals = sumMacros(mealItems);
          return (
            <div key={meal} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{MEAL_META[meal].icon}</span>
                  <div>
                    <div className="text-xl font-bold text-maroonDark">{MEAL_META[meal].label}</div>
                    <div className="text-sm text-maroonDark/50">
                      {mealItems.length} items logged • {Math.round(totals.calories)} kcal
                      {" "}(P: {Math.round(totals.protein_g)}g, C: {Math.round(totals.carbs_g)}g, F: {Math.round(totals.fat_g)}g)
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setModalMeal(meal); setModalOpen(true); }}
                  className="btn-secondary text-sm"
                >
                  + Add {MEAL_META[meal].label}
                </button>
              </div>

              {mealItems.length === 0 ? (
                <div className="text-center text-maroonDark/40 italic py-6 bg-blush/10 rounded-xl">
                  No items logged for {meal}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-plum font-bold border-b border-blush/50">
                        <th className="py-2 pr-4">FOOD ITEM</th>
                        <th className="py-2 pr-4">PORTION</th>
                        <th className="py-2 pr-4">CALORIES</th>
                        <th className="py-2 pr-4">PROTEIN</th>
                        <th className="py-2 pr-4">CARBS</th>
                        <th className="py-2 pr-4">FAT</th>
                        <th className="py-2 pr-4">FIBER</th>
                        <th className="py-2">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mealItems.map((item) => (
                        <tr key={item.id} className="border-b border-blush/20">
                          <td className="py-3 pr-4 font-semibold text-maroonDark">{item.food_name}</td>
                          <td className="py-3 pr-4 text-maroonDark/70">{item.portion}</td>
                          <td className="py-3 pr-4 font-bold text-plum">{Math.round(item.calories)} kcal</td>
                          <td className="py-3 pr-4">{Math.round(item.protein_g)}g</td>
                          <td className="py-3 pr-4">{Math.round(item.carbs_g)}g</td>
                          <td className="py-3 pr-4">{Math.round(item.fat_g)}g</td>
                          <td className="py-3 pr-4">{Math.round(item.fiber_g)}g</td>
                          <td className="py-3">
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="text-maroonDark/50 hover:text-red-600"
                              title="Remove"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
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
