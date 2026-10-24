import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, Section } from "@/components/landing/section";

export function FinalCta() {
  return (
    <Section tone="ink" className="py-28 sm:py-40">
      <div className="reveal">
        <Eyebrow>Start today</Eyebrow>
        <h2 className="mt-8 max-w-5xl text-[clamp(2.75rem,9vw,7rem)] leading-[0.9] font-black tracking-[-0.055em]">
          Stop renting your{" "}
          <span className="inline-block rotate-1 rounded-[0.12em] bg-brand px-[0.1em] pb-[0.04em] text-brand-foreground">
            education.
          </span>
        </h2>
        <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-xl text-lg/relaxed font-medium opacity-80 sm:text-xl/relaxed">
            Create a free account to save courses, then buy only what you&apos;ll actually use.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-13 rounded-full bg-brand px-7 text-base font-bold text-brand-foreground hover:bg-brand/85"
              nativeButton={false}
              render={<Link href="/#courses" />}
            >
              Explore courses
              <ArrowRightIcon data-icon="inline-end" className="transition-transform group-hover/button:translate-x-0.5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 rounded-full border-2 border-ink-foreground bg-transparent px-7 text-base font-bold text-ink-foreground hover:bg-ink-foreground hover:text-ink dark:border-ink-foreground dark:bg-transparent dark:hover:bg-ink-foreground"
              nativeButton={false}
              render={<Link href="/sign-up" />}
            >
              Create free account
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
