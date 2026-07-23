import { NextRequest, NextResponse } from "next/server";
import type { ResponseCookies } from "next/dist/server/web/spec-extension/cookies";
import type { RequestCookies } from "next/dist/server/web/spec-extension/cookies";
import { updateSession } from "@insforge/sdk/ssr";
import type { CookieOptions, CookieStore } from "@insforge/sdk/ssr";

function createCookieStoreAdapter(
  cookies: RequestCookies | ResponseCookies,
): CookieStore {
  function setCookie(
    name: string,
    value: string,
    options?: CookieOptions,
  ): unknown;
  function setCookie(
    options: { name: string; value: string } & CookieOptions,
  ): unknown;
  function setCookie(
    nameOrOptions: string | ({ name: string; value: string } & CookieOptions),
    value?: string,
    options?: CookieOptions,
  ): unknown {
    if (typeof nameOrOptions === "string") {
      cookies.set({ name: nameOrOptions, value: value ?? "", ...options });
      return;
    }

    cookies.set(nameOrOptions);
    return undefined;
  }

  function deleteCookie(name: string): unknown;
  function deleteCookie(options: { name: string } & CookieOptions): unknown;
  function deleteCookie(
    nameOrOptions: string | ({ name: string } & CookieOptions),
  ): unknown {
    cookies.delete(
      typeof nameOrOptions === "string" ? nameOrOptions : nameOrOptions.name,
    );
    return undefined;
  }

  return {
    get: (name: string) => cookies.get(name),
    set: setCookie,
    delete: deleteCookie,
  };
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request });
  const session = await updateSession({
    requestCookies: createCookieStoreAdapter(request.cookies),
    responseCookies: createCookieStoreAdapter(response.cookies),
  });

  if (!session.accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/find-jobs/:path*"],
};
