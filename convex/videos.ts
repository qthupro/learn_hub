import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { canViewCourseContent, getFreePreviewVideo } from "./lib/access";
import { getCurrentUser, requireAdmin } from "./lib/auth";
import {
  createBunnyVideo,
  deleteBunnyVideo,
  fetchBunnyVideo,
  FREE_PREVIEW_TOKEN_TTL_SECONDS,
  signedEmbedUrl,
  signUpload,
} from "./lib/bunny";
import { videoStatusValidator, type VideoStatus } from "./lib/validators";

/** Deletes a video record and schedules removal of its file from Bunny Stream. */
export async function discardVideo(ctx: MutationCtx, videoId: Id<"videos">) {
  const video = await ctx.db.get("videos", videoId);
  if (video === null) {
    return;
  }
  await ctx.db.delete("videos", videoId);
  await ctx.scheduler.runAfter(0, internal.videos.deleteFromBunny, { bunnyVideoId: video.bunnyVideoId });
}

/** The lesson's current video, for the lesson form's live status. Admin only. */
export const forLesson = query({
  args: { lessonId: v.id("lessons") },
  returns: v.union(
    v.object({
      _id: v.id("videos"),
      status: videoStatusValidator,
      durationSeconds: v.optional(v.number()),
      errorMessage: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, { lessonId }) => {
    await requireAdmin(ctx);
    const lesson = await ctx.db.get("lessons", lessonId);
    const video = lesson?.videoId ? await ctx.db.get("videos", lesson.videoId) : null;
    if (video === null) {
      return null;
    }
    return {
      _id: video._id,
      status: video.status,
      durationSeconds: video.durationSeconds,
      errorMessage: video.errorMessage,
    };
  },
});

export const lessonTitleForAdmin = internalQuery({
  args: { lessonId: v.id("lessons") },
  returns: v.string(),
  handler: async (ctx, { lessonId }) => {
    await requireAdmin(ctx);
    const lesson = await ctx.db.get("lessons", lessonId);
    if (lesson === null) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }
    return lesson.title;
  },
});

type AdminVideo = { bunnyVideoId: string; status: VideoStatus };

export const videoForAdmin = internalQuery({
  args: { videoId: v.id("videos") },
  returns: v.union(v.object({ bunnyVideoId: v.string(), status: videoStatusValidator }), v.null()),
  handler: async (ctx, { videoId }) => {
    await requireAdmin(ctx);
    const video = await ctx.db.get("videos", videoId);
    return video === null ? null : { bunnyVideoId: video.bunnyVideoId, status: video.status };
  },
});

/**
 * Links a freshly created Bunny video to the lesson as "uploading", discarding the lesson's
 * previous video. Returns null when the lesson was deleted in the meantime.
 */
export const attachUpload = internalMutation({
  args: { lessonId: v.id("lessons"), bunnyVideoId: v.string() },
  returns: v.union(v.id("videos"), v.null()),
  handler: async (ctx, { lessonId, bunnyVideoId }) => {
    const admin = await requireAdmin(ctx);
    const lesson = await ctx.db.get("lessons", lessonId);
    if (lesson === null) {
      return null;
    }
    if (lesson.videoId !== undefined) {
      await discardVideo(ctx, lesson.videoId);
    }
    const videoId = await ctx.db.insert("videos", {
      lessonId,
      bunnyVideoId,
      status: "uploading",
      uploadedBy: admin._id,
      updatedAt: Date.now(),
    });
    await ctx.db.patch("lessons", lessonId, { videoId });
    return videoId;
  },
});

/**
 * Creates a Bunny video for the lesson, replacing its current one, and returns short-lived
 * credentials for uploading the file straight from the browser over TUS. Admin only.
 */
export const createUpload = action({
  args: { lessonId: v.id("lessons") },
  returns: v.object({
    videoId: v.id("videos"),
    endpoint: v.string(),
    libraryId: v.string(),
    bunnyVideoId: v.string(),
    signature: v.string(),
    expires: v.number(),
  }),
  handler: async (
    ctx,
    { lessonId },
  ): Promise<{
    videoId: Id<"videos">;
    endpoint: string;
    libraryId: string;
    bunnyVideoId: string;
    signature: string;
    expires: number;
  }> => {
    const title: string = await ctx.runQuery(internal.videos.lessonTitleForAdmin, { lessonId });
    const bunnyVideoId = await createBunnyVideo(title);
    let videoId: Id<"videos"> | null;
    try {
      videoId = await ctx.runMutation(internal.videos.attachUpload, { lessonId, bunnyVideoId });
    } catch (error) {
      await deleteBunnyVideo(bunnyVideoId);
      throw error;
    }
    if (videoId === null) {
      await deleteBunnyVideo(bunnyVideoId);
      throw new ConvexError({ code: "NOT_FOUND" });
    }
    const { endpoint, libraryId, signature, expires } = await signUpload(bunnyVideoId);
    return { videoId, endpoint, libraryId, bunnyVideoId, signature, expires };
  },
});

/** Abandons an upload that hasn't finished: unlinks the video and deletes it from Bunny. Admin only. */
export const cancelUpload = mutation({
  args: { videoId: v.id("videos") },
  returns: v.null(),
  handler: async (ctx, { videoId }) => {
    await requireAdmin(ctx);
    const video = await ctx.db.get("videos", videoId);
    // Once Bunny has the whole file the video is kept; replacing it is a new upload.
    if (video === null || video.status !== "uploading") {
      return null;
    }
    const lesson = await ctx.db.get("lessons", video.lessonId);
    if (lesson?.videoId === videoId) {
      await ctx.db.patch("lessons", lesson._id, { videoId: undefined });
    }
    await discardVideo(ctx, videoId);
    return null;
  },
});

const statusRank: Record<VideoStatus, number> = { uploading: 0, processing: 1, ready: 2, failed: 2 };

/**
 * Stores a video's state as just fetched from the Bunny API. `state` is null when Bunny no longer
 * has the video. Unknown videos are ignored, and a late, older reading never moves a video back
 * (for example from ready to processing).
 */
export const applyBunnyState = internalMutation({
  args: {
    bunnyVideoId: v.string(),
    state: v.union(v.object({ status: videoStatusValidator, durationSeconds: v.optional(v.number()) }), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, { bunnyVideoId, state }) => {
    const video = await ctx.db
      .query("videos")
      .withIndex("by_bunny_video_id", (q) => q.eq("bunnyVideoId", bunnyVideoId))
      .first();
    if (video === null) {
      return null;
    }
    const status = state?.status ?? "failed";
    if (statusRank[status] < statusRank[video.status]) {
      return null;
    }
    await ctx.db.patch("videos", video._id, {
      status,
      durationSeconds: state?.durationSeconds ?? video.durationSeconds,
      errorMessage:
        status !== "failed"
          ? undefined
          : state === null
            ? "The video is missing from Bunny Stream."
            : "Bunny Stream couldn't process this video.",
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Re-reads the video's state from Bunny, e.g. right after the browser finishes uploading. Admin only. */
export const refreshStatus = action({
  args: { videoId: v.id("videos") },
  returns: v.null(),
  handler: async (ctx, { videoId }): Promise<null> => {
    const video: AdminVideo | null = await ctx.runQuery(internal.videos.videoForAdmin, { videoId });
    if (video === null) {
      return null;
    }
    const state = await fetchBunnyVideo(video.bunnyVideoId);
    await ctx.runMutation(internal.videos.applyBunnyState, { bunnyVideoId: video.bunnyVideoId, state });
    return null;
  },
});

/** A short-lived, token-signed player URL for a ready video, or null if it isn't ready. Admin only. */
export const previewUrl = action({
  args: { videoId: v.id("videos") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { videoId }): Promise<string | null> => {
    const video: AdminVideo | null = await ctx.runQuery(internal.videos.videoForAdmin, { videoId });
    if (video === null || video.status !== "ready") {
      return null;
    }
    return await signedEmbedUrl(video.bunnyVideoId);
  },
});

/** The Bunny id of a playable free preview lesson's video, or null. No sign-in needed. */
export const freePreviewBunnyId = internalQuery({
  args: { lessonId: v.id("lessons") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { lessonId }) => {
    const video = await getFreePreviewVideo(ctx, lessonId);
    return video?.bunnyVideoId ?? null;
  },
});

/**
 * A short-lived, token-signed player URL for a free preview lesson of a published course. Anyone
 * can call it; every other lesson, and every lesson of a draft course, is NOT_FOUND.
 */
export const freePreviewUrl = action({
  args: { lessonId: v.id("lessons") },
  returns: v.string(),
  handler: async (ctx, { lessonId }): Promise<string> => {
    const bunnyVideoId: string | null = await ctx.runQuery(internal.videos.freePreviewBunnyId, { lessonId });
    if (bunnyVideoId === null) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }
    return await signedEmbedUrl(bunnyVideoId, FREE_PREVIEW_TOKEN_TTL_SECONDS);
  },
});

/** The Bunny id of a lesson's ready video if the viewer may watch it, otherwise null. */
export const lessonBunnyId = internalQuery({
  args: { lessonId: v.id("lessons") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { lessonId }) => {
    const user = await getCurrentUser(ctx);
    const lesson = await ctx.db.get("lessons", lessonId);
    if (user === null || lesson?.videoId === undefined) {
      return null;
    }
    const course = await ctx.db.get("courses", lesson.courseId);
    if (course === null || !(await canViewCourseContent(ctx, user, course))) {
      return null;
    }
    const video = await ctx.db.get("videos", lesson.videoId);
    return video?.status === "ready" ? video.bunnyVideoId : null;
  },
});

/**
 * A short-lived, token-signed player URL for a lesson the viewer may watch: enrolled students and
 * admins. Anything else, including a lesson whose video isn't ready, is NOT_FOUND.
 */
export const lessonPlaybackUrl = action({
  args: { lessonId: v.id("lessons") },
  returns: v.string(),
  handler: async (ctx, { lessonId }): Promise<string> => {
    const bunnyVideoId: string | null = await ctx.runQuery(internal.videos.lessonBunnyId, { lessonId });
    if (bunnyVideoId === null) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }
    return await signedEmbedUrl(bunnyVideoId);
  },
});

export const deleteFromBunny = internalAction({
  args: { bunnyVideoId: v.string() },
  returns: v.null(),
  handler: async (_ctx, { bunnyVideoId }) => {
    await deleteBunnyVideo(bunnyVideoId);
    return null;
  },
});
