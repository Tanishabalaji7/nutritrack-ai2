import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSchema();
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const result = await sql`
    SELECT id, name, email, age, gender, height_cm, weight_kg, activity_level, goal,
           protein_pct, carbs_pct, fat_pct, water_target_ml, created_at
    FROM users WHERE id = ${userId}
  `;

  const user = result.rows[0];
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
