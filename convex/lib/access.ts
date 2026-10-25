import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

// Single source for who may see course content. Public pages only ever see published courses;
// a draft is treated exactly like a missing course.

/** The published course with this slug, or null when it is missing or a draft. */
export async function getPublishedCourseBySlug(ctx: QueryCtx, slug: string): Promise<Doc<"courses"> | null> {
  const course = await ctx.db
    .query("courses")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  return course?.status === "published" ? course : null;
}

/**
 * The ready video of a free preview lesson in a published course, or null. Anyone, signed in or
 * not, may watch these.
 */
export async function getFreePreviewVideo(ctx: QueryCtx, lessonId: Id<"lessons">): Promise<Doc<"videos"> | null> {
  const lesson = await ctx.db.get("lessons", lessonId);
  if (lesson === null || !lesson.isFreePreview || lesson.videoId === undefined) {
    return null;
  }
  const course = await ctx.db.get("courses", lesson.courseId);
  if (course?.status !== "published") {
    return null;
  }
  const video = await ctx.db.get("videos", lesson.videoId);
  return video?.status === "ready" ? video : null;
}

/**
 * Whether this user may watch the course's lessons: admins always, students only when the course
 * is published and they are enrolled in it.
 */
export async function canViewCourseContent(ctx: QueryCtx, user: Doc<"users">, course: Doc<"courses">) {
  if (user.role === "admin") {
    return true;
  }
  if (course.status !== "published") {
    return false;
  }
  const enrollment = await ctx.db
    .query("enrollments")
    .withIndex("by_user_and_course", (q) => q.eq("userId", user._id).eq("courseId", course._id))
    .unique();
  return enrollment !== null;
}
