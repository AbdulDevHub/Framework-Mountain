import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardContent } from "./DashboardContent";

// This file has NO "use client" directive — it's a Server Component,
// which means auth() (an async server-only function) runs on the
// server, before any HTML is even sent to the browser. If there's no
// session, redirect() happens server-side and the browser never
// receives dashboard content at all — not "receives it then hides it
// with JS," which would briefly leak content to anyone reading the
// network tab. This is the actual gate; the NavBar hiding "Dashboard"
// for signed-out users is just a convenience, not the security
// boundary.
export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Everything below this point is interactive (forms, live queries),
  // which Server Components can't do — that's what DashboardContent
  // (a Client Component) is for. This split — Server Component for the
  // access check, Client Component for the interactivity — is a
  // pattern you'll want to repeat for any other protected page.
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Your job search at a glance.</p>
      </div>
      <DashboardContent />
    </main>
  );
}