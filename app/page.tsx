import Link from "next/link";
import { ArrowRight, Sparkles, Bell, History, Database, ShieldCheck, Layers } from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Track every application",
    description: "Log applications, link job postings and resume variants, and keep notes — all in one place.",
  },
  {
    icon: Sparkles,
    title: "Match without AI",
    description: "Score your resume against postings using Postgres full-text search and trigram similarity. No LLM, just SQL.",
  },
  {
    icon: History,
    title: "Full status history",
    description: "Every status change is recorded as a timeline, so you can see exactly how each application progressed.",
  },
  {
    icon: Bell,
    title: "Smart reminders",
    description: "Queue follow-up reminders with BullMQ and get notified at exactly the right time.",
  },
];

const stack = ["tRPC", "Prisma", "Postgres", "Auth.js", "BullMQ", "OpenTelemetry"];

export default function HomePage() {
  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="bg-hero-fade">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-medium text-brand-700">
              <Database className="h-3.5 w-3.5" />
              Postgres-native matching — no AI
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
              Track your job search,{" "}
              <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
                match your resume
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              CareerFlow is a full-stack job application tracker. Log applications, score your resume against postings
              with real Postgres full-text search, and never miss a follow-up.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                View the live demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition-transform duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <f.icon className="h-5 w-5 text-brand-600" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6">
            <p className="text-sm font-medium text-slate-500">Built with a modern full-stack toolkit</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {stack.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs text-slate-600"
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              Authenticated with Auth.js · JWT sessions · OAuth + credentials
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}