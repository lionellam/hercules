import { currentUser, unauthorized } from "@/lib/session";
import { monthSummary, MONTH } from "@/lib/expenses";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const month = new URL(req.url).searchParams.get("month") ?? "";
  if (!MONTH.test(month)) return Response.json({ error: "Invalid month" }, { status: 400 });
  return Response.json(await monthSummary(user.id, month));
}
