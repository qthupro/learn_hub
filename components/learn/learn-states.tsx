import type { ReactNode } from "react";
import Link from "next/link";
import { LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** A centered message in the lesson area with a way out. */
export function LearnMessage({ title, children, action }: { title: string; children: ReactNode; action: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <LockIcon className="size-5 text-muted-foreground" />
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{children}</p>
      <div className="mt-2">{action}</div>
    </div>
  );
}

/** Missing, draft, and not-enrolled courses all look the same, so drafts stay hidden. */
export function CourseUnavailable() {
  return (
    <LearnMessage
      title="This course isn't available"
      action={
        <Button nativeButton={false} render={<Link href="/dashboard" />}>
          Back to dashboard
        </Button>
      }
    >
      It may have been removed, or you aren&apos;t enrolled in it yet.
    </LearnMessage>
  );
}

export function LessonSkeleton() {
  return (
    <div aria-hidden className="flex w-full flex-col">
      {/* Matches the player's full-width black band. */}
      <div className="w-full bg-black">
        <Skeleton className="mx-auto aspect-video w-full max-w-[calc((100svh-var(--header-height))*16/9)] rounded-none bg-white/10" />
      </div>
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-2/3" />
        </div>
        <div className="flex justify-between border-t pt-6">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-12 w-40" />
        </div>
      </div>
    </div>
  );
}
