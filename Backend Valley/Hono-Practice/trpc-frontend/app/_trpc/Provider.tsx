"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { trpc } from "./client"

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "http://localhost:3000/trpc",
          headers() {
            // Hardcoded for now so we can prove the wiring works end-to-end.
            // We'll swap this for a real stored token shortly.
            return {
              Authorization:
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxYTNkNDg4OC1mMjNhLTQ3MzgtYTQwZC04ODEyM2ZkODNjNjgiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3ODQ5MTU4NzksImV4cCI6MTc4NTUyMDY3OX0.4qAzNc6S0MEkZnyXpeLARa0ACLveCmjQIij140U5gXY",
            }
          },
        }),
      ],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
