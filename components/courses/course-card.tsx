import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, ClockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CourseRating } from "@/components/courses/course-rating";
import { CourseThumbnail } from "@/components/courses/course-thumbnail";
import { LifetimeAccessNote } from "@/components/courses/lifetime-access-note";
import { type CourseSummary, getCategory, lessonCount } from "@/components/courses/course-data";
import { formatDuration, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type CourseCardProps = {
  course: CourseSummary;
  /** Shows the description; used when there is room for fewer, larger cards. */
  detailed?: boolean;
  sizes?: string;
  className?: string;
};

export function CourseCard({ course, detailed, sizes, className }: CourseCardProps) {
  return (
    <Card
      className={cn(
        "relative gap-0 py-0 shadow-xs transition-all duration-300 hover:shadow-lg hover:shadow-foreground/5 hover:ring-foreground/20 motion-safe:hover:-translate-y-0.5",
        className,
      )}
    >
      <CourseThumbnail
        title={course.title}
        category={course.category}
        thumbnailUrl={course.thumbnailUrl}
        sizes={sizes}
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{getCategory(course.category).name}</Badge>
          <span className="text-xs text-muted-foreground">{course.level}</span>
        </div>
        <div className="space-y-1">
          <h3 className={detailed ? "text-xl" : "text-base"}>
            {/* Stretched link makes the whole card clickable while keeping one focus target. */}
            <Link
              href={`/courses/${course.slug}`}
              className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
            >
              {course.title}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground">{course.instructor.name}</p>
        </div>
        {detailed && (
          <p className="line-clamp-3 text-sm/relaxed text-muted-foreground">
            {course.description}
          </p>
        )}
        <CourseRating rating={course.rating} reviewCount={course.reviewCount} />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpenIcon aria-hidden className="size-3.5" />
            {lessonCount(course)} lessons
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon aria-hidden className="size-3.5" />
            {formatDuration(course.durationMinutes)}
          </span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 border-t pt-4">
          <div className="space-y-1">
            <p className="text-xl font-bold tracking-heading tabular-nums">
              {formatPrice(course.priceCents)}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">one-time</span>
            </p>
            <LifetimeAccessNote />
          </div>
          <ArrowRightIcon
            aria-hidden
            className="mb-1 size-4 text-muted-foreground transition-transform duration-300 group-hover/card:translate-x-0.5 group-hover/card:text-foreground"
          />
        </div>
      </div>
    </Card>
  );
}
