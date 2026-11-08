import { currentUser, unauthorized } from "@/lib/session";
import { categoryInput, retireCategory, updateCategory } from "@/lib/expenses";

async function categoryId(ctx: RouteContext<"/api/categories/[id]">) {
  const id = Number((await ctx.params).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/categories/[id]">) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const id = await categoryId(ctx);
  const input = categoryInput.safeParse(await req.json().catch(() => null));
  if (!id || !input.success) {
    return Response.json({ error: "Please check the name and budget." }, { status: 400 });
  }
  if (!(await updateCategory(user.id, id, input.data))) {
    return Response.json({ error: "That name is already in use, or this category has been retired." }, { status: 400 });
  }
  return Response.json({ ok: true });
}

// Retires the category: it stays in the database so past expenses keep it. "Other" can't be retired.
export async function DELETE(_req: Request, ctx: RouteContext<"/api/categories/[id]">) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const id = await categoryId(ctx);
  if (!id || !(await retireCategory(user.id, id))) {
    return Response.json({ error: "This category can't be retired." }, { status: 400 });
  }
  return Response.json({ ok: true });
}
