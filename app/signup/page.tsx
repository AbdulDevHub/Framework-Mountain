"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/app/components/ui/Button";
import { FieldWrapper, TextInput } from "@/app/components/ui/FormFields";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // This is the pattern every tRPC mutation call follows on the
  // frontend: trpc.<router>.<procedure>.useMutation(). onError and
  // onSuccess are optional callbacks — signup.error and signup.isPending
  // (used below in the JSX) come from this hook's return value too, no
  // separate useState needed for loading/error UI.
  const signup = trpc.auth.signup.useMutation({
    onSuccess: async () => {
      // Signup and login are two separate steps on purpose — see the
      // comment in server/routers/auth.ts. The mutation above only
      // created the User row; THIS is what actually logs them in and
      // sets the session cookie, using the same credentials they just
      // submitted.
      await signIn("credentials", { email, password, redirect: false });
      router.push("/dashboard");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    signup.mutate({ email, password, name: name || undefined });
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sign up</h1>
          <p className="mt-1 text-sm text-slate-500">Create your CareerFlow account.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <FieldWrapper label="Name" hint="Optional">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </FieldWrapper>
            <FieldWrapper label="Email">
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </FieldWrapper>
            <FieldWrapper label="Password" hint="At least 8 characters">
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </FieldWrapper>

            {/* signup.error is a TRPCClientError — .message carries the
                message we threw server-side (e.g. "An account with this
                email already exists" from the CONFLICT case in auth.ts) */}
            {signup.error && <p className="text-sm text-red-600">{signup.error.message}</p>}

            <Button type="submit" disabled={signup.isPending} className="w-full">
              <UserPlus className="h-4 w-4" />
              {signup.isPending ? "Creating account…" : "Sign up"}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}