import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, type MutationCtx } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { isSameIdSet } from "./lib/order";
import { contentLimits, invalidContent, parseLessonInput } from "./lib/validators";
import { discardVideo } from "./videos";

const lessonFields = {
  title: v.string(),
  description: v.string(),
  isFreePreview: v.boolean(),
};

/** Deletes a lesson and its video, including the video's file on Bunny Stream. */
export async function deleteLesson(ctx: MutationCtx, lesson: Doc<"lessons">) {
  if (lesson.videoId !== undefined) {
    await discardVideo(ctx, lesson.videoId);
  }
  await ctx.db.delete("lessons", lesson._id);
}

async function getLessonOrThrow(ctx: MutationCtx, lessonId: Id<"lessons">) {
  const lesson = await ctx.db.get("lessons", lessonId);
  if (lesson === null) {
    throw new ConvexError({ code: "NOT_FOUND" });
  }
  return lesson;
}

export const create = mutation({
  args: { chapterId: v.id("chapters"), ...lessonFields },
  returns: v.id("lessons"),
  handler: async (ctx, { chapterId, isFreePreview, ...input }) => {
    await requireAdmin(ctx);
    const chapter = await ctx.db.get("chapters", chapterId);
    if (chapter === null) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }
    const text = parseLessonInput(input);
    const existing = await ctx.db
      .query("lessons")
      .withIndex("by_chapter_position", (q) => q.eq("chapterId", chapterId))
      .order("desc")
      .take(contentLimits.lessonsPerChapter);
    if (existing.length >= contentLimits.lessonsPerChapter) {
      invalidContent(`A chapter can have at most ${contentLimits.lessonsPerChapter} lessons.`);
    }

    return await ctx.db.insert("lessons", {
      courseId: chapter.courseId,
      chapterId,
      ...text,
      isFreePreview,
      position: (existing[0]?.position ?? 0) + 1,
    });
  },
});

export const update = mutation({
  args: { lessonId: v.id("lessons"), ...lessonFields },
  returns: v.null(),
  handler: async (ctx, { lessonId, isFreePreview, ...input }) => {
    await requireAdmin(ctx);
    await getLessonOrThrow(ctx, lessonId);
    await ctx.db.patch("lessons", lessonId, { ...parseLessonInput(input), isFreePreview });
    return null;
  },
});

/**
 * Moves a lesson within its chapter or into another chapter of the same course, and sets the
 * target chapter's order. `lessonIds` must list exactly the target chapter's lessons, including
 * the moved one. The source chapter keeps its remaining lessons in order.
 */
export const move = mutation({
  args: { lessonId: v.id("lessons"), chapterId: v.id("chapters"), lessonIds: v.array(v.id("lessons")) },
  returns: v.null(),
  handler: async (ctx, { lessonId, chapterId, lessonIds }) => {
    await requireAdmin(ctx);
    const lesson = await getLessonOrThrow(ctx, lessonId);
    const chapter = await ctx.db.get("chapters", chapterId);
    if (chapter === null || chapter.courseId !== lesson.courseId) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }
    const targetLessons = await ctx.db
      .query("lessons")
      .withIndex("by_chapter_position", (q) => q.eq("chapterId", chapterId))
      .take(contentLimits.lessonsPerChapter + 1);
    const expected = targetLessons.map((l) => l._id);
    if (lesson.chapterId !== chapterId) {
      if (targetLessons.length >= contentLimits.lessonsPerChapter) {
        invalidContent(`A chapter can have at most ${contentLimits.lessonsPerChapter} lessons.`);
      }
      expected.push(lessonId);
    }
    if (!isSameIdSet(lessonIds, expected)) {
      throw new ConvexError({ code: "CONFLICT", message: "The lessons changed in the meantime. Please try again." });
    }
    if (lesson.chapterId !== chapterId) {
      await ctx.db.patch("lessons", lessonId, { chapterId });
    }
    await Promise.all(lessonIds.map((id, position) => ctx.db.patch("lessons", id, { position })));
    return null;
  },
});

export const remove = mutation({
  args: { lessonId: v.id("lessons") },
  returns: v.null(),
  handler: async (ctx, { lessonId }) => {
    await requireAdmin(ctx);
    await deleteLesson(ctx, await getLessonOrThrow(ctx, lessonId));
    return null;
  },
});
