"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, CircleCheckIcon } from "lucide-react";
import { CourseUnavailable, LearnMessage, LessonSkeleton } from "@/components/learn/learn-states";
import { courseLessons, lessonHref, type LearningLesson } from "@/components/learn/learning-course";
import { LessonPlayer } from "@/components/learn/lesson-player";
import { Button } from "@/components/ui/button";
import { useLearningCourse } from "@/hooks/use-learning-course";
import { cn } from "@/lib/utils";

/** Completion now comes from watching; this just says where the lesson stands. */
function LessonStatus({ lesson }: { lesson: LearningLesson }) {
  if (lesson.completed) {
    return (
      <p className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary">
        <CircleCheckIcon aria-hidden className="size-4" />
        Completed
      </p>
    );
  }
  return lesson.hasVideo ? (
    <p className="shrink-0 text-sm text-muted-foreground">Watch 90% of the video to complete it</p>
  ) : null;
}

/** One side of the previous/next row: the direction plus the lesson it leads to. */
function StepLink({
  direction,
  href,
  title,
}: {
  direction: "previous" | "next";
  href: string;
  title: string;
}) {
  const next = direction === "next";
  return (
    <Button
      variant="outline"
      className={cn("h-auto min-w-0 max-w-[48%] gap-3 py-2.5", next ? "ml-auto text-right" : "text-left")}
      nativeButton={false}
      render={<Link href={href} />}
    >
      {next ? null : <ChevronLeftIcon data-icon="inline-start" />}
      <span className="flex min-w-0 flex-col">
        <span className="text-xs font-normal text-muted-foreground">{next ? "Next" : "Previous"}</span>
        <span className="truncate">{title}</span>
      </span>
      {next ? <ChevronRightIcon data-icon="inline-end" /> : null}
    </Button>
  );
}

export function LessonView({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = use(params);
  const course = useLearningCourse(slug);

  if (course === undefined) {
    return <LessonSkeleton />;
  }
  if (course === null) {
    return <CourseUnavailable />;
  }

  const lessons = courseLessons(course);
  const index = lessons.findIndex((lesson) => lesson._id === lessonId);
  if (index === -1) {
    return (
      <LearnMessage
        title="Lesson not found"
        action={
          <Button nativeButton={false} render={<Link href={`/learn/${course.slug}`} />}>
            Go to your next lesson
          </Button>
        }
      >
        This lesson may have been moved or removed from the course.
      </LearnMessage>
    );
  }

  const lesson = lessons[index];
  const chapterIndex = course.chapters.findIndex((chapter) => chapter.lessons.some((l) => l._id === lesson._id));
  const previous = lessons[index - 1];
  const next = lessons[index + 1];

  return (
    <div className="flex w-full flex-col">
      <LessonPlayer lesson={lesson} />

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground tabular-nums">
              {course.chapters[chapterIndex].title} · Lesson {index + 1} of {lessons.length}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-heading text-balance">{lesson.title}</h1>
          </div>
          <LessonStatus lesson={lesson} />
        </div>

        {lesson.description ? (
          <p className="max-w-3xl text-sm/relaxed whitespace-pre-line text-muted-foreground">{lesson.description}</p>
        ) : null}

        <nav aria-label="Lesson navigation" className="flex items-stretch gap-3 border-t pt-6">
          {previous ? (
            <StepLink direction="previous" href={lessonHref(course.slug, previous._id)} title={previous.title} />
          ) : null}
          {next ? (
            <StepLink direction="next" href={lessonHref(course.slug, next._id)} title={next.title} />
          ) : (
            <StepLink direction="next" href="/dashboard" title="Back to dashboard" />
          )}
        </nav>
      </div>
    </div>
  );
}
