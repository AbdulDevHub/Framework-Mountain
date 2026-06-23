import Image from "next/image";

export function SuccessStory() {
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="landing-panel mx-auto max-w-[1440px] bg-surface px-6 py-16 text-center sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Success Stories
        </p>

        <blockquote className="mx-auto mt-8 max-w-4xl text-[clamp(2rem,4.1vw,3.2rem)] font-medium leading-[1.18] tracking-[-0.04em] text-text-slate">
          &ldquo;I used to spend my evenings copy-pasting resumes. Now I open my
          dashboard to see interviews waiting. It feels like cheating. Had 3
          offers on the table simultaneously.&rdquo;
        </blockquote>

        <div className="mt-9 flex items-center justify-center gap-3">
          <Image
            src="/images/user-icon.png"
            alt="Tom Wilson"
            width={56}
            height={56}
            className="h-12 w-12 rounded-full border border-border"
          />
          <div className="text-left">
            <p className="text-sm font-semibold text-text-primary">Tom Wilson</p>
            <p className="text-sm text-text-secondary">Junior Developer</p>
          </div>
        </div>
      </div>
    </section>
  );
}
