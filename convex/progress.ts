import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { canViewCourseContent } from "./lib/access";
import { getCurrentUser, requireUser } from "./lib/auth";
import { LESSON_COUNT_CAP } from "./lib/progress";
import { contentLimits } from "./lib/validators";

/** The learning page's view of a course: its outline plus which lessons the viewer has completed. */
const learningCourseValidator = v.object({
  _id: v.id("courses"),
  slug: v.string(),
  title: v.string(),
  chapters: v.array(
    v.object({
      _id: v.id("chapters"),
      title: v.string(),
      lessons: v.array(
        v.object({
          _id: v.id("lessons"),
          title: v.string(),
          description: v.union(v.string(), v.null()),
          durationSeconds: v.union(v.number(), v.null()),
          // True once the lesson's video is ready to play.
          hasVideo: v.boolean(),
          completed: v.boolean(),
          // Where the viewer stopped last time; 0 when they haven't started.
          positionSeconds: v.number(),
        }),
      ),
    }),
  ),
  // The lesson the viewer watched most recently, to reopen; null before they start.
  lastLessonId: v.union(v.id("lessons"), v.null()),
});

/**
 * A course for the lesson player, or null when it doesn't exist or the viewer may not watch it
 * (signed out, not enrolled, or a draft), so its existence isn't revealed. Never returns video ids.
 */
export const courseForLearning = query({
  args: { slug: v.string() },
  returns: v.union(learningCourseValidator, v.null()),
  handler: async (ctx, { slug }) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return null;
    }
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (course === null || !(await canViewCourseContent(ctx, user, course))) {
      return null;
    }

    const [chapters, progress] = await Promise.all([
      ctx.db
        .query("chapters")
        .withIndex("by_course_position", (q) => q.eq("courseId", course._id))
        .take(contentLimits.chaptersPerCourse),
      ctx.db
        .query("lessonProgress")
        .withIndex("by_user_and_course", (q) => q.eq("userId", user._id).eq("courseId", course._id))
        .take(LESSON_COUNT_CAP),
    ]);
    const progressByLesson = new Map(progress.map((row) => [row.lessonId, row]));
    const lastWatched = progress.reduce<Doc<"lessonProgress"> | null>(
      (latest, row) => ((row.updatedAt ?? 0) > (latest?.updatedAt ?? 0) ? row : latest),
      null,
    );

    return {
      _id: course._id,
      slug: course.slug,
      title: course.title,
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
                const ready = video?.status === "ready";
                return {
                  _id: lesson._id,
                  title: lesson.title,
                  description: lesson.description ?? null,
                  durationSeconds: ready ? (video.durationSeconds ?? null) : null,
                  hasVideo: ready,
                  completed: progressByLesson.get(lesson._id)?.completedAt !== undefined,
                  positionSeconds: progressByLesson.get(lesson._id)?.positionSeconds ?? 0,
                };
              }),
            ),
          };
        }),
      ),
      lastLessonId: lastWatched?.lessonId ?? null,
    };
  },
});

// The share of a video that must actually be played to complete its lesson.
const COMPLETE_AT = 0.9;
// The player saves about every 5 seconds. Allow fast playback speeds and timer drift, but no more,
// so a client can't claim more watching than the time that has really passed.
const MAX_WATCH_RATE = 3;
const WATCH_SLACK_SECONDS = 5;
const MAX_WATCHED_PER_SAVE = 60;

/**
 * Records the viewer's playback position and newly watched seconds for a lesson, and completes the
 * lesson once they have watched 90% of it. Completion is never undone. Sent by the lesson player.
 */
