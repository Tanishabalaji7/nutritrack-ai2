"use client";

function formatDateLabel(dateStr) {
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date(dateStr + "T00:00:00");
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return dateStr === today ? `Today, ${label}` : label;
}

export default function TopBar({ date, onPrevDay, onNextDay, streak, waterMl, waterTarget, onAddWater, onLogFood }) {
  const monthAbbr = new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const dayNum = new Date(date + "T00:00:00").getDate();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-2 bg-creamLight rounded-full px-2 py-2 shadow-sm">
        <button onClick={onPrevDay} className="w-9 h-9 rounded-full hover:bg-blush/40 flex items-center justify-center">
          ‹
        </button>
        <div className="flex items-center gap-2 bg-blush/40 rounded-full px-3 py-1.5">
          <div className="text-[10px] leading-none text-plum font-bold text-center">
            {monthAbbr}
            <div className="text-sm text-maroonDark">{dayNum}</div>
          </div>
          <span className="font-semibold text-maroonDark px-1">{formatDateLabel(date)}</span>
        </div>
        <button onClick={onNextDay} className="w-9 h-9 rounded-full hover:bg-blush/40 flex items-center justify-center">
          ›
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="bg-creamLight rounded-full px-4 py-2.5 shadow-sm font-semibold text-maroonDark flex items-center gap-2">
          🔥 {streak} Day Streak
        </div>
        <button
          onClick={onAddWater}
          className="bg-creamLight rounded-full px-4 py-2.5 shadow-sm font-semibold text-maroonDark flex items-center gap-2 hover:bg-blush/40"
          title={`${waterMl}ml / ${waterTarget}ml today`}
        >
          💧 +250ml Water
        </button>
        <button onClick={onLogFood} className="btn-primary">
          + Log Food
        </button>
      </div>
    </div>
  );
}
