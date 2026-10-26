import { currentUser, unauthorized } from "@/lib/session";
import { getCategories } from "@/lib/expenses";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return Response.json(await getCategories(user.id));
}
