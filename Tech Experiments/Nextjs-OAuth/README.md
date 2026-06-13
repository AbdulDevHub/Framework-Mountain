# Next.js Auth.js OAuth — GitHub Login

A learning project implementing GitHub OAuth in Next.js 16 using Auth.js (NextAuth v5). Covers the full authentication flow, session management, and server-side route protection.

---

## Stack

- **Next.js 16** — App Router, TypeScript, Tailwind CSS
- **Auth.js (NextAuth v5)** — OAuth handling, session management
- **GitHub OAuth** — login provider

---

## Project Structure

```
my-auth-app/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts       ← catch-all route for OAuth callbacks
│   ├── dashboard/
│   │   └── page.tsx               ← protected route (server-side)
│   ├── layout.tsx                 ← wraps app with SessionProvider
│   └── page.tsx                   ← home page with login/logout UI
├── auth.ts                        ← Auth.js config (providers, exports)
├── .env.local                     ← secrets (never commit this)
└── AGENTS.md                      ← instructions for AI coding assistants
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```
AUTH_SECRET=your_generated_secret     # run: npx auth secret
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
```

`AUTH_SECRET` is the encryption key for session cookies. If you change it, all existing sessions are immediately invalidated.

---

## How to Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

---

## Setting Up GitHub OAuth

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
2. Fill in:
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
3. Copy the **Client ID** and generate a **Client Secret**
4. Paste both into `.env.local`

---

## Key Files Explained

### `auth.ts`
The brain of the auth setup. Configures Auth.js with the GitHub provider and exports four things used throughout the app:

```ts
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
})
```

| Export | Purpose |
|---|---|
| `handlers` | Wires up the API route that GitHub calls back to |
| `signIn` | Triggers the GitHub login redirect |
| `signOut` | Ends the session and clears the cookie |
| `auth` | Reads the current session on the server |

### `app/api/auth/[...nextauth]/route.ts`
A catch-all API route that handles all Auth.js endpoints automatically — `/api/auth/signin`, `/api/auth/callback/github`, `/api/auth/signout`, etc.

```ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

### `app/layout.tsx`
Wraps the entire app in `SessionProvider`, which shares session state across all components without manually passing it through props.

### `app/dashboard/page.tsx` — Protected Route
The core pattern for server-side route protection:

```ts
const session = await auth()

if (!session) {
  redirect("/")
}
```

This runs on the server before any HTML is sent to the browser, so unauthenticated users never receive the page at all.

---

## The OAuth Flow (What Happens at Login)

```
1. User clicks "Sign in with GitHub"
2. App redirects to GitHub
3. User approves access on GitHub
4. GitHub sends a code to /api/auth/callback/github
5. Auth.js exchanges the code for the user's profile info
6. Auth.js encrypts the session and stores it as a cookie
7. auth() decrypts that cookie and returns the session object
```

---

## The Session Object

After login, `auth()` returns a session that looks like this:

```json
{
  "user": {
    "name": "Your Name",
    "email": "you@example.com",
    "image": "https://avatars.githubusercontent.com/..."
  },
  "expires": "2026-07-13T17:26:48.213Z"
}
```

The session is stored as an **encrypted JWT cookie** (`authjs.session-token`) in the browser. There is no database involved — all session data lives in the cookie, encrypted using `AUTH_SECRET`.

Note: the GitHub access token is intentionally not exposed in the session by default. It can be surfaced via the `callbacks.session` option in `auth.ts` if needed.

---

## Route Protection: Two Approaches

### `redirect()` in each page — used in this project
Best for a small number of protected routes or when each page needs custom logic. Simple and explicit — you can see exactly what's happening in the file.

```ts
const session = await auth()
if (!session) redirect("/")
```

### `middleware.ts` — better for production apps
Best when you have many protected routes. One file protects everything matching a pattern, so you're not repeating the same check on every page.

```ts
// middleware.ts
import { auth } from "@/auth"

export default auth((req) => {
  if (!req.auth) {
    return Response.redirect(new URL("/", req.url))
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"]
}
```

---

## What Auth.js Abstracts (and Why It Matters)

Auth.js handles a lot of complexity that you'd otherwise have to implement manually. Knowing **what it does under the hood** helps you reason about it better and speak confidently in interviews or on teams.

### What you'd handle manually without Auth.js:

**The OAuth handshake** — redirecting to GitHub, receiving the authorization code, exchanging it for an access token, and fetching the user profile are all separate HTTP requests with specific headers and error handling. Auth.js wraps this into a single provider config.

**JWT creation and validation** — after login you need to create a signed token, store it securely, and validate it on every subsequent request. Auth.js handles signing (using `AUTH_SECRET`), cookie storage, and decryption via `auth()`.

**Session expiry and refresh** — tokens expire and need to be rotated. Auth.js manages this automatically.

**CSRF protection** — OAuth flows are vulnerable to cross-site request forgery attacks. Auth.js adds CSRF tokens to sign-in/sign-out flows automatically.

### The takeaway:
Using Auth.js doesn't mean you don't understand auth — it means you've chosen not to reinvent a solved problem. But knowing the manual JWT approach (creating tokens with `jsonwebtoken`, storing them in cookies, validating on each request) means you understand what the library is doing on your behalf. That understanding lets you debug edge cases, customize behavior through callbacks, and make informed decisions about when a library is the right choice versus rolling your own.

---

## Useful Links

- [Auth.js Docs](https://authjs.dev)
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [GitHub OAuth Apps](https://github.com/settings/developers)