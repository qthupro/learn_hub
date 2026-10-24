"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowRightIcon, ClapperboardIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { CourseCard, CourseCardSkeleton } from "@/components/courses/course-card";
import { Section, SectionHeading } from "@/components/landing/section";

const gridClass = "grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3";

export function FeaturedCourses() {
  const courses = useQuery(api.courses.listPublished);

  return (
    <Section id="courses">
      <SectionHeading
        eyebrow="The catalog"
        title="Pick a course. Keep it for good."
        description="Every course is a single purchase with lifetime access, or free with an account."
        className="mb-16 sm:mb-20"
      />
      {courses === undefined ? (
        <div role="status" aria-label="Loading courses" className={gridClass}>
          {Array.from({ length: 3 }, (_, index) => (
            <CourseCardSkeleton key={index} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyCatalog />
      ) : (
        <ul className={gridClass}>
          {courses.map((course, index) => (
            <li key={course._id} className="reveal flex *:w-full">
              <CourseCard course={course} index={index} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function EmptyCatalog() {
  return (
    <div className="reveal flex flex-col items-start gap-8 rounded-3xl bg-ink p-8 text-ink-foreground sm:flex-row sm:items-center sm:p-12">
      <span className="grid size-20 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground">
        <ClapperboardIcon aria-hidden className="size-9" strokeWidth={1.75} />
      </span>
      <div className="flex-1 space-y-2">
        <h3 className="text-3xl font-black tracking-[-0.04em] text-current sm:text-4xl">
          Cameras are rolling.
        </h3>
        <p className="max-w-lg text-lg/relaxed opacity-80">
          Our first courses are being recorded right now. Create a free account so you&apos;re ready
          the day they go live.
        </p>
      </div>
      <Button
        size="lg"
        className="h-12 rounded-full bg-brand px-6 text-base font-bold text-brand-foreground hover:bg-brand/85"
        nativeButton={false}
        render={<Link href="/sign-up" />}
      >
        Create free account
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
    </div>
  );
}
