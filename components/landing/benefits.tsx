import {
  CheckIcon,
  CreditCardIcon,
  InfinityIcon,
  ListChecksIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  XIcon,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/landing/section";

const benefits = [
  {
    icon: InfinityIcon,
    title: "Own it for life",
    description: "One payment unlocks the course permanently. Rewatch any lesson, any time.",
  },
  {
    icon: RefreshCwIcon,
    title: "Free updates included",
    description: "When a course is refreshed, you get the new material at no extra cost.",
  },
  {
    icon: ListChecksIcon,
    title: "Track your progress",
    description: "Pick up exactly where you left off, with progress saved across lessons.",
  },
  {
    icon: SmartphoneIcon,
    title: "Learn on any device",
    description: "Stream in HD on desktop, tablet or phone with a fast, distraction-free player.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Secure checkout",
    description: "Payments are processed by Stripe. We never see or store your card details.",
  },
  {
    icon: CreditCardIcon,
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
    <Section id="benefits">
      <SectionHeading
        eyebrow="Why LearnHub"
        title="Simple pricing that respects your time and money"
        description="Subscriptions charge you for the months you're busy. We charge once, for the course you actually want."
        className="mb-12 sm:mb-16"
      />
      <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map(({ icon: Icon, title, description }) => (
          <div key={title} className="space-y-3 bg-background p-6 sm:p-8">
            <span className="grid size-10 place-items-center rounded-lg border bg-card shadow-xs">
              <Icon aria-hidden className="size-5 text-brand" />
            </span>
            <h3>{title}</h3>
            <p className="text-sm/relaxed text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-2xl border bg-card shadow-xs">
        <table className="w-full text-sm">
          <caption className="sr-only">LearnHub compared with subscription platforms</caption>
          <thead>
            <tr className="border-b bg-muted/40">
              <th scope="col" className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                What you get
              </th>
              <th scope="col" className="px-5 py-3.5 text-center font-semibold">
                LearnHub
              </th>
              <th scope="col" className="px-5 py-3.5 text-center font-medium text-muted-foreground">
                Subscriptions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {comparison.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="px-5 py-3.5 text-left font-normal">
                  {row.label}
                </th>
                {[row.us, row.them].map((value, index) => (
                  <td key={index} className="px-5 py-3.5">
                    {value ? (
                      <CheckIcon aria-label="Yes" className="mx-auto size-4 text-brand" />
                    ) : (
                      <XIcon aria-label="No" className="mx-auto size-4 text-muted-foreground/60" />
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
