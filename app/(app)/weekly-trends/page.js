"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { calcTargets } from "@/lib/nutrition";

function dayLabel(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
}

export default function WeeklyTrendsPage() {
  const [user, setUser] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [meRes, weeklyRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/weekly")]);
      setUser((await meRes.json()).user);
      const weekly = await weeklyRes.json();
      setDays(weekly.days || []);
      setLoading(false);
    })();
  }, []);

  if (loading || !user) {
    return <div className="text-maroonDark/60">Loading your trends…</div>;
  }

  const targets = calcTargets(user);

  const calorieData = days.map((d) => ({
    day: dayLabel(d.date),
    calories: Math.round(d.calories),
  }));

  const macroData = days.map((d) => ({
    day: dayLabel(d.date),
    Protein: Math.round(d.protein_g),
    Carbs: Math.round(d.carbs_g),
    Fat: Math.round(d.fat_g),
  }));

  const avgCalories = Math.round(days.reduce((s, d) => s + d.calories, 0) / (days.length || 1));
  const daysOnTarget = days.filter((d) => d.calories > 0 && Math.abs(d.calories - targets.targetCalories) <= 250).length;

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs font-bold text-plum tracking-wide">7-DAY TRAJECTORY</div>
        <h1 className="text-3xl font-bold text-maroonDark">Weekly Calorie &amp; Macro Analytics</h1>
        <p className="text-maroonDark/60 text-sm mt-1">
          Understand your consistency, average caloric deficit/surplus, and macro adherence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="text-xs font-bold text-plum tracking-wide">CONSISTENCY</div>
          <h2 className="text-xl font-bold text-maroonDark mb-4">7-Day Calorie Intake vs Target</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={calorieData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F6C9C6" />
              <XAxis dataKey="day" stroke="#7A2E4A" fontSize={12} />
              <YAxis stroke="#7A2E4A" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#F6C9C6" }} />
              <ReferenceLine y={targets.targetCalories} stroke="#B04A6B" strokeDasharray="6 4" label={{ value: "Target (TDEE)", position: "insideTopRight", fill: "#B04A6B", fontSize: 11 }} />
              <Bar dataKey="calories" fill="#E9A6A6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="text-xs font-bold text-plum tracking-wide">MACRO DISTRIBUTION</div>
          <h2 className="text-xl font-bold text-maroonDark mb-4">Protein, Carbs &amp; Fat Adherence</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={macroData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F6C9C6" />
              <XAxis dataKey="day" stroke="#7A2E4A" fontSize={12} />
              <YAxis stroke="#7A2E4A" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#F6C9C6" }} />
              <Legend />
              <Line type="monotone" dataKey="Protein" stroke="#7A2E4A" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Carbs" stroke="#E07A3F" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Fat" stroke="#B04A6B" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Average Daily Intake" value={`${avgCalories} kcal`} sub={`Target: ${targets.targetCalories} kcal`} />
        <SummaryCard label="Days Within Target Range" value={`${daysOnTarget} / 7`} sub="±250 kcal of your TDEE" />
        <SummaryCard
          label="Avg Deficit / Surplus"
          value={`${avgCalories - targets.targetCalories >= 0 ? "+" : ""}${avgCalories - targets.targetCalories} kcal`}
          sub="vs your daily target"
        />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub }) {
  return (
    <div className="card">
      <div className="text-xs font-semibold text-maroonDark/50">{label}</div>
      <div className="text-2xl font-extrabold text-maroonDark mt-1">{value}</div>
      <div className="text-xs text-plum mt-1">{sub}</div>
    </div>
  );
}
