"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Briefcase, LogOut } from "lucide-react";

export function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      pathname === href ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center gap-1 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-4 flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Briefcase className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">CareerFlow</span>
        </Link>

        <Link href="/demo" className={linkClass("/demo")}>
          Demo
        </Link>

        {status === "authenticated" && (
          <>
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              Dashboard
            </Link>
            <Link href="/reminders" className={linkClass("/reminders")}>
              Reminders
            </Link>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {status === "loading" && <span className="text-sm text-slate-400">…</span>}

          {status === "authenticated" && (
            <>
              <span className="hidden text-sm text-slate-500 md:inline">{session.user?.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          )}

          {status === "unauthenticated" && (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}