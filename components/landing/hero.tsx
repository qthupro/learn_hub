import Link from "next/link";
import { ArrowRightIcon, CheckIcon, CirclePlayIcon, InfinityIcon, StarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CourseThumbnail } from "@/components/courses/course-thumbnail";
import type { CourseSummary } from "@/components/courses/course-data";

const highlights = ["No subscriptions", "Lifetime access", "Learn at your pace"];

export function Hero({ spotlight }: { spotlight?: CourseSummary }) {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Soft ambient glow + fading grid; purely decorative. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-12rem] left-1/2 h-[36rem] w-[64rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--brand)_18%,transparent),transparent)] dark:bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--brand)_22%,transparent),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[56px_56px] opacity-60 mask-[radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:px-8 lg:pb-28">
        <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
          <Badge
            variant="outline"
            className="h-7 gap-1.5 rounded-full bg-background/60 px-3 text-xs backdrop-blur-sm"
          >
            <InfinityIcon className="text-brand" />
            One-time payment · Lifetime access
          </Badge>
          <div className="space-y-5">
            <h1 className="text-4xl leading-[1.05] tracking-display sm:text-5xl lg:text-6xl">
              Buy a course once.{" "}
              <span className="font-semibold text-muted-foreground">Keep learning forever.</span>
            </h1>
            <p className="max-w-xl text-lg/relaxed text-muted-foreground">
              Expert-led video courses in development, design, data and more. Pay a single price,
              own it for life, and come back whenever you need a refresher.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-11 px-5 text-base"
              nativeButton={false}
              render={<Link href="/#courses" />}
            >
              Browse courses
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-5 text-base"
              nativeButton={false}
              render={<Link href="/#benefits" />}
            >
              How it works
            </Button>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckIcon aria-hidden className="size-4 text-brand" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {spotlight && <HeroPreview course={spotlight} />}
      </div>
    </section>
  );
}

function HeroPreview({ course }: { course: CourseSummary }) {
  const chapter = course.curriculum[0];

  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:delay-150 motion-safe:duration-700 motion-safe:fill-mode-backwards lg:max-w-none"
    >
      <Card className="gap-0 p-0 shadow-2xl shadow-foreground/10">
        <div className="relative">
          <CourseThumbnail title={course.title} category={course.category} priority />
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid size-14 place-items-center rounded-full bg-background/90 shadow-lg ring-1 ring-foreground/10 backdrop-blur">
              <CirclePlayIcon className="size-7" strokeWidth={1.5} />
            </span>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Continue learning</p>
            <p className="font-semibold tracking-title">{course.title}</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="tabular-nums">64%</span>
            </div>
            <Progress value={64} />
          </div>
          <ul className="space-y-2 border-t pt-4 text-sm">
            {chapter?.lessons.map((lesson, index) => (
              <li key={lesson} className="flex items-center gap-2.5">
                <span
                  className={
                    index < 2
                      ? "grid size-5 place-items-center rounded-full bg-brand text-brand-foreground"
                      : "grid size-5 place-items-center rounded-full border text-muted-foreground"
                  }
                >
                  {index < 2 ? <CheckIcon className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}
                </span>
                <span className={index < 2 ? "text-muted-foreground line-through decoration-muted-foreground/40" : ""}>
                  {lesson}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <div className="absolute -top-4 -right-2 hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-lg sm:flex lg:-right-6">
        <span className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand">
          <InfinityIcon className="size-4" />
        </span>
        <div className="text-xs leading-tight">
          <p className="font-medium">Lifetime access</p>
          <p className="text-muted-foreground">Purchased once</p>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-2 hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-lg sm:flex lg:-left-8">
        <StarIcon className="size-4 fill-amber-400 text-amber-400" />
        <p className="text-xs">
          <span className="font-semibold">{course.rating.toFixed(1)}</span>{" "}
          <span className="text-muted-foreground">from {course.reviewCount.toLocaleString("en-US")} reviews</span>
        </p>
      </div>
    </div>
  );
}
