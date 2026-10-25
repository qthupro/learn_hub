"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { CompletedBadge } from "@/components/learn/completed-badge";
import { Logo } from "@/components/logo";
import { courseProgress, type LearningCourse } from "@/components/learn/learning-course";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

function CourseProgress({ course }: { course: LearningCourse }) {
  const { completed, total, percent, done } = courseProgress(course);
  return (
    <>
      {done ? <CompletedBadge /> : null}
      <Progress value={percent} aria-label="Course progress" className="hidden w-48 gap-1.5 md:flex">
        <ProgressLabel className="text-xs font-normal text-muted-foreground">
          {completed} of {total} lessons
        </ProgressLabel>
        <ProgressValue className="text-xs font-medium text-foreground" />
      </Progress>
      {/* Phones have no room for the bar; the numbers alone keep the progress visible. Hidden once
          the badge says it all. */}
      {done ? null : (
        <span className="text-xs font-medium text-muted-foreground tabular-nums md:hidden">
          {completed}/{total} · {percent}%
        </span>
      )}
    </>
  );
}

export function LearnNavbar({ course }: { course: LearningCourse | null | undefined }) {
  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background px-3 sm:gap-3 sm:px-4">
      {/* The name only on wide screens, so phones keep room for the course title. */}
      <Logo className="shrink-0" labelClassName="hidden lg:inline" />
      <Separator orientation="vertical" className="data-vertical:h-5 data-vertical:self-center" />
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0"
        nativeButton={false}
        render={<Link href="/dashboard" aria-label="Back to dashboard" />}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        <span className="hidden sm:inline">Dashboard</span>
      </Button>
      <Separator orientation="vertical" className="data-vertical:h-5 data-vertical:self-center" />
      {/* A div, not a p: the loading skeleton is a div. */}
      <div className="min-w-0 flex-1 truncate text-sm font-semibold">
        {course === undefined ? <Skeleton className="h-4 w-48 max-w-full" /> : course?.title}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {course ? <CourseProgress course={course} /> : null}
        <ThemeToggle />
        {course !== null ? <SidebarTrigger aria-label="Toggle course content" /> : null}
      </div>
    </header>
  );
}
