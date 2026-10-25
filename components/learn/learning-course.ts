import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";

export type LearningCourse = NonNullable<FunctionReturnType<typeof api.progress.courseForLearning>>;
export type LearningLesson = LearningCourse["chapters"][number]["lessons"][number];

/** Every lesson in course order. */
export function courseLessons(course: LearningCourse) {
  return course.chapters.flatMap((chapter) => chapter.lessons);
}

/** The lesson watched most recently; before any watching, the first one not yet completed. */
export function resumeLesson(course: LearningCourse): LearningLesson | undefined {
  const lessons = courseLessons(course);
  return (
    lessons.find((lesson) => lesson._id === course.lastLessonId) ??
    lessons.find((lesson) => !lesson.completed) ??
    lessons[0]
  );
}

/**
 * Lessons done out of the total, as used on the dashboard cards and the lesson navbar. Rounds down,
 * so 100% and `done` only appear once every lesson is complete.
 */
export function progressSummary(completed: number, total: number) {
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.floor((completed / total) * 100),
    done: total > 0 && completed >= total,
  };
}

export function courseProgress(course: LearningCourse) {
  const lessons = courseLessons(course);
  return progressSummary(lessons.filter((lesson) => lesson.completed).length, lessons.length);
}

export function lessonHref(slug: string, lessonId: string) {
  return `/learn/${slug}/${lessonId}`;
}
