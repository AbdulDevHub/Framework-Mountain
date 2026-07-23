import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";

export async function createInsforgeServer() {
  return createServerClient({
    cookies: await cookies(),
  });
}
