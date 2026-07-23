import { GitBranch, Globe, ShieldCheck } from "lucide-react";

const errorMessages: Record<string, string> = {
  callback: "We could not finish signing you in. Please try again.",
  oauth: "We could not start that sign-in method. Please try again.",
  provider: "That sign-in method is not available.",
};

type Props = {
  error?: string;
};

export function LoginCard({ error }: Props) {
  const message = error ? errorMessages[error] : null;

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1440px] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[24px] border border-border bg-surface shadow-card lg:grid-cols-[1.05fr_0.95fr]">
        <div className="landing-hero-glow flex min-h-[440px] flex-col justify-between border-b border-border p-8 sm:p-10 lg:border-b-0 lg:border-r">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
              <ShieldCheck aria-hidden className="h-4 w-4 text-accent" />
              OAuth secured by InsForge
            </div>
            <h1 className="mt-8 max-w-xl text-[clamp(2.35rem,5vw,4.25rem)] font-semibold leading-[0.96] tracking-[-0.04em] text-text-slate">
              Sign in and let the agent prep your next application.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-text-secondary sm:text-lg">
              Connect with Google or GitHub to start building your profile,
              matching jobs, and creating tailored application materials.
            </p>
          </div>

          <p className="mt-10 text-sm font-medium text-text-secondary">
            New users are routed to profile setup after sign-in.
          </p>
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-10">
          <div>
            <p className="text-sm font-medium text-text-secondary">Welcome to</p>
            <h2 className="mt-2 text-3xl font-semibold leading-9 text-text-primary">
              JobPilot
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              Choose your preferred provider to continue.
            </p>
          </div>

          {message ? (
            <div className="mt-6 rounded-md border border-error bg-surface px-4 py-3 text-sm font-medium text-error">
              {message}
            </div>
          ) : null}

          <div className="mt-8 grid gap-3">
            <form action="/api/auth/oauth/google" method="get">
              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Globe aria-hidden className="h-5 w-5 text-accent" />
                Continue with Google
              </button>
            </form>
            <form action="/api/auth/oauth/github" method="get">
              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <GitBranch aria-hidden className="h-5 w-5 text-text-primary" />
                Continue with GitHub
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
