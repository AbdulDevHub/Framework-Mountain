"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { trpc } from "./client"
import { getToken } from "./auth"
import { API_BASE_URL } from "./config"

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${API_BASE_URL}/trpc`,
          headers() {
            // Read fresh on every request rather than capturing a stale
            // value at Provider mount time — this way login/logout take
            // effect on the very next request without needing to recreate
            // the whole tRPC client.
            const token = getToken()
            return token ? { Authorization: `Bearer ${token}` } : {}
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
