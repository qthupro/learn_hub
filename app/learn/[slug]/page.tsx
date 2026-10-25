import { Suspense } from "react";
import type { Metadata } from "next";
import { LessonSkeleton } from "@/components/learn/learn-states";
import { ResumeLesson } from "@/components/learn/resume-lesson";

export const metadata: Metadata = {
  title: "Learning",
};

export default function LearnCoursePage({ params }: PageProps<"/learn/[slug]">) {
  return (
    <Suspense fallback={<LessonSkeleton />}>
      <ResumeLesson params={params} />
    </Suspense>
  );
}
