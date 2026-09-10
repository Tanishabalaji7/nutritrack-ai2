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
    SELECT COALESCE(SUM(amount_ml), 0) AS total_ml
    FROM water_logs WHERE user_id = ${userId} AND log_date = ${date}
  `;

  return NextResponse.json({ totalMl: Number(result.rows[0].total_ml) });
}

export async function POST(request) {
  await ensureSchema();
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { date, amount_ml } = await request.json();
  if (!amount_ml) return NextResponse.json({ error: "amount_ml is required." }, { status: 400 });

  await sql`
    INSERT INTO water_logs (user_id, log_date, amount_ml)
    VALUES (${userId}, ${date || todayISO()}, ${amount_ml})
  `;

  return NextResponse.json({ ok: true });
}
