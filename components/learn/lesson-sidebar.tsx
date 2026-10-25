"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CircleCheckIcon, CircleIcon, CirclePlayIcon } from "lucide-react";
import { courseProgress, lessonHref, type LearningCourse } from "@/components/learn/learning-course";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

// Starts below the navbar instead of at the top of the viewport.
const sidebarClass = "top-(--header-height) h-[calc(100svh-var(--header-height))]!";

/** The id of the chapter holding this lesson, if any. */
function chapterOf(course: LearningCourse, lessonId: string | undefined) {
  return course.chapters.find((chapter) => chapter.lessons.some((lesson) => lesson._id === lessonId))?._id;
}

export function LessonSidebar({ course }: { course: LearningCourse }) {
  const { lessonId } = useParams<{ lessonId?: string }>();
  const { isMobile, setOpenMobile } = useSidebar();
  const activeRef = useRef<HTMLAnchorElement>(null);
  const { completed, total } = courseProgress(course);

  // Chapters are collapsible; the one holding the current lesson is always opened for it. Before a
  // lesson is picked (the resume redirect), the first chapter is open.
  const activeChapterId = chapterOf(course, lessonId);
  const [openChapters, setOpenChapters] = useState<string[]>(() => {
    const first = activeChapterId ?? course.chapters[0]?._id;
    return first ? [first] : [];
  });
  const [openedFor, setOpenedFor] = useState(activeChapterId);
  if (activeChapterId !== openedFor) {
    // Adjusting state during render, so the chapter is open in the same frame the lesson changes.
    setOpenedFor(activeChapterId);
    if (activeChapterId && !openChapters.includes(activeChapterId)) {
      setOpenChapters([...openChapters, activeChapterId]);
    }
  }

  // Keeps the current lesson in view when it changes, e.g. after "Next lesson". If its chapter is
  // still animating open, scroll again once it has, since its position moves as the panel grows.
  useEffect(() => {
    const link = activeRef.current;
    if (link === null) {
      return;
    }
    const scroll = () => link.scrollIntoView({ block: "nearest" });
    scroll();
    const panel = link.closest("[data-slot=accordion-content]");
    panel?.addEventListener("animationend", scroll, { once: true });
    return () => panel?.removeEventListener("animationend", scroll);
  }, [lessonId]);

  return (
    <Sidebar collapsible="offcanvas" className={sidebarClass}>
      <SidebarHeader className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Course content</h2>
        <p className="text-xs text-muted-foreground tabular-nums">
          {completed} of {total} lessons complete
        </p>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <Accordion multiple value={openChapters} onValueChange={setOpenChapters}>
          {course.chapters.map((chapter, chapterIndex) => {
            const chapterCompleted = chapter.lessons.filter((lesson) => lesson.completed).length;
            return (
              <AccordionItem key={chapter._id} value={chapter._id} className="border-sidebar-border">
                <AccordionTrigger className="items-center gap-3 rounded-none px-4 py-3 hover:bg-sidebar-accent hover:no-underline">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug font-semibold">
                      {chapterIndex + 1}. {chapter.title}
                    </span>
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground tabular-nums">
                      {chapterCompleted} / {chapter.lessons.length} complete
                    </span>
                  </span>
                </AccordionTrigger>
                {/* Overrides the accordion's prose styles (underlined links, paragraph spacing). */}
                <AccordionContent className="px-2 pb-2 [&_a]:no-underline">
                  <SidebarMenu>
                    {chapter.lessons.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">No lessons yet.</p>
                    ) : (
                      chapter.lessons.map((lesson) => {
                        const active = lesson._id === lessonId;
                        const Icon = lesson.completed ? CircleCheckIcon : active ? CirclePlayIcon : CircleIcon;
                        return (
                          <SidebarMenuItem key={lesson._id}>
                            <SidebarMenuButton
                              isActive={active}
                              className={cn(
                                "relative h-auto items-start py-2",
                                // A tinted brand background, bold text and a brand bar on the left edge.
                                active &&
                                  "bg-brand/15 pl-3 font-semibold text-foreground before:absolute before:inset-y-1 before:left-0 before:w-1 before:rounded-full before:bg-brand hover:bg-brand/20 data-active:bg-brand/15 data-active:font-semibold data-active:text-foreground",
                              )}
                              render={
                                <Link
                                  ref={active ? activeRef : undefined}
                                  href={lessonHref(course.slug, lesson._id)}
                                  aria-current={active ? "page" : undefined}
                                  onClick={() => {
                                    if (isMobile) {
                                      setOpenMobile(false);
                                    }
                                  }}
                                />
                              }
                            >
                              <Icon
                                aria-hidden
                                className={cn(
                                  "mt-px",
                                  lesson.completed ? "text-primary" : active ? "text-brand" : "text-muted-foreground",
                                )}
                              />
                              <span className="flex-1 leading-snug whitespace-normal">
                                {lesson.title}
                                {lesson.completed ? <span className="sr-only"> (completed)</span> : null}
                              </span>
                              {lesson.durationSeconds !== null ? (
                                <span className="text-xs font-normal text-muted-foreground tabular-nums">
                                  {formatClock(lesson.durationSeconds)}
                                </span>
                              ) : null}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })
                    )}
                  </SidebarMenu>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </SidebarContent>
    </Sidebar>
  );
}

const skeletonWidths = ["78%", "64%", "85%", "58%", "72%", "66%"];

export function LessonSidebarSkeleton() {
  return (
    <Sidebar collapsible="offcanvas" className={sidebarClass}>
      <SidebarHeader className="gap-2 border-b px-4 py-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-36" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <Skeleton className="mx-2 my-2 h-3 w-32" />
          <SidebarMenu>
            {/* Fixed widths: SidebarMenuSkeleton picks random ones, which breaks hydration. */}
            {skeletonWidths.map((width, i) => (
              <SidebarMenuItem key={i} className="flex h-8 items-center gap-2 px-2">
                <Skeleton className="size-4 rounded-md" />
                <Skeleton className="h-4" style={{ width }} />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
