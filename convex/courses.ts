import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { getPublishedCourseBySlug } from "./lib/access";
import { requireAdmin } from "./lib/auth";
import { adjustTotals } from "./lib/stats";
import {
  contentLimits,
  courseCategoryValidator,
  courseLevelValidator,
  courseLimits,
  courseStatusValidator,
  invalidThumbnail,
  parseCourseInput,
} from "./lib/validators";
import schema from "./schema";

const adminCourseValidator = schema.doc("courses").extend({
  thumbnailUrl: v.union(v.string(), v.null()),
});

/** The public card shape: only what the landing page shows, never draft or admin fields. */
const publishedCourseValidator = v.object({
  _id: v.id("courses"),
  slug: v.string(),
  title: v.string(),
  category: courseCategoryValidator,
  level: courseLevelValidator,
  priceCents: v.number(),
  thumbnailUrl: v.union(v.string(), v.null()),
  lessonCount: v.number(),
});

const PUBLISHED_COURSES_LIMIT = 12;
// Lessons are counted by reading them, so cap the read per course. Replace with a stored
// count or @convex-dev/aggregate once courses grow past this.
export const LESSON_COUNT_CAP = 500;

/** A published course page: course facts plus its curriculum, without any video ids. */
const courseDetailValidator = v.object({
  _id: v.id("courses"),
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  category: courseCategoryValidator,
  level: courseLevelValidator,
  priceCents: v.number(),
  thumbnailUrl: v.union(v.string(), v.null()),
  lessonCount: v.number(),
  durationSeconds: v.number(),
  chapters: v.array(
    v.object({
      _id: v.id("chapters"),
      title: v.string(),
      lessons: v.array(
        v.object({
          _id: v.id("lessons"),
          title: v.string(),
          durationSeconds: v.union(v.number(), v.null()),
          // True only for a free preview lesson whose video is ready to play.
          canPreview: v.boolean(),
        }),
      ),
    }),
  ),
});

const courseFields = {
  title: v.string(),
  description: v.string(),
  priceCents: v.number(),
  category: courseCategoryValidator,
  level: courseLevelValidator,
  status: courseStatusValidator,
};

async function withThumbnailUrl(ctx: QueryCtx, course: Doc<"courses">) {
  return {
    ...course,
    thumbnailUrl: course.thumbnailId ? await ctx.storage.getUrl(course.thumbnailId) : null,
  };
}

/** Checks an uploaded file is an image within the size limit. */
async function assertThumbnail(ctx: MutationCtx, storageId: Id<"_storage">) {
  const file = await ctx.db.system.get("_storage", storageId);
  if (file === null) {
    invalidThumbnail("The uploaded image was not found. Please upload it again.");
  }
  if (!file.contentType?.startsWith("image/")) {
    invalidThumbnail("The thumbnail must be an image.");
  }
  if (file.size > courseLimits.thumbnailMaxBytes) {
    invalidThumbnail("The thumbnail must be 2 MB or smaller.");
  }
}

function slugify(title: string) {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
  return slug || "course";
}

/** A slug for the title that no other course uses, adding -2, -3… when taken. */
async function uniqueSlug(ctx: MutationCtx, title: string) {
  const base = slugify(title);
  for (let n = 1; n <= 100; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const taken = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (taken === null) {
      return slug;
    }
  }
  throw new ConvexError({ code: "CONFLICT", message: "Too many courses share this title." });
}

/** Published courses in catalog order for the public landing page. Anyone can call it. */
export const listPublished = query({
  args: {},
  returns: v.array(publishedCourseValidator),
  handler: async (ctx) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_status_position", (q) => q.eq("status", "published"))
      .take(PUBLISHED_COURSES_LIMIT);
    return await Promise.all(
      courses.map(async (course) => {
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("by_course", (q) => q.eq("courseId", course._id))
          .take(LESSON_COUNT_CAP);
        return {
          _id: course._id,
          slug: course.slug,
          title: course.title,
          category: course.category,
          level: course.level,
          priceCents: course.priceCents,
          thumbnailUrl: course.thumbnailId ? await ctx.storage.getUrl(course.thumbnailId) : null,
          lessonCount: lessons.length,
        };
      }),
    );
  },
});