export const saveWatchProgress = mutation({
  args: {
    lessonId: v.id("lessons"),
    positionSeconds: v.number(),
    // Seconds played since the previous save, excluding seeks.
    watchedSeconds: v.number(),
    // The player's reported length, used only when Bunny hasn't given us one.
    durationSeconds: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const lesson = await ctx.db.get("lessons", args.lessonId);
    const course = lesson ? await ctx.db.get("courses", lesson.courseId) : null;
    if (lesson === null || course === null || !(await canViewCourseContent(ctx, user, course))) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }
    if (![args.positionSeconds, args.watchedSeconds, args.durationSeconds].every((n) => Number.isFinite(n) && n >= 0)) {
      throw new ConvexError({ code: "INVALID_INPUT", message: "Invalid playback progress." });
    }

    const video = lesson.videoId ? await ctx.db.get("videos", lesson.videoId) : null;
    if (video?.status !== "ready") {
      throw new ConvexError({ code: "NOT_FOUND" });
    }
    const duration = video.durationSeconds ?? args.durationSeconds;

    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_and_lesson", (q) => q.eq("userId", user._id).eq("lessonId", args.lessonId))
      .unique();
    const now = Date.now();
    const sinceLastSave = existing?.updatedAt === undefined ? Infinity : (now - existing.updatedAt) / 1000;
    const watchedDelta = Math.min(
      args.watchedSeconds,
      MAX_WATCHED_PER_SAVE,
      sinceLastSave * MAX_WATCH_RATE + WATCH_SLACK_SECONDS,
    );
    const watchedSeconds = Math.min((existing?.watchedSeconds ?? 0) + watchedDelta, duration);
    const positionSeconds = duration > 0 ? Math.min(args.positionSeconds, duration) : args.positionSeconds;
    const completedAt =
      existing?.completedAt ?? (duration > 0 && watchedSeconds >= duration * COMPLETE_AT ? now : undefined);

    const fields = { positionSeconds, watchedSeconds, completedAt, updatedAt: now };
    if (existing === null) {
      await ctx.db.insert("lessonProgress", {
        userId: user._id,
        courseId: lesson.courseId,
        lessonId: args.lessonId,
        ...fields,
      });
    } else {
      await ctx.db.patch("lessonProgress", existing._id, fields);
    }
    return null;
  },
});

const HISTORY_LIMIT = 50;
// Rows for deleted lessons or courses the viewer lost access to are skipped, so read a few extra.
const HISTORY_SCAN = 100;

/**
 * The lessons the viewer watched most recently, newest first, with how far through each they got.
 * Only lessons they can still watch are included.
 */
export const recentlyWatched = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("lessonProgress"),
      lessonId: v.id("lessons"),
      lessonTitle: v.string(),
      courseTitle: v.string(),
      courseSlug: v.string(),
      // Share of the video watched, 0–100; 100 once the lesson is completed.
      percent: v.number(),
      completed: v.boolean(),
      watchedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return [];
    }
    const rows = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_and_updated_at", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(HISTORY_SCAN);

    const viewer = user;
    const viewable = new Map<Id<"courses">, Doc<"courses"> | null>();
    async function viewableCourse(courseId: Id<"courses">) {
      if (!viewable.has(courseId)) {
        const course = await ctx.db.get("courses", courseId);
        viewable.set(courseId, course !== null && (await canViewCourseContent(ctx, viewer, course)) ? course : null);
      }
      return viewable.get(courseId) ?? null;
    }

    const history = [];
    for (const row of rows) {
      if (history.length === HISTORY_LIMIT) {
        break;
      }
      const lesson = await ctx.db.get("lessons", row.lessonId);
      const course = lesson ? await viewableCourse(lesson.courseId) : null;
      if (lesson === null || course === null) {
        continue;
      }
      const video = lesson.videoId ? await ctx.db.get("videos", lesson.videoId) : null;
      const duration = video?.durationSeconds ?? 0;
      const completed = row.completedAt !== undefined;
      history.push({
        _id: row._id,
        lessonId: lesson._id,
        lessonTitle: lesson.title,
        courseTitle: course.title,
        courseSlug: course.slug,
        percent: completed
          ? 100
          : duration > 0
            ? Math.min(99, Math.floor(((row.watchedSeconds ?? 0) / duration) * 100))
            : 0,
        completed,
        watchedAt: row.updatedAt ?? row.completedAt ?? row._creationTime,
      });
    }
    return history;
  },
});
