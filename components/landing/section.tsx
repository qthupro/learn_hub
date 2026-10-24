import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  default: "bg-background text-foreground",
  // Base styles color headings with --foreground, so inverted bands let them inherit instead.
  ink: "bg-ink text-ink-foreground [&_:is(h2,h3,h4)]:text-current",
  brand: "bg-brand text-brand-foreground [&_:is(h2,h3,h4)]:text-current",
} as const;

export type SectionTone = keyof typeof tones;

type SectionProps = {
  id?: string;
  tone?: SectionTone;
  className?: string;
  children: ReactNode;
};

export function Section({ id, tone = "default", className, children }: SectionProps) {
  return (
    <section id={id} data-tone={tone} className={cn("py-24 sm:py-32", tones[tone], className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeading({ eyebrow, title, description, className }: SectionHeadingProps) {
  return (
    <div className={cn("reveal max-w-3xl space-y-5", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-4xl leading-[0.95] font-black tracking-[-0.045em] sm:text-6xl">{title}</h2>
      {description && <p className="max-w-2xl text-lg/relaxed opacity-80 sm:text-xl/relaxed">{description}</p>}
    </div>
  );
}

/** Small mono label above headings; the accent dot turns ink on the accent band. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-2.5 font-mono text-xs font-bold tracking-[0.2em] uppercase", className)}>
      <span aria-hidden className="size-2 rounded-full bg-brand in-data-[tone=brand]:bg-current" />
      {children}
    </p>
  );
}
