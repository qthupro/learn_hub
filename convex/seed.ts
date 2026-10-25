import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery, type QueryCtx } from "./_generated/server";
import { createBunnyVideo, fetchBunnyVideo, signUpload } from "./lib/bunny";
import { adjustTotals } from "./lib/stats";
import { courseCategoryValidator, courseLevelValidator, parseChapterTitle, parseCourseInput, parseLessonInput } from "./lib/validators";

// Dev-only test data. Internal functions, run from the CLI with `npx convex run seed:<name>`;
// the browser can never call them. Delete a seeded course from the admin UI as usual.

async function firstAdmin(ctx: QueryCtx): Promise<Id<"users">> {
  const users = await ctx.db.query("users").take(200);
  const admin = users.find((user) => user.role === "admin");
  if (admin === undefined) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Sign in once as an admin before seeding." });
  }
  return admin._id;
}

/** Creates a published course with its chapters and lessons. Returns lesson ids in curriculum order. */
export const createCourse = internalMutation({
  args: {
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    priceCents: v.number(),
    category: courseCategoryValidator,
    level: courseLevelValidator,
    chapters: v.array(
      v.object({
        title: v.string(),
        lessons: v.array(v.object({ title: v.string(), description: v.string(), isFreePreview: v.boolean() })),
      }),
    ),
  },
  returns: v.object({ courseId: v.id("courses"), lessonIds: v.array(v.id("lessons")) }),
  handler: async (ctx, { slug, chapters, category, level, ...input }) => {
    const createdBy = await firstAdmin(ctx);
    if ((await ctx.db.query("courses").withIndex("by_slug", (q) => q.eq("slug", slug)).unique()) !== null) {
      throw new ConvexError({ code: "CONFLICT", message: `A course with slug "${slug}" already exists.` });
    }
    const last = await ctx.db.query("courses").withIndex("by_position").order("desc").first();
    const courseId = await ctx.db.insert("courses", {
      ...parseCourseInput(input),
      slug,
      category,
      level,
      status: "published",
      position: (last?.position ?? 0) + 1,
      createdBy,
      updatedAt: Date.now(),
    });
    await adjustTotals(ctx, { courses: 1 });

    const lessonIds: Id<"lessons">[] = [];
    for (const [chapterIndex, chapter] of chapters.entries()) {
      const chapterId = await ctx.db.insert("chapters", {
        courseId,
        title: parseChapterTitle(chapter.title),
        position: chapterIndex + 1,
      });
      for (const [lessonIndex, { isFreePreview, ...lesson }] of chapter.lessons.entries()) {
        lessonIds.push(
          await ctx.db.insert("lessons", {
            courseId,
            chapterId,
            ...parseLessonInput(lesson),
            isFreePreview,
            position: lessonIndex + 1,
          }),
        );
      }
    }
    return { courseId, lessonIds };
  },
});

/**
 * Moves every chapter and lesson (with its video) from one course to the end of another, then
 * deletes the emptied course and its thumbnail. Videos stay on Bunny.
 */
export const moveCourseContent = internalMutation({
  args: { fromCourseId: v.id("courses"), toCourseId: v.id("courses") },
  returns: v.object({ chapters: v.number(), lessons: v.number() }),
  handler: async (ctx, { fromCourseId, toCourseId }) => {
    const from = await ctx.db.get("courses", fromCourseId);
    if (from === null || (await ctx.db.get("courses", toCourseId)) === null) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }
    const lastChapter = await ctx.db
      .query("chapters")
      .withIndex("by_course_position", (q) => q.eq("courseId", toCourseId))
      .order("desc")
      .first();
    let position = lastChapter?.position ?? 0;
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_course_position", (q) => q.eq("courseId", fromCourseId))
      .take(100);
    for (const chapter of chapters) {
      await ctx.db.patch("chapters", chapter._id, { courseId: toCourseId, position: ++position });
    }
    const lessons = await ctx.db.query("lessons").withIndex("by_course", (q) => q.eq("courseId", fromCourseId)).take(500);
    for (const lesson of lessons) {
      await ctx.db.patch("lessons", lesson._id, { courseId: toCourseId });
    }
    if (from.thumbnailId !== undefined) {
      await ctx.storage.delete(from.thumbnailId);
    }
    await ctx.db.delete("courses", fromCourseId);
    await adjustTotals(ctx, { courses: -1 });
    await ctx.db.patch("courses", toCourseId, { updatedAt: Date.now() });
    return { chapters: chapters.length, lessons: lessons.length };
  },
});

