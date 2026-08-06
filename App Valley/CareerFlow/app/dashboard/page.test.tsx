import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocked so this test never imports the real Auth.js/NextAuth config
// (which pulls in the GitHub provider, PrismaAdapter, etc.) — the thing
// under test is "does the page call redirect() when there's no
// session," not Auth.js's own internals.
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Next's real redirect() throws a special NEXT_REDIRECT error to
// interrupt rendering — mirror that here so DashboardPage's control
// flow (no code path after redirect()) is exercised the same way it
// would be in production, instead of silently falling through to the
// render below it.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

// DashboardContent is a Client Component with its own tRPC data
// fetching — irrelevant to the security gate, which is entirely about
// what happens in page.tsx *before* this ever renders.
vi.mock("./DashboardContent", () => ({
  DashboardContent: () => null,
}));

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardPage from "./page";

describe("DashboardPage — Server Component security gate", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(redirect).mockClear();
  });

  it("redirects to /login before rendering anything when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    // The gate throws (via our redirect mock) rather than returning —
    // exactly like production, where redirect() never lets execution
    // reach the JSX below it.
    await expect(DashboardPage()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("renders dashboard content instead of redirecting when a session is present", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "a@example.com" },
      expires: "2099-01-01",
    } as never);

    const result = await DashboardPage();

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});
