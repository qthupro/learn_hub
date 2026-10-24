import Link from "next/link";
import type { FunctionReturnType } from "convex/server";
import { ArrowRightIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { levelLabels } from "@/components/admin/course-options";
import { CourseThumbnail } from "@/components/courses/course-thumbnail";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PublishedCourse = FunctionReturnType<typeof api.courses.listPublished>[number];

type CourseCardProps = {
  course: PublishedCourse;
  /** Position in the list, shown as a catalog number. */
  index: number;
  className?: string;
};

export function CourseCard({ course, index, className }: CourseCardProps) {
  const free = course.priceCents === 0;

  return (
    <article
      className={cn(
        "group/course relative flex flex-col transition-transform duration-500 ease-out motion-safe:hover:-translate-y-1.5",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <CourseThumbnail
          title={course.title}
          category={course.category}
          thumbnailUrl={course.thumbnailUrl ?? undefined}
        />
        <span className="absolute top-3 left-3 rounded-full bg-background px-2.5 py-1 font-mono text-xs font-bold tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="mt-5 flex flex-1 flex-col gap-3">
        <p className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase">
          {levelLabels[course.level]}
          <span aria-hidden className="size-1.5 rounded-full bg-brand" />
          {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"}
        </p>
        <h3 className="text-2xl leading-tight font-extrabold tracking-heading">
          {/* Stretched link makes the whole card clickable while keeping one focus target. */}
          <Link
            href={`/courses/${course.slug}`}
            className="decoration-brand decoration-3 underline-offset-4 outline-none group-hover/course:underline after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/60"
          >
            {course.title}
          </Link>
        </h3>
        <div className="mt-auto flex items-center justify-between gap-4 border-t-2 border-foreground pt-4">
          <p className="text-2xl font-black tracking-heading tabular-nums">
            {formatPrice(course.priceCents)}
            <span className="ml-2 text-sm font-semibold tracking-normal opacity-70">
              {free ? "no card needed" : "one-time"}
            </span>
          </p>
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-foreground transition-colors duration-300 group-hover/course:border-brand group-hover/course:bg-brand group-hover/course:text-brand-foreground"
          >
            <ArrowRightIcon className="size-5 transition-transform duration-300 motion-safe:group-hover/course:-rotate-45" />
          </span>
        </div>
      </div>
    </article>
  );
}

export function CourseCardSkeleton() {
  const block = "bg-foreground/10";
  return (
    <div aria-hidden className="flex flex-col">
      <Skeleton className={cn("aspect-video rounded-2xl", block)} />
      <Skeleton className={cn("mt-5 h-3 w-1/3 rounded-full", block)} />
      <Skeleton className={cn("mt-4 h-6 w-4/5 rounded-full", block)} />
      <Skeleton className={cn("mt-2 h-6 w-1/2 rounded-full", block)} />
      <div className="mt-6 flex items-center justify-between border-t-2 border-foreground/10 pt-4">
        <Skeleton className={cn("h-7 w-24 rounded-full", block)} />
        <Skeleton className={cn("size-11 rounded-full", block)} />
      </div>
    </div>
  );
}
