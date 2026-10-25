"use client";

import { use, type CSSProperties, type ReactNode } from "react";
import { LearnNavbar } from "@/components/learn/learn-navbar";
import { LessonSidebar, LessonSidebarSkeleton } from "@/components/learn/lesson-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLearningCourse } from "@/hooks/use-learning-course";

/**
 * The learning page shell: a full-width navbar over the lesson sidebar and content. Always renders
 * `children`; the page itself shows the "not available" state. Convex enforces access.
 */
export function LearnShell({ params, children }: { params: Promise<{ slug: string }>; children: ReactNode }) {
  const { slug } = use(params);
  const course = useLearningCourse(slug);

  return (
    <TooltipProvider>
      <SidebarProvider
        className="flex-col [--header-height:calc(--spacing(14))]"
        // Wider than the default so lesson titles have room.
        style={{ "--sidebar-width": "20rem" } as CSSProperties}
      >
        <LearnNavbar course={course} />
        <div className="flex flex-1">
          {course === undefined ? <LessonSidebarSkeleton /> : course === null ? null : <LessonSidebar course={course} />}
          <SidebarInset>{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
