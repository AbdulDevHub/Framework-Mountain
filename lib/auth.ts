import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma";
import { env } from "./env";

// ─────────────────────────────────────────────
// Why JWT strategy even though we're using PrismaAdapter
// ─────────────────────────────────────────────
// PrismaAdapter normally implies "database sessions" (a Session row per
// login, looked up on every request). We're deliberately overriding that
// with `session: { strategy: "jwt" }` — per the schema decision, there's
// no Session model. The adapter is still useful here because it gives us
// User/Account persistence (linking OAuth accounts to Users) for free;
// we just don't use its session storage.
//
// One real constraint this creates: the Credentials provider CANNOT be
// used together with database sessions in Auth.js (the adapter has no
// concept of "log in with a password" — only OAuth account linking). JWT
// strategy is actually *required*, not just a schema preference, for
// credentials + OAuth to coexist.

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GitHub({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });

        // Two cases collapse into the same "return null" (invalid
        // credentials): no user with that email, OR a user that only
        // has OAuth accounts (hashedPassword is null, e.g. GitHub-only).
        // Don't distinguish these in the response — that would leak
        // which emails are registered.
        if (!user || !user.hashedPassword) return null;

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;

        // Whatever's returned here becomes `user` in the jwt() callback.
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    // Runs whenever a JWT is created or updated. `user` is only present
    // on sign-in (from the provider's `authorize`/OAuth profile) — on
    // every subsequent request only `token` is passed in, so we persist
    // the DB user id onto the token here, once, at sign-in time.
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    // Runs whenever a session is checked (e.g. in tRPC context on every
    // request). Copies the id off the token onto the session object so
    // downstream code can do `session.user.id` instead of decoding the
    // token by hand.
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
