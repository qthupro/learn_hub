import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { categories } from "@/components/courses/course-data";
import { Section, SectionHeading } from "@/components/landing/section";

export function Categories() {
  return (
    <Section id="categories">
      <SectionHeading
        eyebrow="Categories"
        title="Learn the skills that move your career."
        className="mb-16 sm:mb-20"
      />
      <ul className="border-b-2 border-foreground">
        {categories.map(({ id, name, description }, index) => (
          <li key={id} className="reveal border-t-2 border-foreground">
            <Link
              href="/#courses"
              className="group relative isolate flex items-center gap-4 px-1 py-6 transition-colors duration-300 outline-none hover:text-brand-foreground focus-visible:bg-brand focus-visible:text-brand-foreground sm:gap-8 sm:px-4 sm:py-8"
            >
              {/* Accent fill that sweeps in from the left on hover. */}
              <span
                aria-hidden
                className="absolute inset-0 -z-10 origin-left scale-x-0 bg-brand transition-transform duration-500 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
              />
              <span className="w-8 shrink-0 font-mono text-sm font-bold tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-3xl leading-none font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                  {name}
                </span>
                <span className="mt-2 block text-sm font-medium opacity-80 sm:text-base">{description}</span>
              </span>
              <ArrowUpRightIcon
                aria-hidden
                className="size-8 shrink-0 transition-transform duration-500 ease-out motion-safe:group-hover:rotate-45 sm:size-12"
                strokeWidth={2.25}
              />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
