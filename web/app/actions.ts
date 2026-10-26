"use server";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { devLoginEnabled, signIn, signOut } from "@/auth";

async function signInWith(provider: string, options: Record<string, string>) {
  try {
    await signIn(provider, { ...options, redirectTo: "/" });
  } catch (e) {
    // signIn signals success by throwing a redirect, so only Auth.js errors are handled here
    if (e instanceof AuthError) redirect(`/signin?error=${e.type}`);
    throw e;
  }
}

export async function signInWithGoogle() {
  await signInWith("google", {});
}

export async function devSignIn(formData: FormData) {
  if (!devLoginEnabled) return;
  await signInWith("dev", { email: String(formData.get("email") ?? "") });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/signin" });
}
