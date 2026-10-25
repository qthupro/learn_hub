"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { CircleCheckIcon, HistoryIcon, PlayIcon, RotateCcwIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { lessonHref } from "@/components/learn/learning-course";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";

type WatchedLesson = FunctionReturnType<typeof api.progress.recentlyWatched>[number];

// One grid for rows and skeletons, so columns line up; stacks on phones.
const rowClass = "grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_9rem_11rem_auto] sm:items-center sm:gap-6";

function HistoryRow({ item }: { item: WatchedLesson }) {
  return (
    <li className={rowClass}>
      <div className="min-w-0">
        <p className="truncate font-medium">{item.lessonTitle}</p>
        <p className="truncate text-sm text-muted-foreground">{item.courseTitle}</p>
      </div>
      <div className="flex items-center gap-2">
        {item.completed ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <CircleCheckIcon aria-hidden className="size-4" />
            Completed
          </span>
        ) : (
          <>
            <Progress value={item.percent} aria-label={`${item.lessonTitle} watched`} className="flex-1" />
            <span className="w-9 text-right text-sm text-muted-foreground tabular-nums">{item.percent}%</span>
          </>
        )}
      </div>
      <time dateTime={new Date(item.watchedAt).toISOString()} className="text-sm text-muted-foreground">
        {formatDateTime(item.watchedAt)}
      </time>
      <Button
        variant="outline"
        size="sm"
        className="justify-self-start sm:justify-self-end"
        nativeButton={false}
        render={<Link href={lessonHref(item.courseSlug, item.lessonId)} />}
      >
        {item.completed ? <RotateCcwIcon data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
        {item.completed ? "Rewatch" : "Resume"}
      </Button>
    </li>
  );
}

/** The viewer's recently watched lessons, newest first. Convex returns only their own. */
export function LearningHistory() {
  const history = useQuery(api.progress.recentlyWatched);

  if (history === undefined) {
    return (
      <ul aria-hidden className="divide-y rounded-xl ring-1 ring-foreground/10">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className={rowClass}>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-20" />
          </li>
        ))}
      </ul>
    );
  }
  if (history.length === 0) {
    return (
      <EmptyState
        icon={HistoryIcon}
        action={
          <Button nativeButton={false} render={<Link href="/dashboard" />}>
            Go to my courses
          </Button>
        }
      >
        Lessons you watch will show up here.
      </EmptyState>
    );
  }
  return (
    <ul className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
      {history.map((item) => (
        <HistoryRow key={item._id} item={item} />
      ))}
    </ul>
  );
}
