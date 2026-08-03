"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../server/routers/_app";

// This is the entire mechanism behind "type safety from backend to
// frontend with no manually-written types." createTRPCReact reads the
// AppRouter TYPE (imported above — note this is a `import type`, no
// actual server code gets bundled into the client) and generates a
// React hook for every procedure in it, matching its exact input/output
// shapes. Add a new procedure to a router, and `trpc.newThing.useQuery()`
// exists with full autocomplete the moment you save the file — nothing
// to regenerate, nothing to keep in sync by hand.
export const trpc = createTRPCReact<AppRouter>();
