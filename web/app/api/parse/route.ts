import { z } from "zod";
import { currentUser, unauthorized } from "@/lib/session";
import { claimParse, getCategories, realDate, DAILY_PARSE_LIMIT } from "@/lib/expenses";
import { parseExpense, ParseError, type ParseResult } from "@/lib/parser";

const body = z.object({
  text: z.string().trim().min(1).max(500),
  today: realDate,
});

// Architecture decision 37: how long each step took, never the expense text or who parsed it
function stopwatch() {
  const start = performance.now();
  let last = start;
  const steps: [string, number][] = [];
  let total: number | undefined;
  const totalMs = () => (total ??= Math.round(performance.now() - start));
  return {
    lap(name: string) {
      const now = performance.now();
      steps.push([name, Math.round(now - last)]);
      last = now;
    },
    header() {
      return [...steps, ["total", totalMs()] as [string, number]]
        .map(([n, ms]) => `${n};dur=${ms}`)
        .join(", ");
    },
    log(outcome: string, result?: ParseResult) {
      const parts = [...steps.map(([n, ms]) => `${n}=${ms}ms`), `total=${totalMs()}ms`];
      if (result) {
        parts.push(`using=${result.model}`);
        if (result.usage) parts.push(`tokens_in=${result.usage.input}`, `tokens_out=${result.usage.output}`);
      }
      console.log(`parse timing ${outcome} ${parts.join(" ")}`);
    },
  };
}

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
  try {
    const result = await parseExpense(input.data.text, categories.map((c) => c.name), input.data.today, user.default_currency);
    timer.lap("model");
    timer.log("ok", result);
    const parsed = result.expense;
    const category = categories.find((c) => c.name === parsed.category) ?? categories.find((c) => c.name === "Other");
    return Response.json({ ...parsed, category_id: category?.id ?? null }, { headers: { "Server-Timing": timer.header() } });
  } catch (e) {
    timer.lap("model");
    timer.log("failed");
    console.error("parse failed", e);
    const message = e instanceof ParseError ? e.message : "Parsing failed. Please try rephrasing.";
    return Response.json({ error: message }, { status: 502, headers: { "Server-Timing": timer.header() } });
  }
}
