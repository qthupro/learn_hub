import Link from "next/link";
import {
  BookOpenIcon,
  CheckIcon,
  CirclePlayIcon,
  ClockIcon,
  InfinityIcon,
  SignalIcon,
  UsersIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CourseRating } from "@/components/courses/course-rating";
import { CourseThumbnail } from "@/components/courses/course-thumbnail";
import { type CourseSummary, getCategory, lessonCount } from "@/components/courses/course-data";
import { formatCount, formatDuration, formatPrice } from "@/lib/format";
import { initials } from "@/lib/utils";

const included = [
  "Lifetime access, including future updates",
  "Watch on any device, at your own pace",
  "Progress tracking across every lesson",
];

/** Spotlight layout used when the catalog has a single course. */
export function FeaturedCourse({ course }: { course: CourseSummary }) {
  const lessons = lessonCount(course);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
      <div className="space-y-8">
        <Card className="gap-0 p-0 shadow-xs">
          <CourseThumbnail
            title={course.title}
            category={course.category}
            thumbnailUrl={course.thumbnailUrl}
            sizes="(min-width: 1024px) 66vw, 100vw"
            priority
          />
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{getCategory(course.category).name}</Badge>
            <Badge variant="outline">{course.level}</Badge>
          </div>
          <h3 className="text-3xl font-bold tracking-heading sm:text-4xl">
            {course.title}
          </h3>
          <p className="max-w-2xl text-lg/relaxed text-muted-foreground">
            {course.description}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{initials(course.instructor.name)}</AvatarFallback>
              </Avatar>
              <div className="text-sm leading-tight">
                <p className="font-semibold">{course.instructor.name}</p>
                <p className="text-muted-foreground">{course.instructor.title}</p>
              </div>
            </div>
            <CourseRating rating={course.rating} reviewCount={course.reviewCount} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h4 className="text-lg">Curriculum preview</h4>
            <p className="text-sm text-muted-foreground">
              {course.curriculum.length} chapters · {lessons} lessons
            </p>
          </div>
          <ol className="divide-y overflow-hidden rounded-xl border bg-card">
            {course.curriculum.map((chapter, index) => (
              <li key={chapter.title} className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">
                    <span className="mr-2 text-muted-foreground tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {chapter.title}
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {chapter.lessons.length} lessons
                  </span>
                </div>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {chapter.lessons.map((lesson) => (
                    <li key={lesson} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CirclePlayIcon aria-hidden className="size-4 shrink-0" />
                      {lesson}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="gap-6 p-6 shadow-lg shadow-foreground/5">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">One-time payment</p>
            <p className="text-4xl font-bold tracking-heading tabular-nums">
              {formatPrice(course.priceCents)}
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-brand/10 p-3 text-sm">
            <InfinityIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
            <p>
              <span className="font-semibold">Buy Once, Learn Forever.</span>{" "}
              <span className="text-muted-foreground">No subscription, no renewal.</span>
            </p>
          </div>
          <Button
            size="lg"
            className="h-11 w-full text-base"
            nativeButton={false}
            render={<Link href={`/courses/${course.slug}`} />}
          >
            Buy course
          </Button>
          <ul className="space-y-2.5 text-sm">
            {included.map((item) => (
              <li key={item} className="flex gap-2">
                <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
                {item}
              </li>
            ))}
          </ul>
          <dl className="grid grid-cols-2 gap-4 border-t pt-5 text-sm">
            {[
              { icon: BookOpenIcon, label: "Lessons", value: lessons },
              { icon: ClockIcon, label: "Duration", value: formatDuration(course.durationMinutes) },
              { icon: SignalIcon, label: "Level", value: course.level },
              { icon: UsersIcon, label: "Students", value: formatCount(course.studentCount) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon aria-hidden className="size-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Card>
      </aside>
    </div>
  );
}
