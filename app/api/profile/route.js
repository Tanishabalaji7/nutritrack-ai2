import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(request) {
  await ensureSchema();
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await request.json();
  const {
    name,
    age,
    gender,
    height_cm,
    weight_kg,
    activity_level,
    goal,
    protein_pct,
    carbs_pct,
    fat_pct,
    water_target_ml,
  } = body;

  if (Number(protein_pct) + Number(carbs_pct) + Number(fat_pct) !== 100) {
    return NextResponse.json({ error: "Macro percentages must add up to 100%." }, { status: 400 });
  }

  await sql`
    UPDATE users SET
      name = ${name},
      age = ${age},
      gender = ${gender},
      height_cm = ${height_cm},
      weight_kg = ${weight_kg},
      activity_level = ${activity_level},
      goal = ${goal},
      protein_pct = ${protein_pct},
      carbs_pct = ${carbs_pct},
      fat_pct = ${fat_pct},
      water_target_ml = ${water_target_ml}
    WHERE id = ${userId}
  `;

  return NextResponse.json({ ok: true });
}
