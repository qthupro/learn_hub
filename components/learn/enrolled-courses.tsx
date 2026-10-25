"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowRightIcon, BookOpenIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { CourseThumbnail } from "@/components/courses/course-thumbnail";
import { CompletedBadge } from "@/components/learn/completed-badge";
import { progressSummary } from "@/components/learn/learning-course";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

type EnrolledCourse = FunctionReturnType<typeof api.enrollments.listMine>[number];

const gridClass = "grid gap-5 sm:grid-cols-2 xl:grid-cols-3";

function EnrolledCourseCard({ course }: { course: EnrolledCourse }) {
  const { completed, total, percent, done } = progressSummary(course.completedLessonCount, course.lessonCount);
  const action = done ? "Review course" : completed === 0 ? "Start learning" : "Continue learning";

  return (
    <article className="group/course flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
      <div className="relative">
        <CourseThumbnail
          title={course.title}
          category={course.category}
          thumbnailUrl={course.thumbnailUrl ?? undefined}
          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        {done ? <CompletedBadge className="absolute top-3 left-3 shadow-sm" /> : null}
      </div>
      <div className="flex flex-1 flex-col gap-5 p-5">
        <h4 className="line-clamp-2 text-lg leading-snug font-semibold tracking-heading">{course.title}</h4>
        <Progress value={percent} aria-label={`${course.title} progress`} className="mt-auto gap-2">
          <ProgressLabel className="text-muted-foreground">
            {completed} of {total} {total === 1 ? "lesson" : "lessons"}
          </ProgressLabel>
          <ProgressValue className="font-medium text-foreground" />
        </Progress>
        <Button
          className="group/continue w-full"
          nativeButton={false}
          render={<Link href={`/learn/${course.slug}`} />}
        >
          {action}
          <ArrowRightIcon
            data-icon="inline-end"
            className="transition-transform motion-safe:group-hover/continue:translate-x-0.5"
          />
        </Button>
      </div>
    </article>
  );
}

function EnrolledCourseCardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col overflow-hidden rounded-xl ring-1 ring-foreground/10">
      <Skeleton className="aspect-video rounded-none" />
      <div className="flex flex-col gap-5 p-5">
        <Skeleton className="h-5 w-4/5" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-1 w-full" />
        </div>
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

/** The dashboard's "My courses" section: every course the viewer is enrolled in, with progress. */
export function EnrolledCourses() {
  const courses = useQuery(api.enrollments.listMine);

  return (
    <section aria-labelledby="my-courses" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="my-courses" className="text-lg font-semibold tracking-heading">
          My courses
          {courses?.length ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">{courses.length}</span>
          ) : null}
        </h3>
        {courses?.length ? (
          <Link
            href="/#courses"
            className="text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Browse more
          </Link>
        ) : null}
      </div>

      {courses === undefined ? (
        <div className={gridClass}>
          {Array.from({ length: 3 }, (_, i) => (
            <EnrolledCourseCardSkeleton key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          action={
            <Button nativeButton={false} render={<Link href="/#courses" />}>
              Browse courses
            </Button>
          }
        >
          You haven&apos;t enrolled in any courses yet.
        </EmptyState>
      ) : (
        <div className={gridClass}>
          {courses.map((course) => (
            <EnrolledCourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </section>
  );
}
