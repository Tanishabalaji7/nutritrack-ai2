"use client";

import { useEffect, useState } from "react";
import { calcTargets } from "@/lib/nutrition";

export default function ProfilePage() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setForm(data.user);
    })();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const pctSum = Number(form.protein_pct) + Number(form.carbs_pct) + Number(form.fat_pct);
    if (pctSum !== 100) {
      setError(`Macro percentages must add up to 100% (currently ${pctSum}%).`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <div className="text-maroonDark/60">Loading profile…</div>;

  const targets = calcTargets(form);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <div className="text-xs font-bold text-plum tracking-wide">YOUR ACCOUNT</div>
        <h1 className="text-3xl font-bold text-maroonDark">Profile &amp; Goals</h1>
        <p className="text-maroonDark/60 text-sm mt-1">
          Update your details to keep your calorie and macro targets accurate.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="card lg:col-span-2 flex flex-col gap-4">
          {error && <div className="text-sm text-red-600">{error}</div>}
          {message && <div className="text-sm text-green-700">{message}</div>}

          <Field label="Name">
            <input className="input-field" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Age">
              <input type="number" className="input-field" value={form.age} onChange={(e) => update("age", e.target.value)} />
            </Field>
            <Field label="Gender">
              <select className="input-field" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Height (cm)">
              <input type="number" className="input-field" value={form.height_cm} onChange={(e) => update("height_cm", e.target.value)} />
            </Field>
            <Field label="Weight (kg)">
              <input type="number" className="input-field" value={form.weight_kg} onChange={(e) => update("weight_kg", e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Activity Level">
              <select className="input-field" value={form.activity_level} onChange={(e) => update("activity_level", e.target.value)}>
                <option value="sedentary">Sedentary (little/no exercise)</option>
                <option value="light">Light (1-3 days/week)</option>
                <option value="moderate">Moderate (3-5 days/week)</option>
                <option value="active">Active (6-7 days/week)</option>
                <option value="very_active">Very Active (athlete)</option>
              </select>
            </Field>
            <Field label="Goal">
              <select className="input-field" value={form.goal} onChange={(e) => update("goal", e.target.value)}>
                <option value="lose">Lose Weight</option>
                <option value="maintain">Maintain</option>
                <option value="gain">Gain Muscle</option>
              </select>
            </Field>
          </div>

          <div className="border-t border-blush/50 pt-4 mt-2">
            <div className="font-bold text-maroonDark mb-3">Macro Split (must total 100%)</div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Protein %">
                <input type="number" className="input-field" value={form.protein_pct} onChange={(e) => update("protein_pct", e.target.value)} />
              </Field>
              <Field label="Carbs %">
                <input type="number" className="input-field" value={form.carbs_pct} onChange={(e) => update("carbs_pct", e.target.value)} />
              </Field>
              <Field label="Fat %">
                <input type="number" className="input-field" value={form.fat_pct} onChange={(e) => update("fat_pct", e.target.value)} />
              </Field>
            </div>
          </div>

          <Field label="Daily Water Target (ml)">
            <input type="number" className="input-field" value={form.water_target_ml} onChange={(e) => update("water_target_ml", e.target.value)} />
          </Field>

          <button type="submit" disabled={saving} className="btn-primary mt-2 disabled:opacity-60">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>

        <div className="card h-fit">
          <div className="font-bold text-maroonDark mb-4">Your Calculated Targets</div>
          <TargetRow label="BMR (Basal)" value={`${targets.bmr} kcal`} />
          <TargetRow label="TDEE (Maintenance)" value={`${targets.tdee} kcal`} />
          <TargetRow label="Daily Calorie Target" value={`${targets.targetCalories} kcal`} highlight />
          <TargetRow label="Protein Target" value={`${targets.proteinG} g`} />
          <TargetRow label="Carbs Target" value={`${targets.carbsG} g`} />
          <TargetRow label="Fat Target" value={`${targets.fatG} g`} />
          <TargetRow label="Fiber Target" value={`${targets.fiberG} g`} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-maroonDark/70">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function TargetRow({ label, value, highlight }) {
  return (
    <div className={`flex justify-between py-2 border-b border-blush/30 ${highlight ? "text-plum font-bold" : "text-maroonDark"}`}>
      <span className="text-sm">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
