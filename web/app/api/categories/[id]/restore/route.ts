import { currentUser, unauthorized } from "@/lib/session";
import { MAX_CATEGORIES, restoreCategory } from "@/lib/expenses";

export async function POST(_req: Request, ctx: RouteContext<"/api/categories/[id]/restore">) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const id = Number((await ctx.params).id);
  if (!Number.isSafeInteger(id) || id <= 0 || !(await restoreCategory(user.id, id))) {
    return Response.json({ error: `Couldn't restore. You may have reached the limit of ${MAX_CATEGORIES} categories.` }, { status: 400 });
  }
  return Response.json({ ok: true });
}
