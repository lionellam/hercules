import { z } from "zod";
import { currentUser, unauthorized } from "@/lib/session";
import { claimParse, getCategories, monthMerchants, realDate, DAILY_PARSE_LIMIT } from "@/lib/expenses";
import { parseExpense, ParseError } from "@/lib/parser";
import { stopwatch } from "@/lib/timing";

const body = z.object({
  text: z.string().trim().min(1).max(500),
  today: realDate,
  // Sent by the device when Intelligent Merchant Selection is switched on there (Architecture decision 40)
  knownMerchants: z.boolean().optional(),
});

export async function POST(req: Request) {
  const timer = stopwatch();
  const user = await currentUser();
  timer.lap("auth");
  if (!user) return unauthorized();

  const input = body.safeParse(await req.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Please enter an expense." }, { status: 400 });

  const allowed = await claimParse(user.id);
  timer.lap("limit");
  if (!allowed) {
    return Response.json(
      { error: `Daily limit of ${DAILY_PARSE_LIMIT} entries reached. Please try again tomorrow.` },
      { status: 429 },
    );
  }

  const categories = await getCategories(user.id);
  timer.lap("categories");
  let knownMerchants: string[] | undefined;
  if (input.data.knownMerchants) {
    knownMerchants = await monthMerchants(user.id, input.data.today.slice(0, 7));
    timer.lap("merchants");
  }
  try {
    const result = await parseExpense(input.data.text, categories.map((c) => c.name), input.data.today, user.default_currency, knownMerchants);
    timer.lap("model");
    timer.log("ok", result, knownMerchants?.length);
    const parsed = result.expense;
    const category = categories.find((c) => c.name === parsed.category) ?? categories.find((c) => c.name === "Other");
    return Response.json({ ...parsed, category_id: category?.id ?? null }, { headers: { "Server-Timing": timer.header() } });
  } catch (e) {
    timer.lap("model");
    timer.log("failed", undefined, knownMerchants?.length);
    console.error("parse failed", e);
    const message = e instanceof ParseError ? e.message : "Parsing failed. Please try rephrasing.";
    return Response.json({ error: message }, { status: 502, headers: { "Server-Timing": timer.header() } });
  }
}
