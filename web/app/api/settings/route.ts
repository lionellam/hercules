import { z } from "zod";
import { isListedCurrency } from "@/lib/currencies";
import { currentUser, unauthorized } from "@/lib/session";
import { setDefaultCurrency } from "@/lib/users";

// The person's settings stored with their account (Specification 4.6)
export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return Response.json({ default_currency: user.default_currency });
}

const body = z.object({ default_currency: z.string().refine(isListedCurrency) });

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const input = body.safeParse(await req.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Please choose a currency from the list." }, { status: 400 });
  await setDefaultCurrency(user.id, input.data.default_currency);
  return Response.json({ default_currency: input.data.default_currency });
}
