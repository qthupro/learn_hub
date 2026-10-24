import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/landing/section";
import { cn } from "@/lib/utils";

const facts = [
  { value: "1×", label: "Pay once per course" },
  { value: "$0", label: "Monthly fees, ever" },
  { value: "∞", label: "Rewatch any lesson" },
];

const enter = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-8 motion-safe:duration-700 motion-safe:fill-mode-backwards";

export function Hero() {
  return (
    <section className="overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-28 sm:pb-28 lg:px-8 lg:pt-32">
        <Eyebrow className={enter}>Video courses · No subscriptions</Eyebrow>
        <h1
          className={cn(
            "mt-8 text-[clamp(3.25rem,12vw,9rem)] leading-[0.88] font-black tracking-[-0.06em]",
            enter,
            "motion-safe:delay-100",
          )}
        >
          Buy it once.{" "}
          <span className="block">
            Keep it{" "}
            <span className="inline-block -rotate-2 rounded-[0.12em] bg-brand px-[0.1em] pb-[0.04em] text-brand-foreground">
              forever.
            </span>
          </span>
        </h1>

        <div
          className={cn(
            "mt-12 flex flex-col gap-10 lg:mt-16 lg:flex-row lg:items-end lg:justify-between",
            enter,
            "motion-safe:delay-200",
          )}
        >
          <p className="max-w-xl text-lg/relaxed font-medium sm:text-xl/relaxed">
            Expert-led video courses in development, design, data and more. One price, lifetime
            access, and every future update included.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-13 rounded-full bg-brand px-7 text-base font-bold text-brand-foreground hover:bg-brand/85"
              nativeButton={false}
              render={<Link href="/#courses" />}
            >
              Browse courses
              <ArrowRightIcon data-icon="inline-end" className="transition-transform group-hover/button:translate-x-0.5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 rounded-full border-2 border-foreground bg-transparent px-7 text-base font-bold hover:bg-foreground hover:text-background dark:border-foreground dark:bg-transparent dark:hover:bg-foreground"
              nativeButton={false}
              render={<Link href="/#benefits" />}
            >
              How it works
            </Button>
          </div>
        </div>

        <dl
          className={cn(
            "mt-16 grid grid-cols-3 border-t-2 border-foreground sm:mt-24",
            enter,
            "motion-safe:delay-300",
          )}
        >
          {facts.map((fact) => (
            // Label first for screen readers; the big number is shown on top.
            <div
              key={fact.label}
              className="flex flex-col-reverse justify-end gap-2 border-foreground pt-6 pr-3 not-first:border-l-2 not-first:pl-4 sm:pr-6 sm:not-first:pl-8"
            >
              <dt className="text-sm font-semibold sm:text-base">{fact.label}</dt>
              <dd className="text-4xl leading-none font-black tracking-[-0.05em] sm:text-7xl">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
