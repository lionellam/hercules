import { currentUser, unauthorized } from "@/lib/session";
import { expenseInput, softDeleteExpense, updateExpense } from "@/lib/expenses";

async function expenseId(ctx: RouteContext<"/api/expenses/[id]">) {
  const id = Number((await ctx.params).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/expenses/[id]">) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const id = await expenseId(ctx);
  const input = expenseInput.safeParse(await req.json().catch(() => null));
  if (!id || !input.success) return Response.json({ error: "Please check the amount and fields." }, { status: 400 });
  if (!(await updateExpense(user.id, id, input.data))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/expenses/[id]">) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const id = await expenseId(ctx);
  if (!id || !(await softDeleteExpense(user.id, id))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
