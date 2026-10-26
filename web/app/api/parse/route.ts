import { z } from "zod";
import { currentUser, unauthorized } from "@/lib/session";
import { claimParse, getCategories, ISO_DATE, DAILY_PARSE_LIMIT } from "@/lib/expenses";
import { parseExpense, ParseError } from "@/lib/parser";

const body = z.object({
  text: z.string().trim().min(1).max(500),
  today: z.string().regex(ISO_DATE),
});

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const input = body.safeParse(await req.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Please enter an expense." }, { status: 400 });

  if (!(await claimParse(user.id))) {
    return Response.json(
      { error: `Daily limit of ${DAILY_PARSE_LIMIT} entries reached. Please try again tomorrow.` },
      { status: 429 },
    );
  }

  const categories = await getCategories(user.id);
  try {
    const parsed = await parseExpense(input.data.text, categories.map((c) => c.name), input.data.today);
    const category = categories.find((c) => c.name === parsed.category) ?? categories.find((c) => c.name === "Other");
    return Response.json({ ...parsed, category_id: category?.id ?? null });
  } catch (e) {
    console.error("parse failed", e);
    const message = e instanceof ParseError ? e.message : "Parsing failed. Please try rephrasing.";
    return Response.json({ error: message }, { status: 502 });
  }
}
