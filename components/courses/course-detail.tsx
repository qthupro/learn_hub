"use client";

import Link from "next/link";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { levelLabels } from "@/components/admin/course-options";
import { CourseCurriculum, totalDuration } from "@/components/courses/course-curriculum";
import { getCategory } from "@/components/courses/course-data";
import { CourseThumbnail } from "@/components/courses/course-thumbnail";
import { Eyebrow, Section, SectionHeading } from "@/components/landing/section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";

const perks = ["Lifetime access, no subscription", "Every future update included", "Watch on any device"];

const backLinkClass =
  "inline-flex items-center gap-2 rounded-md font-mono text-xs font-bold tracking-[0.2em] uppercase underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/60";

export function CourseDetail({ preloaded }: { preloaded: Preloaded<typeof api.courses.getPublishedBySlug> }) {
  const course = usePreloadedQuery(preloaded);

  // The course was unpublished or deleted while the page was open.
  if (course === null) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black tracking-[-0.045em] sm:text-6xl">This course is no longer available.</h1>
        <Link href="/#courses" className={`mt-8 ${backLinkClass}`}>
          <ArrowLeftIcon aria-hidden className="size-4" />
          All courses
        </Link>
      </div>
    );
  }

  const free = course.priceCents === 0;
  const duration = totalDuration(course.durationSeconds);
  const facts = [
    { label: "Level", value: levelLabels[course.level] },
    { label: course.lessonCount === 1 ? "Lesson" : "Lessons", value: String(course.lessonCount) },
    { label: "Of video", value: duration ?? "—" },
  ];

  function enroll() {
    // Placeholder until enrollment and Stripe checkout are built.
    toast("Enrollment opens soon", {
      description: free ? "Free enrollment is on its way." : "Checkout is on its way.",
    });
  }

  return (
    <>
      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-24 lg:px-8">
          <Link href="/#courses" className={backLinkClass}>
            <ArrowLeftIcon aria-hidden className="size-4" />
            All courses
          </Link>

          <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-700">
              <Eyebrow>{getCategory(course.category).name}</Eyebrow>
              <h1 className="mt-6 text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.92] font-black tracking-[-0.05em] text-current">
                {course.title}
              </h1>
              {course.description ? (
                <p className="mt-8 max-w-2xl text-lg/relaxed font-medium whitespace-pre-line opacity-80 sm:text-xl/relaxed">
                  {course.description}
                </p>
              ) : null}
              <dl className="mt-12 grid grid-cols-3 border-t-2 border-ink-foreground">
                {facts.map((fact) => (
                  // Label first for screen readers; the value is shown on top.
                  <div
                    key={fact.label}
                    className="flex flex-col-reverse justify-end gap-2 border-ink-foreground pt-5 pr-3 not-first:border-l-2 not-first:pl-4 sm:not-first:pl-6"
                  >
                    <dt className="text-sm font-semibold opacity-80">{fact.label}</dt>
                    <dd className="text-2xl leading-none font-black tracking-[-0.04em] sm:text-4xl">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <aside className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-8 motion-safe:delay-150 motion-safe:duration-700 motion-safe:fill-mode-backwards lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-3xl bg-background text-foreground">
                <CourseThumbnail
                  title={course.title}
                  category={course.category}
                  thumbnailUrl={course.thumbnailUrl ?? undefined}
                  sizes="(min-width: 1024px) 24rem, 100vw"
                  priority
                />
                <div className="space-y-6 p-6">
                  <div className="space-y-1">
                    <p className="font-mono text-xs font-bold tracking-[0.2em] uppercase">
                      {free ? "Free course" : "One-time payment"}
                    </p>
                    <p className="text-5xl font-black tracking-[-0.045em] tabular-nums">
                      {formatPrice(course.priceCents)}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="group/enroll h-14 w-full rounded-full bg-brand text-lg font-black text-brand-foreground hover:bg-brand/85"
                    onClick={enroll}
                  >
                    {free ? "Enroll for free" : "Enroll now"}
                    <ArrowRightIcon
                      data-icon="inline-end"
                      className="size-5 transition-transform motion-safe:group-hover/enroll:translate-x-1"
                    />
                  </Button>
                  <ul className="space-y-2.5 border-t-2 border-foreground pt-5 text-sm font-semibold">
                    {perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2.5">
                        <CheckIcon aria-hidden className="size-4 shrink-0" strokeWidth={3} />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Section id="curriculum">
        <SectionHeading
          eyebrow="Curriculum"
          title="What you'll learn."
          description={`${course.chapters.length} ${course.chapters.length === 1 ? "chapter" : "chapters"} · ${course.lessonCount} ${course.lessonCount === 1 ? "lesson" : "lessons"}${duration ? ` · ${duration} of video` : ""}. Lessons marked with a play button are free to preview.`}
          className="mb-12 sm:mb-16"
        />
        <CourseCurriculum chapters={course.chapters} />
      </Section>
    </>
  );
}

export function CourseDetailSkeleton() {
  const block = "bg-ink-foreground/15";
  return (
    <div role="status" aria-label="Loading course" className="bg-ink">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-24 pb-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16 lg:px-8">
        <div className="space-y-5">
          <Skeleton className={`h-3 w-32 rounded-full ${block}`} />
          <Skeleton className={`h-16 w-full rounded-2xl ${block}`} />
          <Skeleton className={`h-16 w-2/3 rounded-2xl ${block}`} />
          <Skeleton className={`mt-8 h-5 w-full max-w-xl rounded-full ${block}`} />
          <Skeleton className={`h-5 w-4/5 max-w-lg rounded-full ${block}`} />
        </div>
        <Skeleton className={`h-112 rounded-3xl ${block}`} />
      </div>
    </div>
  );
}
