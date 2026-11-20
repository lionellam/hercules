import { routeId } from "@/lib/route-id";
import { currentUser, unauthorized } from "@/lib/session";
import { MAX_CATEGORIES, restoreCategory } from "@/lib/expenses";

export async function POST(_req: Request, ctx: RouteContext<"/api/categories/[id]/restore">) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const id = await routeId(ctx.params);
  if (!id || !(await restoreCategory(user.id, id))) {
    return Response.json({ error: `Couldn't restore. You may have reached the limit of ${MAX_CATEGORIES} categories.` }, { status: 400 });
  }
  return Response.json({ ok: true });
}
