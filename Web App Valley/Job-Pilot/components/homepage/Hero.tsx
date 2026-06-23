import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
      <div className="mx-auto max-w-[1440px] border border-border bg-surface">
        <div className="landing-hero-glow border-b border-border px-6 py-16 text-center sm:px-10 sm:py-20 lg:px-16 lg:py-24">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-[clamp(2.75rem,7vw,4.625rem)] font-semibold leading-[0.94] tracking-[-0.045em] text-text-slate">
              Job hunting is hard.
              <br />
              Your tools shouldn&apos;t be.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
              Find better job matches, tailor your resume for every role, and
              keep everything organized in one place.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="landing-button-primary"
              >
                Get Started
                <span className="ml-2 text-xs">{">"}</span>
              </Link>
              <Link
                href="/login"
                className="landing-button-secondary"
              >
                Find Your First Match
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-surface-tertiary px-4 pt-7 sm:px-8 lg:px-10">
          <div className="landing-browser-frame landing-browser-shadow mx-auto max-w-[1114px] overflow-hidden rounded-[26px] bg-surface">
            <Image
              src="/images/dashboard-demo.png"
              alt="JobPilot dashboard preview"
              width={4788}
              height={2416}
              priority
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
