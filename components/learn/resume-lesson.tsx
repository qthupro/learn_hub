"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CourseUnavailable, LearnMessage, LessonSkeleton } from "@/components/learn/learn-states";
import { lessonHref, resumeLesson } from "@/components/learn/learning-course";
import { Button } from "@/components/ui/button";
import { useLearningCourse } from "@/hooks/use-learning-course";

/** Sends the student to their first unfinished lesson. */
export function ResumeLesson({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const course = useLearningCourse(slug);
  const target = course ? resumeLesson(course) : undefined;
  const href = course && target ? lessonHref(course.slug, target._id) : null;

  useEffect(() => {
    if (href) {
      router.replace(href);
    }
  }, [href, router]);

  if (course === null) {
    return <CourseUnavailable />;
  }
  if (course !== undefined && href === null) {
    return (
      <LearnMessage
        title="No lessons yet"
        action={
          <Button nativeButton={false} render={<Link href="/dashboard" />}>
            Back to dashboard
          </Button>
        }
      >
        Lessons for this course are still being recorded. Check back soon.
      </LearnMessage>
    );
  }
  return <LessonSkeleton />;
}
