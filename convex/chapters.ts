import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { deleteLesson } from "./lessons";
import { requireAdmin } from "./lib/auth";
import { isSameIdSet } from "./lib/order";
import {
  contentLimits,
  courseStatusValidator,
  invalidContent,
  parseChapterTitle,
  videoStatusValidator,
} from "./lib/validators";

const outlineLessonValidator = v.object({
  _id: v.id("lessons"),
  title: v.string(),
  description: v.optional(v.string()),
  isFreePreview: v.boolean(),
  videoStatus: v.union(videoStatusValidator, v.null()),
});

const outlineValidator = v.object({
  course: v.object({ _id: v.id("courses"), title: v.string(), status: courseStatusValidator }),
  chapters: v.array(
    v.object({
      _id: v.id("chapters"),
      title: v.string(),
      lessons: v.array(outlineLessonValidator),
    }),
  ),
});

/** A course's chapters and lessons in order, for the content editor. Null when the course is missing. Admin only. */
export const outlineForAdmin = query({
  args: { courseId: v.string() },
  returns: v.union(outlineValidator, v.null()),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const courseId = ctx.db.normalizeId("courses", args.courseId);
    const course = courseId === null ? null : await ctx.db.get("courses", courseId);
    if (course === null) {
      return null;
    }
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_course_position", (q) => q.eq("courseId", course._id))
      .take(contentLimits.chaptersPerCourse);

    return {
      course: { _id: course._id, title: course.title, status: course.status },
      chapters: await Promise.all(
        chapters.map(async (chapter) => {
          const lessons = await ctx.db
            .query("lessons")
            .withIndex("by_chapter_position", (q) => q.eq("chapterId", chapter._id))
            .take(contentLimits.lessonsPerChapter);
          return {
            _id: chapter._id,
            title: chapter.title,
            lessons: await Promise.all(
              lessons.map(async (lesson) => {
                const video = lesson.videoId ? await ctx.db.get("videos", lesson.videoId) : null;
                return {
                  _id: lesson._id,
                  title: lesson.title,
                  description: lesson.description,
                  isFreePreview: lesson.isFreePreview,
                  videoStatus: video?.status ?? null,
                };
              }),
            ),
          };
        }),
      ),
    };
  },
});

async function getChapterOrThrow(ctx: MutationCtx, chapterId: Id<"chapters">) {
  const chapter = await ctx.db.get("chapters", chapterId);
  if (chapter === null) {
    throw new ConvexError({ code: "NOT_FOUND" });
  }
  return chapter;
}

export const create = mutation({
  args: { courseId: v.id("courses"), title: v.string() },
  returns: v.id("chapters"),
  handler: async (ctx, { courseId, title }) => {
    await requireAdmin(ctx);
    if ((await ctx.db.get("courses", courseId)) === null) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }
    const parsedTitle = parseChapterTitle(title);
    const existing = await ctx.db
      .query("chapters")
      .withIndex("by_course_position", (q) => q.eq("courseId", courseId))
      .order("desc")
      .take(contentLimits.chaptersPerCourse);
    if (existing.length >= contentLimits.chaptersPerCourse) {
      invalidContent(`A course can have at most ${contentLimits.chaptersPerCourse} chapters.`);
    }
    return await ctx.db.insert("chapters", {
      courseId,
      title: parsedTitle,
      position: (existing[0]?.position ?? 0) + 1,
    });
  },
});

export const rename = mutation({
  args: { chapterId: v.id("chapters"), title: v.string() },
  returns: v.null(),
  handler: async (ctx, { chapterId, title }) => {
    await requireAdmin(ctx);
    await getChapterOrThrow(ctx, chapterId);
    await ctx.db.patch("chapters", chapterId, { title: parseChapterTitle(title) });
    return null;
  },
});

/** Sets the order of every chapter in a course. `chapterIds` must list exactly the course's chapters. */
export const reorder = mutation({
  args: { courseId: v.id("courses"), chapterIds: v.array(v.id("chapters")) },
  returns: v.null(),
  handler: async (ctx, { courseId, chapterIds }) => {
    await requireAdmin(ctx);
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_course_position", (q) => q.eq("courseId", courseId))
      .take(contentLimits.chaptersPerCourse + 1);
    if (!isSameIdSet(chapterIds, chapters.map((chapter) => chapter._id))) {
      throw new ConvexError({ code: "CONFLICT", message: "The chapters changed in the meantime. Please try again." });
    }
    await Promise.all(chapterIds.map((id, position) => ctx.db.patch("chapters", id, { position })));
    return null;
  },
});

/** Deletes a chapter with its lessons and their video records. */
export const remove = mutation({
  args: { chapterId: v.id("chapters") },
  returns: v.null(),
  handler: async (ctx, { chapterId }) => {
    await requireAdmin(ctx);
    await getChapterOrThrow(ctx, chapterId);
    // Bounded: a chapter holds at most lessonsPerChapter lessons.
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_chapter_position", (q) => q.eq("chapterId", chapterId))
      .take(contentLimits.lessonsPerChapter + 1);
    for (const lesson of lessons) {
      await deleteLesson(ctx, lesson);
    }
    await ctx.db.delete("chapters", chapterId);
    return null;
  },
});

const CLEANUP_BATCH = 100;

/**
 * Deletes a deleted course's lessons, videos and chapters in batches, rescheduling itself until
 * none are left, so a large course never exceeds a single transaction's limits.
 */
export const deleteCourseContent = internalMutation({
  args: { courseId: v.id("courses") },
  returns: v.null(),
  handler: async (ctx, { courseId }) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", courseId))
      .take(CLEANUP_BATCH);
    for (const lesson of lessons) {
      await deleteLesson(ctx, lesson);
    }
    if (lessons.length === CLEANUP_BATCH) {
      await ctx.scheduler.runAfter(0, internal.chapters.deleteCourseContent, { courseId });
      return null;
    }

    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_course_position", (q) => q.eq("courseId", courseId))
      .take(CLEANUP_BATCH);
    for (const chapter of chapters) {
      await ctx.db.delete("chapters", chapter._id);
    }
    if (chapters.length === CLEANUP_BATCH) {
      await ctx.scheduler.runAfter(0, internal.chapters.deleteCourseContent, { courseId });
    }
    return null;
  },
});
