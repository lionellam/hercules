import { currentUser, unauthorized } from "@/lib/session";
import { restoreExpense } from "@/lib/expenses";

// Undo for a delete
export async function POST(_req: Request, ctx: RouteContext<"/api/expenses/[id]/restore">) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const id = Number((await ctx.params).id);
  if (!Number.isSafeInteger(id) || id <= 0 || !(await restoreExpense(user.id, id))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
