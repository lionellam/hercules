import { currentUser, unauthorized } from "@/lib/session";
import { categoryInput, createCategory, getCategories, getRetiredCategories, MAX_CATEGORIES } from "@/lib/expenses";

// ?retired=1 lists retired categories instead of active ones
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const retired = new URL(req.url).searchParams.get("retired") === "1";
  return Response.json(await (retired ? getRetiredCategories(user.id) : getCategories(user.id)));
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const input = categoryInput.safeParse(await req.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Please check the name and budget." }, { status: 400 });
  const created = await createCategory(user.id, input.data);
  if (!created) {
    return Response.json({ error: `That name is already in use, or you've reached the limit of ${MAX_CATEGORIES} categories.` }, { status: 400 });
  }
  return Response.json(created, { status: created.restored ? 200 : 201 });
}