export const generateThumbnailUploadUrl = internalMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

export const setThumbnail = internalMutation({
  args: { courseId: v.id("courses"), storageId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, { courseId, storageId }) => {
    await ctx.db.patch("courses", courseId, { thumbnailId: storageId, updatedAt: Date.now() });
    return null;
  },
});

export const lessonForUpload = internalQuery({
  args: { lessonId: v.id("lessons") },
  returns: v.object({ title: v.string(), hasVideo: v.boolean() }),
  handler: async (ctx, { lessonId }) => {
    const lesson = await ctx.db.get("lessons", lessonId);
    if (lesson === null) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }
    return { title: lesson.title, hasVideo: lesson.videoId !== undefined };
  },
});

export const attachVideo = internalMutation({
  args: { lessonId: v.id("lessons"), bunnyVideoId: v.string() },
  returns: v.id("videos"),
  handler: async (ctx, { lessonId, bunnyVideoId }) => {
    const videoId = await ctx.db.insert("videos", {
      lessonId,
      bunnyVideoId,
      status: "uploading",
      uploadedBy: await firstAdmin(ctx),
      updatedAt: Date.now(),
    });
    await ctx.db.patch("lessons", lessonId, { videoId });
    return videoId;
  },
});

/** Creates the lesson's Bunny video and returns TUS credentials for uploading the file from the CLI. */
export const startUpload = internalAction({
  args: { lessonId: v.id("lessons") },
  returns: v.object({ endpoint: v.string(), libraryId: v.string(), bunnyVideoId: v.string(), signature: v.string(), expires: v.number() }),
  handler: async (ctx, { lessonId }) => {
    const lesson: { title: string; hasVideo: boolean } = await ctx.runQuery(internal.seed.lessonForUpload, { lessonId });
    if (lesson.hasVideo) {
      throw new ConvexError({ code: "CONFLICT", message: "This lesson already has a video." });
    }
    const bunnyVideoId = await createBunnyVideo(lesson.title);
    await ctx.runMutation(internal.seed.attachVideo, { lessonId, bunnyVideoId });
    const { endpoint, libraryId, signature, expires } = await signUpload(bunnyVideoId);
    return { endpoint, libraryId, bunnyVideoId, signature, expires };
  },
});

export const courseBunnyIds = internalQuery({
  args: { courseId: v.id("courses") },
  returns: v.array(v.string()),
  handler: async (ctx, { courseId }) => {
    const lessons = await ctx.db.query("lessons").withIndex("by_course", (q) => q.eq("courseId", courseId)).take(500);
    const ids: string[] = [];
    for (const lesson of lessons) {
      const video = lesson.videoId === undefined ? null : await ctx.db.get("videos", lesson.videoId);
      if (video !== null) {
        ids.push(video.bunnyVideoId);
      }
    }
    return ids;
  },
});

/** Re-reads every seeded video's state from Bunny, in case a webhook was missed. Returns counts by status. */
export const refreshVideos = internalAction({
  args: { courseId: v.id("courses") },
  returns: v.record(v.string(), v.number()),
  handler: async (ctx, { courseId }) => {
    const bunnyIds: string[] = await ctx.runQuery(internal.seed.courseBunnyIds, { courseId });
    const counts: Record<string, number> = {};
    for (const bunnyVideoId of bunnyIds) {
      const state = await fetchBunnyVideo(bunnyVideoId);
      await ctx.runMutation(internal.videos.applyBunnyState, { bunnyVideoId, state });
      const status = state?.status ?? "missing";
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  },
});
