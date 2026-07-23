"use client";

import { createBrowserClient } from "@insforge/sdk/ssr";

export const insforge = createBrowserClient({
  refreshUrl: "/api/auth/refresh",
});
