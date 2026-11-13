import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import HerculesApp from "@/components/hercules-app";

export default function Page() {
  return (
    <Suspense fallback={<div className="loading">Loading…</div>}>
      <SignedInApp />
    </Suspense>
  );
}

async function SignedInApp() {
  const user = await currentUser();
  if (!user) redirect("/signin");
  // Keyed by person, so a different sign-in always starts with nothing held in memory
  return <HerculesApp key={user.id} email={user.email} defaultCurrency={user.default_currency} />;
}
