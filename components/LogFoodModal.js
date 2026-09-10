"use client";

import { useState } from "react";

const MEALS = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snacks", label: "Snacks" },
];

export default function LogFoodModal({ open, defaultMeal = "breakfast", onClose, onSaved }) {
  const [form, setForm] = useState({
    meal: defaultMeal,
    food_name: "",
    portion: "",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
    fiber_g: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.food_name || !form.calories) {
      setError("Food name and calories are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/food-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          calories: Number(form.calories) || 0,
          protein_g: Number(form.protein_g) || 0,
          carbs_g: Number(form.carbs_g) || 0,
          fat_g: Number(form.fat_g) || 0,
          fiber_g: Number(form.fiber_g) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      onSaved?.(data.item);
      setForm({ meal: defaultMeal, food_name: "", portion: "", calories: "", protein_g: "", carbs_g: "", fat_g: "", fiber_g: "" });
      onClose();
    } catch (err) {
      setError("Could not save this item. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-creamLight rounded-xl2 p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-maroonDark">Log Food Item</h3>
          <button onClick={onClose} className="text-maroonDark/60 hover:text-maroonDark text-xl">×</button>
        </div>

        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-maroonDark/70">Meal</label>
            <select className="input-field mt-1" value={form.meal} onChange={(e) => update("meal", e.target.value)}>
              {MEALS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-maroonDark/70">Food name</label>
            <input className="input-field mt-1" value={form.food_name} onChange={(e) => update("food_name", e.target.value)} placeholder="e.g. 100% Whole Wheat Bread" />
          </div>

          <div>
            <label className="text-xs font-semibold text-maroonDark/70">Portion</label>
            <input className="input-field mt-1" value={form.portion} onChange={(e) => update("portion", e.target.value)} placeholder="e.g. 1x (40g slice)" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-maroonDark/70">Calories (kcal)</label>
              <input type="number" className="input-field mt-1" value={form.calories} onChange={(e) => update("calories", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-maroonDark/70">Protein (g)</label>
              <input type="number" className="input-field mt-1" value={form.protein_g} onChange={(e) => update("protein_g", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-maroonDark/70">Carbs (g)</label>
              <input type="number" className="input-field mt-1" value={form.carbs_g} onChange={(e) => update("carbs_g", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-maroonDark/70">Fat (g)</label>
              <input type="number" className="input-field mt-1" value={form.fat_g} onChange={(e) => update("fat_g", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-maroonDark/70">Fiber (g)</label>
              <input type="number" className="input-field mt-1" value={form.fiber_g} onChange={(e) => update("fiber_g", e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary mt-2 disabled:opacity-60">
            {saving ? "Saving..." : "Add to Diary"}
          </button>
        </form>
      </div>
    </div>
  );
}
