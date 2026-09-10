import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const userId = await getCurrentUserId();
  redirect(userId ? "/dashboard" : "/login");
}
