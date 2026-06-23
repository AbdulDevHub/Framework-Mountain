import Image from "next/image";

const featureItems = [
  {
    title: "Understand your match score",
    description:
      "See how your profile lines up with each role before you apply. Get a clear breakdown of what fits and what's missing.",
  },
  {
    title: "Generate cover letters quickly",
    description:
      "Write letters that feel natural and specific to each role, you can edit or regenerate anytime.",
  },
  {
    title: "Focus on the right roles",
    description:
      "Filter out low fit jobs and stay on the ones that actually matter. Spend less time sorting and more time applying.",
  },
];

export function Features() {
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="landing-panel landing-grid mx-auto grid max-w-[1440px] overflow-hidden lg:grid-cols-[1.02fr_1fr]">
        <div className="bg-surface-tertiary px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-[590px] overflow-hidden rounded-[28px] border border-border bg-surface">
            <Image
              src="/images/agnet-log.png"
              alt="JobPilot agent log output"
              width={2144}
              height={1656}
              className="h-auto w-full"
            />
          </div>
        </div>

        <div className="bg-surface">
          <div className="border-b border-border px-9 py-9 sm:px-12 sm:py-12 lg:px-14 lg:py-16">
            <h2 className="max-w-lg text-[clamp(2.2rem,5vw,3.5rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-text-slate">
              Apply With More Confidence, Every Time
            </h2>
          </div>

          <div>
            {featureItems.map((item, index) => (
              <div
                key={item.title}
                className="border-b border-border px-9 py-7 sm:px-12 lg:px-14"
              >
                <div
                  className={`max-w-xl ${
                    index === 1 ? "border-l-2 border-success pl-5" : "pl-6"
                  }`}
                >
                  <h3 className="text-lg font-semibold leading-7 text-text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-base leading-7 text-text-secondary">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
