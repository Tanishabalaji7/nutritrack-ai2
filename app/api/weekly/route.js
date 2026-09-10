import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

function lastNDates(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export async function GET() {
  await ensureSchema();
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const dates = lastNDates(7);
  const startDate = dates[0];

  const foodRows = await sql`
    SELECT log_date::text as log_date,
           COALESCE(SUM(calories), 0) as calories,
           COALESCE(SUM(protein_g), 0) as protein_g,
           COALESCE(SUM(carbs_g), 0) as carbs_g,
           COALESCE(SUM(fat_g), 0) as fat_g,
           COALESCE(SUM(fiber_g), 0) as fiber_g
    FROM food_logs
    WHERE user_id = ${userId} AND log_date >= ${startDate}
    GROUP BY log_date
  `;

  const byDate = Object.fromEntries(foodRows.rows.map((r) => [r.log_date, r]));

  const days = dates.map((date) => {
    const row = byDate[date];
    return {
      date,
      calories: row ? Number(row.calories) : 0,
      protein_g: row ? Number(row.protein_g) : 0,
      carbs_g: row ? Number(row.carbs_g) : 0,
      fat_g: row ? Number(row.fat_g) : 0,
      fiber_g: row ? Number(row.fiber_g) : 0,
    };
  });

  // Streak: consecutive days (ending today) with at least one log
  const allDatesDesc = await sql`
    SELECT DISTINCT log_date::text as log_date FROM food_logs
    WHERE user_id = ${userId}
    ORDER BY log_date DESC
  `;
  const loggedDates = new Set(allDatesDesc.rows.map((r) => r.log_date));
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (loggedDates.has(iso)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return NextResponse.json({ days, streak });
}
