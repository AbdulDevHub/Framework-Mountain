import { handlers } from "@/lib/auth";

// Auth.js v5 exposes GET/POST handlers directly — this file just wires
// them into the App Router's route convention. Handles sign-in,
// sign-out, callback, and session endpoints under /api/auth/*.
export const { GET, POST } = handlers;
