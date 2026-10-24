import { CheckIcon, XIcon } from "lucide-react";
import { Section, SectionHeading } from "@/components/landing/section";

const benefits = [
  {
    title: "Own it for life",
    description: "One payment unlocks the course permanently. Rewatch any lesson, any time.",
  },
  {
    title: "Free updates included",
    description: "When a course is refreshed, you get the new material at no extra cost.",
  },
  {
    title: "Track your progress",
    description: "Pick up exactly where you left off, with progress saved across lessons.",
  },
  {
    title: "Learn on any device",
    description: "Stream in HD on desktop, tablet or phone with a fast, distraction-free player.",
  },
  {
    title: "Secure checkout",
    description: "Payments are processed by Stripe. We never see or store your card details.",
  },
  {
    title: "No surprise charges",
    description: "No trials that convert, no renewals, no cancellation flows. Just a receipt.",
  },
];

const comparison = [
  { label: "Pay once per course", us: true, them: false },
  { label: "Keep access if you stop paying", us: true, them: false },
  { label: "No recurring charges", us: true, them: false },
  { label: "Free course updates", us: true, them: true },
];

export function Benefits() {
  return (
    <Section id="benefits" tone="ink">
      <SectionHeading
        eyebrow="Why LearnHub"
        title="Pricing that respects your time and money."
        description="Subscriptions charge you for the months you're busy. We charge once, for the course you actually want."
        className="mb-16 sm:mb-24"
      />
      <ol className="grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit, index) => (
          <li key={benefit.title} className="reveal space-y-3 border-t-2 border-ink-foreground pt-6">
            <span className="inline-block rounded-full bg-brand px-2.5 py-0.5 font-mono text-xs font-bold text-brand-foreground tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-2xl font-extrabold tracking-heading">{benefit.title}</h3>
            <p className="text-base/relaxed opacity-80">{benefit.description}</p>
          </li>
        ))}
      </ol>

      <div className="reveal mt-24 overflow-x-auto sm:mt-32">
        <table className="w-full min-w-md text-left text-base">
          <caption className="sr-only">LearnHub compared with subscription platforms</caption>
          <thead>
            <tr className="border-b-2 border-ink-foreground">
              <th scope="col" className="py-4 pr-4 font-mono text-xs font-bold tracking-[0.2em] uppercase">
                What you get
              </th>
              <th scope="col" className="w-32 bg-brand px-4 py-4 text-center font-black text-brand-foreground sm:w-44">
                LearnHub
              </th>
              <th scope="col" className="w-32 px-4 py-4 text-center font-bold opacity-80 sm:w-44">
                Subscriptions
              </th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((row) => (
              <tr key={row.label} className="border-b border-ink-foreground/25 last:border-b-0">
                <th scope="row" className="py-5 pr-4 font-semibold">
                  {row.label}
                </th>
                {[row.us, row.them].map((value, index) => (
                  <td key={index} className={index === 0 ? "bg-brand px-4 py-5 text-brand-foreground" : "px-4 py-5"}>
                    {value ? (
                      <CheckIcon aria-label="Yes" className="mx-auto size-6" strokeWidth={3} />
                    ) : (
                      <XIcon aria-label="No" className="mx-auto size-6 opacity-60" strokeWidth={2.5} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
