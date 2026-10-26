import { z } from "zod";
import { currentUser, unauthorized } from "@/lib/session";
import { createExpense, expenseInput, listExpenses, MONTH } from "@/lib/expenses";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const month = new URL(req.url).searchParams.get("month") ?? "";
  if (!MONTH.test(month)) return Response.json({ error: "Invalid month" }, { status: 400 });
  return Response.json(await listExpenses(user.id, month));
}

const createBody = expenseInput.extend({ raw_input: z.string().trim().min(1).max(500) });

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const input = createBody.safeParse(await req.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Please check the amount and fields." }, { status: 400 });
  const { raw_input, ...fields } = input.data;
  const id = await createExpense(user.id, raw_input, fields);
  if (!id) return Response.json({ error: "Unknown category" }, { status: 400 });
  return Response.json({ id }, { status: 201 });
}
