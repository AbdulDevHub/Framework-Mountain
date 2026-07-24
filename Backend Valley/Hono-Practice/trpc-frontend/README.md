# Trpc-Hono-Frontend

![My Screenshot](./Screenshot.png)

A minimal Next.js (App Router) client demonstrating end-to-end type inference from the [tRPC backend](../README.md) one level up. This exists to prove the client side of the stack works, not as a project in its own right — see the root README for the actual API reference, auth model, and what this whole learning project covers.

## What's here

- `app/_trpc/client.ts` — creates the typed `trpc` object via `createTRPCReact<AppRouter>()`, importing the `AppRouter` **type only** from `../src/trpc/router.ts` in the backend. No backend code runs here; only the shape is imported.
- `app/_trpc/Provider.tsx` — wires up `@trpc/react-query` and `@tanstack/react-query`, pointing at `http://localhost:3000/trpc`.
- `app/page.tsx` — a task list using `trpc.tasks.list.useQuery()`, plus `create` / `update` / `delete` mutations with optimistic updates.

## Running it

1. Make sure the backend is running first — see the [root README](../README.md#local-setup). It must be on `http://localhost:3000` and `ALLOWED_ORIGINS` must include this app's dev URL (`http://localhost:3001` by default).
2. Install and run:

```bash
   npm install
   npm run dev
```

1. Open the printed local URL (Next.js will pick `3001` automatically since `3000` is taken by the backend).

### Known rough edge

`Provider.tsx` currently hardcodes a JWT in the `Authorization` header for demo purposes — grab a token via `POST /auth/register` or `/auth/login` on the backend and paste it in. A real app would store this from an actual login flow (cookie or client-side state), not hardcode it; this project stops short of that since auth UI wasn't the focus of the tRPC exercise.

## Why the relative type import works

This app lives *inside* the backend repo (`trpc-hono-practice/trpc-frontend/`) rather than as a separate project, specifically so `app/_trpc/client.ts` can do:

```ts
import type { AppRouter } from '../../../src/trpc/router'
```

with no workspace tooling, package publishing, or monorepo setup required — just a relative path crossing into the sibling backend folder. That's a fine pattern for a learning project or small internal tool; a larger real-world split-repo setup would typically publish the router type as its own package instead.
