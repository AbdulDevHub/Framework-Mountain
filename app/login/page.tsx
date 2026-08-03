"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { FieldWrapper, TextInput } from "@/app/components/ui/FormFields";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // redirect: false is deliberate — it lets US decide what happens
    // on failure (show an inline error) instead of Auth.js redirecting
    // to an error page. On success we redirect manually below.
    const result = await signIn("credentials", { email, password, redirect: false });

    setSubmitting(false);

    if (result?.error) {
      // Auth.js intentionally returns a generic error here — see the
      // comment in lib/auth.ts's authorize() about not distinguishing
      // "no such user" from "wrong password" in the response.
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Log in</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back to CareerFlow.</p>

          <form onSubmit={handleCredentialsLogin} className="mt-6 space-y-4">
            <FieldWrapper label="Email">
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </FieldWrapper>
            <FieldWrapper label="Password">
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </FieldWrapper>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full">
              <LogIn className="h-4 w-4" />
              {submitting ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* GitHub's flow is a full redirect (out to GitHub, back via the
              callback URL), so no redirect:false / manual error handling
              needed the way the credentials form above needs it. */}
          <Button variant="secondary" onClick={() => signIn("github", { callbackUrl: "/dashboard" })} className="w-full">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Sign in with GitHub
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          No account?{" "}
          <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}