import { Suspense } from "react";
import type { Metadata } from "next";
import { LessonSkeleton } from "@/components/learn/learn-states";
import { LessonView } from "@/components/learn/lesson-view";

export const metadata: Metadata = {
  title: "Learning",
};

export default function LessonPage({ params }: PageProps<"/learn/[slug]/[lessonId]">) {
  return (
    <Suspense fallback={<LessonSkeleton />}>
      <LessonView params={params} />
    </Suspense>
  );
}
