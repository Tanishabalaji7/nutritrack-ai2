import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    await ensureSchema();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const result = await sql`SELECT id, password_hash FROM users WHERE email = ${email.toLowerCase()}`;
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await setSessionCookie(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Something went wrong logging you in." }, { status: 500 });
  }
}
