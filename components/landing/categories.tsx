import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { type CourseSummary, categories } from "@/components/courses/course-data";
import { Section, SectionHeading } from "@/components/landing/section";

export function Categories({ courses }: { courses: CourseSummary[] }) {
  return (
    <Section id="categories" className="bg-muted/30">
      <SectionHeading
        eyebrow="Categories"
        title="Learn the skills that move your career"
        description="Focused courses across the disciplines modern teams rely on."
        className="mb-12 sm:mb-16"
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(({ id, name, description, icon: Icon }) => {
          const count = courses.filter((course) => course.category === id).length;
          return (
            <li key={id}>
              <Link
                href="/#courses"
                className="group flex h-full items-start gap-4 rounded-xl border bg-card p-5 shadow-xs transition-all duration-300 outline-none hover:border-foreground/20 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="flex-1 space-y-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold tracking-title">{name}</span>
                    <ArrowUpRightIcon
                      aria-hidden
                      className="size-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                    />
                  </span>
                  <span className="block text-sm text-muted-foreground">{description}</span>
                  <span className="block pt-1 text-xs font-medium text-muted-foreground">
                    {count === 0 ? "Coming soon" : `${count} ${count === 1 ? "course" : "courses"}`}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
