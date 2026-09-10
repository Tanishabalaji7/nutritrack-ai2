import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  throw new Error(
    "No database connection string found. Set POSTGRES_URL (Vercel Postgres) or DATABASE_URL in your environment."
  );
}

// fullResults gives us { rows, fields, rowCount } just like the `pg` package,
// which is what the rest of the app's `result.rows` code expects.
export const sql = neon(connectionString, { fullResults: true });

let schemaReady = null;

/**
 * Creates all tables if they don't already exist.
 * Safe to call on every request - it's idempotent and memoized per server instance.
 */
export async function ensureSchema() {
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;
    } catch (e) {
      // ignore - some managed Postgres providers already have it enabled
      // and/or restrict CREATE EXTENSION for non-superusers
    }

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        age INTEGER DEFAULT 25,
        gender TEXT DEFAULT 'female',
        height_cm NUMERIC DEFAULT 165,
        weight_kg NUMERIC DEFAULT 60,
        activity_level TEXT DEFAULT 'moderate',
        goal TEXT DEFAULT 'maintain',
        protein_pct NUMERIC DEFAULT 20,
        carbs_pct NUMERIC DEFAULT 50,
        fat_pct NUMERIC DEFAULT 30,
        water_target_ml INTEGER DEFAULT 2500,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS food_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        log_date DATE NOT NULL,
        meal TEXT NOT NULL,
        food_name TEXT NOT NULL,
        portion TEXT,
        calories NUMERIC NOT NULL DEFAULT 0,
        protein_g NUMERIC NOT NULL DEFAULT 0,
        carbs_g NUMERIC NOT NULL DEFAULT 0,
        fat_g NUMERIC NOT NULL DEFAULT 0,
        fiber_g NUMERIC NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS water_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        log_date DATE NOT NULL,
        amount_ml INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, log_date);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, log_date);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id, created_at);`;
  })();

  return schemaReady;
}
