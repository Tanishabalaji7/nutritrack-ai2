import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }) {
  await ensureSchema();
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const result = await sql`SELECT id, name, age, goal FROM users WHERE id = ${userId}`;
  const user = result.rows[0];
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar user={user} />
      <main className="flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
