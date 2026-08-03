import type { DefaultSession } from "next-auth";

// Auth.js's default Session["user"] type only has name/email/image.
// We're attaching `id` to it in the session() callback, so we need to
// tell TypeScript that's there — otherwise every ctx.session.user.id
// access in the routers would be a type error.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
