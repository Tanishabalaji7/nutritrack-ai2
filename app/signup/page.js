"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    age: 25,
    gender: "female",
    height_cm: 165,
    weight_kg: 60,
    activity_level: "moderate",
    goal: "maintain",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-lg">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-10 h-10 rounded-xl bg-plum text-white flex items-center justify-center text-lg">🍃</div>
          <span className="text-2xl font-bold text-maroonDark">NutriTrack AI</span>
        </div>

        <h1 className="text-xl font-bold text-maroonDark mb-1 text-center">Create your account</h1>
        <p className="text-sm text-maroonDark/60 text-center mb-6">
          Tell us a bit about yourself so we can calculate your targets.
        </p>

        {error && <div className="text-sm text-red-600 mb-4 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            required
            placeholder="Full name"
            className="input-field"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
          <input
            type="email"
            required
            placeholder="Email"
            className="input-field"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          <input
            type="password"
            required
            placeholder="Password (min 6 characters)"
            className="input-field"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Age"
              className="input-field"
              value={form.age}
              onChange={(e) => update("age", e.target.value)}
            />
            <select className="input-field" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Height (cm)"
              className="input-field"
              value={form.height_cm}
              onChange={(e) => update("height_cm", e.target.value)}
            />
            <input
              type="number"
              placeholder="Weight (kg)"
              className="input-field"
              value={form.weight_kg}
              onChange={(e) => update("weight_kg", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select className="input-field" value={form.activity_level} onChange={(e) => update("activity_level", e.target.value)}>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
              <option value="very_active">Very Active</option>
            </select>
            <select className="input-field" value={form.goal} onChange={(e) => update("goal", e.target.value)}>
              <option value="lose">Lose Weight</option>
              <option value="maintain">Maintain</option>
              <option value="gain">Gain Muscle</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-center text-maroonDark/60 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-plum font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
