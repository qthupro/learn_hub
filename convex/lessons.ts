import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, type MutationCtx } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { isSameIdSet } from "./lib/order";
import { contentLimits, invalidContent, parseLessonInput } from "./lib/validators";

const lessonFields = {
  title: v.string(),
  description: v.string(),
  isFreePreview: v.boolean(),
  // A Bunny Stream video GUID, or "" for none. Uploading comes later; for now the id is entered by hand.
  bunnyVideoId: v.string(),
};

/**
 * Points the lesson at the given Bunny video, replacing or removing any previous link.
 * Hand-entered ids are stored as "processing": they are not verified with Bunny yet, so they are
 * never treated as ready to play.
 */
async function setLessonVideo(
  ctx: MutationCtx,
  lesson: Doc<"lessons">,
  bunnyVideoId: string | undefined,
  adminId: Id<"users">,
) {
  const current = lesson.videoId ? await ctx.db.get("videos", lesson.videoId) : null;
  if ((current?.bunnyVideoId ?? undefined) === bunnyVideoId) {
    return;
  }
  if (bunnyVideoId !== undefined) {
    const linked = await ctx.db
      .query("videos")
      .withIndex("by_bunny_video_id", (q) => q.eq("bunnyVideoId", bunnyVideoId))
      .first();
    if (linked !== null) {
      throw new ConvexError({ code: "CONFLICT", message: "That video is already linked to another lesson." });
    }
  }
  if (current !== null) {
    await ctx.db.delete("videos", current._id);
  }
  const videoId =
    bunnyVideoId === undefined
      ? undefined
      : await ctx.db.insert("videos", {
          lessonId: lesson._id,
          bunnyVideoId,
          status: "processing",
          uploadedBy: adminId,
          updatedAt: Date.now(),
        });
  await ctx.db.patch("lessons", lesson._id, { videoId });
}

/** Deletes a lesson and its video record. */
export async function deleteLesson(ctx: MutationCtx, lesson: Doc<"lessons">) {
  if (lesson.videoId !== undefined) {
    await ctx.db.delete("videos", lesson.videoId);
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
    const admin = await requireAdmin(ctx);
    const chapter = await ctx.db.get("chapters", chapterId);
    if (chapter === null) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }
    const { bunnyVideoId, ...text } = parseLessonInput(input);
    const existing = await ctx.db
      .query("lessons")
      .withIndex("by_chapter_position", (q) => q.eq("chapterId", chapterId))
      .order("desc")
      .take(contentLimits.lessonsPerChapter);
    if (existing.length >= contentLimits.lessonsPerChapter) {
      invalidContent(`A chapter can have at most ${contentLimits.lessonsPerChapter} lessons.`);
    }

    const lessonId = await ctx.db.insert("lessons", {
      courseId: chapter.courseId,
      chapterId,
      ...text,
      isFreePreview,
      position: (existing[0]?.position ?? 0) + 1,
    });
    const lesson = await ctx.db.get("lessons", lessonId);
    await setLessonVideo(ctx, lesson!, bunnyVideoId, admin._id);
    return lessonId;
  },
});

export const update = mutation({
  args: { lessonId: v.id("lessons"), ...lessonFields },
  returns: v.null(),
  handler: async (ctx, { lessonId, isFreePreview, ...input }) => {
    const admin = await requireAdmin(ctx);
    const lesson = await getLessonOrThrow(ctx, lessonId);
    const { bunnyVideoId, ...text } = parseLessonInput(input);
    await ctx.db.patch("lessons", lessonId, { ...text, isFreePreview });
    await setLessonVideo(ctx, lesson, bunnyVideoId, admin._id);
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