/** A published course and its curriculum for the public course page; null for drafts and unknown slugs. */
export const getPublishedBySlug = query({
  args: { slug: v.string() },
  returns: v.union(courseDetailValidator, v.null()),
  handler: async (ctx, { slug }) => {
    const course = await getPublishedCourseBySlug(ctx, slug);
    if (course === null) {
      return null;
    }
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_course_position", (q) => q.eq("courseId", course._id))
      .take(contentLimits.chaptersPerCourse);

    const outline = await Promise.all(
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
                durationSeconds: ready ? (video.durationSeconds ?? null) : null,
                canPreview: lesson.isFreePreview && ready,
              };
            }),
          ),
        };
      }),
    );
    const lessons = outline.flatMap((chapter) => chapter.lessons);

    return {
      _id: course._id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      priceCents: course.priceCents,
      thumbnailUrl: course.thumbnailId ? await ctx.storage.getUrl(course.thumbnailId) : null,
      lessonCount: lessons.length,
      durationSeconds: lessons.reduce((total, lesson) => total + (lesson.durationSeconds ?? 0), 0),
      chapters: outline,
    };
  },
});

/** Every course, drafts included, in catalog order. Admin only. */
export const listForAdmin = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(adminCourseValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const result = await ctx.db.query("courses").withIndex("by_position").paginate(args.paginationOpts);
    return {
      ...result,
      page: await Promise.all(result.page.map((course) => withThumbnailUrl(ctx, course))),
    };
  },
});

/** One course for the edit form, or null when the id is malformed or missing. Admin only. */
export const getForAdmin = query({
  args: { courseId: v.string() },
  returns: v.union(adminCourseValidator, v.null()),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const courseId = ctx.db.normalizeId("courses", args.courseId);
    const course = courseId === null ? null : await ctx.db.get("courses", courseId);
    return course === null ? null : await withThumbnailUrl(ctx, course);
  },
});

/** A short-lived URL the admin form POSTs a thumbnail image to. */
export const generateThumbnailUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: { ...courseFields, thumbnailId: v.optional(v.id("_storage")) },
  returns: v.id("courses"),
  handler: async (ctx, { thumbnailId, ...fields }) => {
    const admin = await requireAdmin(ctx);
    const text = parseCourseInput(fields);
    if (thumbnailId !== undefined) {
      await assertThumbnail(ctx, thumbnailId);
    }
    const last = await ctx.db.query("courses").withIndex("by_position").order("desc").first();

    const courseId = await ctx.db.insert("courses", {
      ...fields,
      ...text,
      slug: await uniqueSlug(ctx, text.title),
      thumbnailId,
      position: (last?.position ?? 0) + 1,
      createdBy: admin._id,
      updatedAt: Date.now(),
    });
    await adjustTotals(ctx, { courses: 1 });
    return courseId;
  },
});

/**
 * Updates a course. The slug stays fixed so existing links keep working.
 * thumbnailId: omit to keep the current image, null to remove it, or a new upload to replace it.
 */
export const update = mutation({
  args: {
    courseId: v.id("courses"),
    ...courseFields,
    thumbnailId: v.optional(v.union(v.id("_storage"), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, { courseId, thumbnailId, ...fields }) => {
    await requireAdmin(ctx);
    const course = await ctx.db.get("courses", courseId);
    if (course === null) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }
    const text = parseCourseInput(fields);

    const patch: Partial<Doc<"courses">> = { ...fields, ...text, updatedAt: Date.now() };
    if (thumbnailId !== undefined && thumbnailId !== course.thumbnailId) {
      if (thumbnailId !== null) {
        await assertThumbnail(ctx, thumbnailId);
      }
      patch.thumbnailId = thumbnailId ?? undefined;
      if (course.thumbnailId !== undefined) {
        await ctx.storage.delete(course.thumbnailId);
      }
    }
    await ctx.db.patch("courses", courseId, patch);
    return null;
  },
});

/** Deletes a course, its thumbnail file, and all of its chapters, lessons and videos. Admin only. */
export const remove = mutation({
  args: { courseId: v.id("courses") },
  returns: v.null(),
  handler: async (ctx, { courseId }) => {
    await requireAdmin(ctx);
    const course = await ctx.db.get("courses", courseId);
    if (course === null) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }
    // Enrollments and payments don't exist yet; once they do, decide whether a course with
    // students can be deleted at all.
    if (course.thumbnailId !== undefined) {
      await ctx.storage.delete(course.thumbnailId);
    }
    await ctx.db.delete("courses", courseId);
    await adjustTotals(ctx, { courses: -1 });
    // Chapters, lessons and videos are removed in background batches; nothing reads them once
    // the course is gone.
    await ctx.scheduler.runAfter(0, internal.chapters.deleteCourseContent, { courseId });
    return null;
  },
});
