"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { LockIcon, PlayIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatClock, formatDuration } from "@/lib/format";

type Chapters = NonNullable<FunctionReturnType<typeof api.courses.getPublishedBySlug>>["chapters"];
type PreviewLesson = { id: Id<"lessons">; title: string };

function plural(count: number, word: string) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

/** Total of the known lesson lengths as "1h 20m", or null when no video is ready yet. */
export function totalDuration(seconds: number) {
  return seconds > 0 ? formatDuration(Math.max(1, Math.round(seconds / 60))) : null;
}

/** Chapters as collapsible sections. Free preview lessons open a player; the rest are locked. */
export function CourseCurriculum({ chapters }: { chapters: Chapters }) {
  // Kept after closing so the title doesn't vanish during the exit animation.
  const [preview, setPreview] = useState<PreviewLesson | null>(null);
  const [open, setOpen] = useState(false);

  if (chapters.length === 0) {
    return (
      <p className="reveal border-y-2 border-foreground py-10 text-xl font-bold">
        Lessons are being recorded. Check back soon for the full curriculum.
      </p>
    );
  }

  return (
    <>
      <Accordion multiple defaultValue={[chapters[0]._id]} className="reveal border-y-2 border-foreground">
        {chapters.map((chapter, chapterIndex) => {
          const duration = totalDuration(
            chapter.lessons.reduce((total, lesson) => total + (lesson.durationSeconds ?? 0), 0),
          );
          return (
            <AccordionItem
              key={chapter._id}
              value={chapter._id}
              className="not-last:border-b-2 not-last:border-foreground"
            >
              <AccordionTrigger className="items-center gap-4 rounded-none py-6 hover:no-underline **:data-[slot=accordion-trigger-icon]:size-6 **:data-[slot=accordion-trigger-icon]:text-foreground">
                <span className="w-8 shrink-0 font-mono text-sm font-bold tabular-nums">
                  {String(chapterIndex + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xl font-extrabold tracking-title sm:text-2xl">{chapter.title}</span>
                  <span className="mt-1 block text-sm font-semibold opacity-80">
                    {plural(chapter.lessons.length, "lesson")}
                    {duration ? ` · ${duration}` : null}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                {chapter.lessons.length === 0 ? (
                  <p className="pb-2 pl-12 font-medium opacity-80">No lessons in this chapter yet.</p>
                ) : (
                  <ol className="border-t border-foreground/15">
                    {chapter.lessons.map((lesson) => (
                      <li
                        key={lesson._id}
                        className="flex items-center gap-4 border-b border-foreground/15 py-3.5 last:border-b-0 sm:pl-12"
                      >
                        {lesson.canPreview ? (
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground">
                            <PlayIcon aria-hidden className="size-4 fill-current" />
                          </span>
                        ) : (
                          <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-foreground/25">
                            <LockIcon aria-hidden className="size-4" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 text-base font-semibold">
                          {lesson.title}
                          {lesson.canPreview ? null : <span className="sr-only"> (locked)</span>}
                        </span>
                        {lesson.durationSeconds !== null ? (
                          <span className="shrink-0 font-mono text-sm font-semibold tabular-nums opacity-80">
                            {formatClock(lesson.durationSeconds)}
                          </span>
                        ) : null}
                        {lesson.canPreview ? (
                          <Button
                            size="sm"
                            className="h-8 shrink-0 rounded-full bg-foreground px-3.5 font-bold text-background hover:bg-brand hover:text-brand-foreground"
                            aria-label={`Preview ${lesson.title}`}
                            onClick={() => {
                              setPreview({ id: lesson._id, title: lesson.title });
                              setOpen(true);
                            }}
                          >
                            Preview
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-4xl">
          <DialogHeader className="gap-1 px-5 py-4 pr-12">
            <DialogDescription className="font-mono text-xs font-bold tracking-[0.2em] uppercase">
              Free preview
            </DialogDescription>
            <DialogTitle className="text-lg font-extrabold">{preview?.title}</DialogTitle>
          </DialogHeader>
          {/* Keyed so each lesson fetches its own signed URL. */}
          {preview ? <PreviewPlayer key={preview.id} lesson={preview} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Asks the backend for a short-lived signed Bunny embed URL and plays it. */
function PreviewPlayer({ lesson }: { lesson: PreviewLesson }) {
  const getUrl = useAction(api.videos.freePreviewUrl);
  const [url, setUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    getUrl({ lessonId: lesson.id })
      .then((next) => active && setUrl(next))
      .catch(() => active && setUrl(null));
    return () => {
      active = false;
    };
  }, [getUrl, lesson.id]);

  if (url === undefined) {
    return <Skeleton className="aspect-video w-full rounded-none bg-foreground/10" />;
  }
  if (url === null) {
    return (
      <div className="grid aspect-video w-full place-items-center bg-ink px-6 text-center font-semibold text-ink-foreground">
        This preview isn&apos;t available right now. Please try again later.
      </div>
    );
  }
  return (
    <iframe
      src={url}
      title={`Free preview: ${lesson.title}`}
      className="aspect-video w-full bg-black"
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  );
}
