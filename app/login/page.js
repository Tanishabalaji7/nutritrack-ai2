"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-10 h-10 rounded-xl bg-plum text-white flex items-center justify-center text-lg">🍃</div>
          <span className="text-2xl font-bold text-maroonDark">NutriTrack AI</span>
        </div>

        <h1 className="text-xl font-bold text-maroonDark mb-1 text-center">Welcome back</h1>
        <p className="text-sm text-maroonDark/60 text-center mb-6">Log in to keep tracking your nutrition.</p>

        {error && <div className="text-sm text-red-600 mb-4 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email"
            className="input-field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            required
            placeholder="Password"
            className="input-field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? "Logging in…" : "Log In"}
          </button>
        </form>

        <p className="text-sm text-center text-maroonDark/60 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-plum font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
