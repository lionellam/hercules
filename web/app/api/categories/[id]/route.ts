import { currentUser, unauthorized } from "@/lib/session";
import { categoryInput, updateCategory } from "@/lib/expenses";

export async function PATCH(req: Request, ctx: RouteContext<"/api/categories/[id]">) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const id = Number((await ctx.params).id);
  const input = categoryInput.safeParse(await req.json().catch(() => null));
  if (!Number.isSafeInteger(id) || id <= 0 || !input.success) {
    return Response.json({ error: "Please check the name and budget." }, { status: 400 });
  }
  if (!(await updateCategory(user.id, id, input.data))) {
    return Response.json({ error: "That name is already in use." }, { status: 400 });
  }
  return Response.json({ ok: true });
}
