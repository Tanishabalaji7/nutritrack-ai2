import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    await ensureSchema();
    const body = await request.json();
    const { name, email, password, age, gender, height_cm, weight_kg, activity_level, goal } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const result = await sql`
      INSERT INTO users (name, email, password_hash, age, gender, height_cm, weight_kg, activity_level, goal)
      VALUES (
        ${name},
        ${email.toLowerCase()},
        ${passwordHash},
        ${age || 25},
        ${gender || "female"},
        ${height_cm || 165},
        ${weight_kg || 60},
        ${activity_level || "moderate"},
        ${goal || "maintain"}
      )
      RETURNING id;
    `;

    const userId = result.rows[0].id;
    await setSessionCookie(userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Something went wrong creating your account." }, { status: 500 });
  }
}
