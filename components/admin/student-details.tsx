"use client";

import { useQuery } from "convex/react";
import { BookOpenIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateTime, formatUsd } from "@/lib/format";
import { initials } from "@/lib/utils";

/** The body of the student sheet: profile, totals and each enrolled course with progress. */
export function StudentDetails({ userId }: { userId: Id<"users"> }) {
  const student = useQuery(api.students.get, { userId });

  if (student === undefined) {
    return (
      <div aria-hidden className="flex flex-col gap-6 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  if (student === null) {
    return (
      <SheetHeader>
        <SheetTitle>Student not found</SheetTitle>
        <SheetDescription>This account no longer exists or isn&apos;t a student.</SheetDescription>
      </SheetHeader>
    );
  }

  return (
    <>
      <SheetHeader className="flex-row items-center gap-3 border-b pr-12">
        <Avatar className="size-12">
          {student.imageUrl ? <AvatarImage src={student.imageUrl} alt="" /> : null}
          <AvatarFallback>{initials(student.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <SheetTitle className="truncate">{student.name}</SheetTitle>
          <SheetDescription className="truncate">{student.email ?? "No email on file"}</SheetDescription>
        </div>
      </SheetHeader>

      <dl className="grid grid-cols-3 gap-3 border-b p-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Joined</dt>
          <dd className="mt-0.5 font-medium">{formatDate(student.joinedAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Courses</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{student.courses.length}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Total spent</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{formatUsd(student.totalSpentCents)}</dd>
        </div>
      </dl>

      <section aria-labelledby="student-courses" className="flex flex-col gap-3 p-4">
        <h3 id="student-courses" className="text-sm font-semibold">
          Enrolled courses
        </h3>
        {student.courses.length === 0 ? (
          <EmptyState icon={BookOpenIcon}>This student hasn&apos;t enrolled in any courses yet.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {student.courses.map((course) => (
              <li key={course._id} className="flex flex-col gap-3 rounded-xl p-4 ring-1 ring-foreground/10">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 font-medium">{course.title}</p>
                  <div className="flex shrink-0 gap-1.5">
                    {course.status === "draft" ? <Badge variant="outline">Draft</Badge> : null}
                    <Badge variant="secondary">{course.source === "stripe" ? "Paid" : "Free"}</Badge>
                  </div>
                </div>
                <Progress value={course.percent} aria-label={`${course.title} progress`} className="gap-2">
                  <ProgressLabel className="text-xs font-normal text-muted-foreground">
                    {course.completedLessonCount} of {course.lessonCount} lessons
                  </ProgressLabel>
                  <ProgressValue className="text-xs font-medium text-foreground" />
                </Progress>
                <p className="text-xs text-muted-foreground">
                  Enrolled {formatDateTime(course.enrolledAt)}
                  {" · "}
                  {course.lastWatchedAt === null ? "Not started" : `Last watched ${formatDateTime(course.lastWatchedAt)}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
