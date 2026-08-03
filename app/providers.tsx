"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { SessionProvider } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";

// ─────────────────────────────────────────────
// Why useState(() => new X()), not just `const x = new X()`
// ─────────────────────────────────────────────
// This looks unnecessarily roundabout for something that seems like it
// should just be a module-level constant. The reason is Next.js's
// server rendering: on the server, this component's module can be
// shared across MULTIPLE different users' requests in the same
// process. A plain module-level `const queryClient = new QueryClient()`
// would mean every visitor shares the same cache — one user's data
// could leak into another's render. `useState(() => ...)` creates a
// fresh instance PER COMPONENT INSTANCE (i.e. per request during SSR,
// per browser tab on the client), which is what you actually want. The
// arrow-function form (not `useState(new QueryClient())`) matters too —
// without it, a new QueryClient would be constructed on every render
// just to be thrown away, since useState still evaluates its argument
// eagerly if it's not a function.

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          // Relative URL — works whether you're on localhost:3000 or a
          // real deployed domain, since it resolves against wherever
          // the page itself is being served from. Points at
          // app/api/trpc/[trpc]/route.ts.
          url: "/api/trpc",
        }),
      ],
    })
  );

  return (
    <SessionProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  );
}
