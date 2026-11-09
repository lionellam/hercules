import { toCsv } from "@/lib/csv";
import { MONTH } from "@/lib/dates";
import { exportExpenses } from "@/lib/expenses";
import { currentUser, unauthorized } from "@/lib/session";

const HEADER = ["Date", "Category", "Merchant", "Amount", "Currency", "Remarks", "What you typed", "Edited", "Logged at"];

// The month's expenses as a CSV download (Specification 4.5)
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const month = new URL(req.url).searchParams.get("month") ?? "";
  if (!MONTH.test(month)) return Response.json({ error: "Invalid month" }, { status: 400 });

  const rows = await exportExpenses(user.id, month);
  const csv = toCsv([
    HEADER,
    ...rows.map((e) => [
      e.date,
      e.category,
      e.merchant ?? "",
      e.amount.toFixed(2),
      e.currency,
      e.remarks ?? "",
      e.raw_input,
      e.was_edited ? "Yes" : "No",
      e.logged_at,
    ]),
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hercules-expenses-${month}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
