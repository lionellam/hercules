import "server-only";
import { connection } from "next/server";
import { auth } from "@/auth";
import { getActiveUser, isAllowed } from "./users";

// Re-checks the allow-list on every request so removing an email revokes access immediately.
export async function currentUser() {
  // Auth.js generates random values before reading cookies, which Cache Components rejects during prerender
  await connection();
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await getActiveUser(id);
  if (!user || !(await isAllowed(user.email))) return null;
  return user;
}

export function unauthorized() {
  return Response.json({ error: "Not signed in" }, { status: 401 });
}
