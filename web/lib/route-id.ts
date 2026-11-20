// The id in an API route's URL (for example /api/expenses/42), or null if it isn't a positive whole number
export async function routeId(params: Promise<{ id: string }>) {
  const id = Number((await params).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
