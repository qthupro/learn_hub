import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

// Lessons are read to count them, so cap the read per course, as courses.ts does. Replace with a
// stored count or @convex-dev/aggregate once courses grow past this.
export const LESSON_COUNT_CAP = 500;

export type CourseProgress = {
  lessonCount: number;
  completedLessonCount: number;
  /** The student's most recent watch save in this course, or null if they haven't started. */
  lastWatchedAt: number | null;
};

/** A course's lesson ids, memoized so one query reading many students reads each course once. */
export function lessonIdCache(ctx: QueryCtx) {
  const cache = new Map<Id<"courses">, Promise<Set<Id<"lessons">>>>();
  return (courseId: Id<"courses">) => {
    let ids = cache.get(courseId);
    if (ids === undefined) {
      ids = ctx.db
        .query("lessons")
        .withIndex("by_course", (q) => q.eq("courseId", courseId))
        .take(LESSON_COUNT_CAP)
        .then((lessons) => new Set(lessons.map((lesson) => lesson._id)));
      cache.set(courseId, ids);
    }
    return ids;
  };
}

/**
 * How far a student is through a course. Only lessons that still exist count, so deleted lessons
 * can't push progress past 100%.
 */
export async function courseProgress(
  ctx: QueryCtx,
  userId: Id<"users">,
  courseId: Id<"courses">,
  lessonIds: (courseId: Id<"courses">) => Promise<Set<Id<"lessons">>>,
): Promise<CourseProgress> {
  const [ids, rows] = await Promise.all([
    lessonIds(courseId),
    ctx.db
      .query("lessonProgress")
      .withIndex("by_user_and_course", (q) => q.eq("userId", userId).eq("courseId", courseId))
      .take(LESSON_COUNT_CAP),
  ]);
  let completedLessonCount = 0;
  let lastWatchedAt: number | null = null;
  for (const row of rows) {
    if (!ids.has(row.lessonId)) {
      continue;
    }
    if (row.completedAt !== undefined) {
      completedLessonCount++;
    }
    const at = row.updatedAt ?? row.completedAt;
    if (at !== undefined && (lastWatchedAt === null || at > lastWatchedAt)) {
      lastWatchedAt = at;
    }
  }
  return { lessonCount: ids.size, completedLessonCount, lastWatchedAt };
}

/** Whole percent, rounded down so 100 means every lesson is done. Matches the student UI. */
export function progressPercent({ lessonCount, completedLessonCount }: CourseProgress) {
  return lessonCount === 0 ? 0 : Math.floor((completedLessonCount / lessonCount) * 100);
}
