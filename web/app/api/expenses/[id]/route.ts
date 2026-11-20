import { routeId } from "@/lib/route-id";
import { currentUser, unauthorized } from "@/lib/session";
import { expenseInput, softDeleteExpense, updateExpense } from "@/lib/expenses";

export async function PATCH(req: Request, ctx: RouteContext<"/api/expenses/[id]">) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const id = await routeId(ctx.params);
  const input = expenseInput.safeParse(await req.json().catch(() => null));
  if (!id || !input.success) return Response.json({ error: "Please check the amount and fields." }, { status: 400 });
  if (!(await updateExpense(user.id, id, input.data))) {
    return Response.json({ error: "This expense or its category is no longer available. Please refresh and try again." }, { status: 404 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/expenses/[id]">) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const id = await routeId(ctx.params);
  if (!id || !(await softDeleteExpense(user.id, id))) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
