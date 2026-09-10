import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { todayISO } from "@/lib/nutrition";

export const dynamic = "force-dynamic";

export async function GET(request) {
  await ensureSchema();
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayISO();

  const result = await sql`
    SELECT id, meal, food_name, portion, calories, protein_g, carbs_g, fat_g, fiber_g, created_at
    FROM food_logs
    WHERE user_id = ${userId} AND log_date = ${date}
    ORDER BY created_at ASC
  `;

  return NextResponse.json({ items: result.rows });
}

export async function POST(request) {
  await ensureSchema();
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json();
  const {
    date,
    meal,
    food_name,
    portion,
    calories,
    protein_g,
    carbs_g,
    fat_g,
    fiber_g,
  } = body;

  if (!meal || !food_name || calories === undefined) {
    return NextResponse.json({ error: "meal, food_name, and calories are required." }, { status: 400 });
  }

  const result = await sql`
    INSERT INTO food_logs (user_id, log_date, meal, food_name, portion, calories, protein_g, carbs_g, fat_g, fiber_g)
    VALUES (
      ${userId},
      ${date || todayISO()},
      ${meal},
      ${food_name},
      ${portion || ""},
      ${calories || 0},
      ${protein_g || 0},
      ${carbs_g || 0},
      ${fat_g || 0},
      ${fiber_g || 0}
    )
    RETURNING id, meal, food_name, portion, calories, protein_g, carbs_g, fat_g, fiber_g, created_at;
  `;

  return NextResponse.json({ item: result.rows[0] });
}

export async function DELETE(request) {
  await ensureSchema();
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query param required." }, { status: 400 });

  await sql`DELETE FROM food_logs WHERE id = ${id} AND user_id = ${userId}`;
  return NextResponse.json({ ok: true });
}
