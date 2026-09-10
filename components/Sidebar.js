"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/meal-diary", label: "Meal Diary", icon: "📄" },
  { href: "/weekly-trends", label: "Weekly Trends", icon: "📊" },
  { href: "/nutribot", label: "NutriBot AI", icon: "💬", badge: "Live" },
  { href: "/profile", label: "Profile & Goals", icon: "👤" },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((s) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <aside className="w-[380px] shrink-0 bg-blush/60 px-6 py-8 flex flex-col min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-plum text-white flex items-center justify-center text-lg">🍃</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-maroonDark">NutriTrack</span>
              <span className="text-xs bg-white/70 text-plum rounded-full px-2 py-0.5">AI</span>
            </div>
            <div className="text-xs text-plum/70">Postgres &amp; Gemini Core</div>
          </div>
        </div>
      </div>

      <div className="border-t border-maroonDark/10 mb-6" />

      <nav className="flex flex-col gap-3 flex-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-xl px-4 py-3 font-semibold transition-colors ${
                active ? "bg-plum text-white shadow" : "bg-blush/40 text-maroonDark hover:bg-blush"
              }`}
            >
              <span className="flex items-center gap-3">
                <span>{item.icon}</span>
                {item.label}
              </span>
              {item.badge && (
                <span className="text-[10px] bg-white/30 rounded-full px-2 py-0.5">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-maroonDark/10 my-6" />

      <div className="flex items-center gap-3 bg-blush/40 rounded-xl px-4 py-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-plum text-white flex items-center justify-center font-bold">
          {initials}
        </div>
        <div>
          <div className="font-semibold text-maroonDark">{user?.name || "..."}</div>
          <div className="text-xs text-plum/70">
            Age {user?.age || "—"} • {user?.goal || "maintain"}
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="text-left text-sm text-maroonDark/70 hover:text-maroonDark px-4 py-2 flex items-center gap-2"
      >
        ↪ Switch Account / Logout
      </button>
    </aside>
  );
}
