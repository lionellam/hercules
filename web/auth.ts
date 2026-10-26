import NextAuth, { type DefaultSession } from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { isAllowed, upsertUser } from "@/lib/users";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

const providers: Provider[] = [Google];

// Local testing without Google credentials. Never enabled in production builds.
export const devLoginEnabled =
  process.env.NODE_ENV !== "production" && process.env.DEV_LOGIN === "true";

if (devLoginEnabled) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev login",
      credentials: { email: { label: "Email" } },
      authorize: async (c) => {
        const email = typeof c?.email === "string" ? c.email : "";
        return email ? { email, name: email.split("@")[0] } : null;
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt", maxAge: 90 * 24 * 60 * 60 },
  pages: { signIn: "/signin", error: "/signin" },
  callbacks: {
    async signIn({ user }) {
      return !!user.email && (await isAllowed(user.email));
    },
    async jwt({ token, user, account }) {
      if (account && user?.email) {
        const googleId = account.provider === "google" ? account.providerAccountId : null;
        token.uid = await upsertUser(user.email, googleId, user.name ?? null);
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.uid as string;
      return session;
    },
  },
});
