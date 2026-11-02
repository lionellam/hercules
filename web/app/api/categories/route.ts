import { currentUser, unauthorized } from "@/lib/session";
import { categoryInput, createCategory, getCategories, MAX_CATEGORIES } from "@/lib/expenses";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return Response.json(await getCategories(user.id));
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const input = categoryInput.safeParse(await req.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Please check the name and budget." }, { status: 400 });
  const id = await createCategory(user.id, input.data);
  if (!id) {
    return Response.json({ error: `That name is already in use, or you've reached the limit of ${MAX_CATEGORIES} categories.` }, { status: 400 });
  }
  return Response.json({ id }, { status: 201 });
}
