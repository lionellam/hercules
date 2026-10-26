import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

export type ParsedExpense = {
  amount: number | null;
  currency: string;
  category: string;
  merchant: string | null;
  date: string;
  remarks: string | null;
};

const MODEL = process.env.HERCULES_MODEL ?? "claude-haiku-5-5";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function shiftDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildPrompt(rawInput: string, categories: string[], today: string) {
  const yesterday = shiftDays(today, -1);
  return `You are an expense parser. Extract structured expense details from the user's natural language input.

The user's input is:
"${rawInput}"

Today's date is ${today}.

The user's available expense categories are:
${categories.map((c) => `- ${c}`).join("\n")}

Instructions:
- Choose the single best-matching category from the list above. If nothing fits, use "Other".
- For "amount", return a number only (no currency symbols). Return null if no amount is given.
- For "currency", default to "SGD" if not mentioned.
- For "date", return the date in YYYY-MM-DD format using these rules in order:
  (1) If the user states a specific date, always use it. If no year is given, assume the year from ${today}.
  (2) If the user states a relative date (e.g. "yesterday", "last Friday"), calculate the date by counting back from ${today}.
  (3) If no date is mentioned, use ${today}.
- For "merchant", return the name of the shop, restaurant, or vendor if mentioned, otherwise null.
- For "remarks", capture any extra context the user mentioned that doesn't fit the other fields, otherwise null.

Examples:
Input: "Grab ride yesterday for $12"
Output: {"amount": 12.00, "currency": "SGD", "category": "Transport", "merchant": null, "date": "${yesterday}", "remarks": null}

Input: "Coffee at Ya Kun for $4.50"
Output: {"amount": 4.50, "currency": "SGD", "category": "Food & Dining", "merchant": "Ya Kun", "date": "${today}", "remarks": null}`;
}

export class ParseError extends Error {}

export async function parseExpense(rawInput: string, categories: string[], today: string): Promise<ParsedExpense> {
  if (!process.env.ANTHROPIC_API_KEY) {
    if (process.env.NODE_ENV === "production") throw new ParseError("Parser is not configured");
    return standInParse(rawInput, categories, today);
  }

  const schema = z.object({
    amount: z.number().nullable(),
    currency: z.string(),
    category: z.enum(categories as [string, ...string[]]),
    merchant: z.string().nullable(),
    date: z.string(),
    remarks: z.string().nullable(),
  });

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: zodOutputFormat(schema) },
    messages: [{ role: "user", content: buildPrompt(rawInput, categories, today) }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new ParseError("The model could not parse this expense");
  }
  const out = response.parsed_output;
  const currency = out.currency.trim().toUpperCase();
  return {
    ...out,
    currency: /^[A-Z]{3}$/.test(currency) ? currency : "SGD",
    date: ISO_DATE.test(out.date) ? out.date : today,
  };
}

// Keyword-based stand-in for local development without an API key.
function standInParse(raw: string, categories: string[], today: string): ParsedExpense {
  const keywords: Record<string, RegExp> = {
    "Food & Dining": /lunch|dinner|breakfast|coffee|kopi|meal|food/i,
    Transport: /grab|taxi|bus|mrt|ride|petrol/i,
    Groceries: /grocer|fairprice|ntuc|cold storage/i,
    Utilities: /sp group|electric|water|internet|phone bill/i,
  };
  const amount = raw.match(/\$?\s?(\d+(?:\.\d{1,2})?)/);
  const merchant = raw.match(/\bat\s+([A-Z][\w'&]*(?:\s+[A-Z][\w'&]*)*)/);
  const category =
    Object.entries(keywords).find(([c, re]) => categories.includes(c) && re.test(raw))?.[0] ?? "Other";
  return {
    amount: amount ? parseFloat(amount[1]) : null,
    currency: "SGD",
    category,
    merchant: merchant ? merchant[1] : null,
    date: /yesterday/i.test(raw) ? shiftDays(today, -1) : today,
    remarks: null,
  };
}
