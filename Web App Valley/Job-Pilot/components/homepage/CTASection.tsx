import Link from "next/link";

export function CTASection() {
  return (
    <section className="px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
      <div className="landing-panel landing-hero-glow mx-auto max-w-[1440px] px-6 py-16 text-center sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-text-slate">
            Your next job search can feel a lot less overwhelming
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
            Set up your profile, upload your resume, and start finding matches
            in minutes.
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
    </section>
  );
}
