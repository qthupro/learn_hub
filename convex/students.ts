import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, query, type QueryCtx } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { courseProgress, lessonIdCache, progressPercent } from "./lib/progress";
import { studentSearchText } from "./lib/students";
import { courseStatusValidator } from "./lib/validators";

// Admin views of students. Every public function here starts with requireAdmin.

const COURSES_PER_STUDENT = 100;
const SEARCH_MAX = 100;

const studentRowValidator = v.object({
  _id: v.id("users"),
  name: v.string(),
  email: v.union(v.string(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
  joinedAt: v.number(),
  enrolledCourseCount: v.number(),
  // Mean of the per-course percentages; null with no enrollments.
  averageProgress: v.union(v.number(), v.null()),
  totalSpentCents: v.number(),
});

/** The student's enrollments, oldest first, for courses that still exist. */
async function enrolledCourses(ctx: QueryCtx, student: Doc<"users">) {
  const enrollments = await ctx.db
    .query("enrollments")
    .withIndex("by_user_and_course", (q) => q.eq("userId", student._id))
    .take(COURSES_PER_STUDENT);
  const withCourses = await Promise.all(
    enrollments.map(async (enrollment) => ({ enrollment, course: await ctx.db.get("courses", enrollment.courseId) })),
  );
  return withCourses
    .filter((item): item is { enrollment: Doc<"enrollments">; course: Doc<"courses"> } => item.course !== null)
    .sort((a, b) => a.enrollment._creationTime - b.enrollment._creationTime);
}

/**
 * One page of students. With `search`, results match name or email and come back by relevance, so
 * `sort` is ignored. Average progress is computed live and can't be sorted on.
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    sort: v.union(v.literal("joined"), v.literal("name"), v.literal("courses"), v.literal("spent")),
    order: v.union(v.literal("asc"), v.literal("desc")),
  },
  returns: paginationResultValidator(studentRowValidator),
  handler: async (ctx, { paginationOpts, search, sort, order }) => {
    await requireAdmin(ctx);
    const term = search?.trim().slice(0, SEARCH_MAX);

    const result = term
      ? await ctx.db
          .query("users")
          .withSearchIndex("search_text", (q) => q.search("searchText", term).eq("role", "student"))
          .paginate(paginationOpts)
      : await (() => {
          const students = ctx.db.query("users");
          switch (sort) {
            case "name":
              return students.withIndex("by_role_and_name", (q) => q.eq("role", "student"));
            case "courses":
              return students.withIndex("by_role_and_enrolled_course_count", (q) => q.eq("role", "student"));
            case "spent":
              return students.withIndex("by_role_and_total_spent_cents", (q) => q.eq("role", "student"));
            default:
              return students.withIndex("by_role", (q) => q.eq("role", "student"));
          }
        })()
          .order(order)
          .paginate(paginationOpts);

    const lessonIds = lessonIdCache(ctx);
    const page = await Promise.all(
      result.page.map(async (student) => {
        const courses = await enrolledCourses(ctx, student);
        const percents = await Promise.all(
          courses.map(async ({ course }) => progressPercent(await courseProgress(ctx, student._id, course._id, lessonIds))),
        );
        return {
          _id: student._id,
          name: student.name,
          email: student.email ?? null,
          imageUrl: student.imageUrl ?? null,
          joinedAt: student._creationTime,
          enrolledCourseCount: courses.length,
          averageProgress:
            percents.length === 0 ? null : Math.round(percents.reduce((sum, p) => sum + p, 0) / percents.length),
          totalSpentCents: student.totalSpentCents ?? 0,
        };
      }),
    );
    return { ...result, page };
  },
});

/** One student with each enrolled course and their progress in it; null if not a student. */
export const get = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.union(v.string(), v.null()),
      imageUrl: v.union(v.string(), v.null()),
      joinedAt: v.number(),
      totalSpentCents: v.number(),
      courses: v.array(
        v.object({
          _id: v.id("courses"),
          title: v.string(),
          slug: v.string(),
          status: courseStatusValidator,
          source: v.union(v.literal("free"), v.literal("stripe")),
          enrolledAt: v.number(),
          lessonCount: v.number(),
          completedLessonCount: v.number(),
          percent: v.number(),
          lastWatchedAt: v.union(v.number(), v.null()),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);
    const student = await ctx.db.get("users", userId);
    if (student === null || student.role !== "student") {
      return null;
    }
    const lessonIds = lessonIdCache(ctx);
    const courses = await Promise.all(
      (await enrolledCourses(ctx, student)).map(async ({ enrollment, course }) => {
        const progress = await courseProgress(ctx, student._id, course._id, lessonIds);
        return {
          _id: course._id,
          title: course.title,
          slug: course.slug,
          status: course.status,
          source: enrollment.source,
          enrolledAt: enrollment._creationTime,
          ...progress,
          percent: progressPercent(progress),
        };
      }),
    );
    return {
      _id: student._id,
      name: student.name,
      email: student.email ?? null,
      imageUrl: student.imageUrl ?? null,
      joinedAt: student._creationTime,
      totalSpentCents: student.totalSpentCents ?? 0,
      courses,
    };
  },
});

/**
 * Fills searchText, enrolledCourseCount and totalSpentCents for users stored before those fields
 * existed: `npx convex run students:backfill`. Recomputes from the data, so it's safe to rerun. Reads
 * every user, enrollment and checkout in one transaction; batch it once those tables grow large.
 */
export const backfill = internalMutation({
  args: {},
  returns: v.object({ users: v.number() }),
  handler: async (ctx) => {
    let users = 0;
    for await (const user of ctx.db.query("users")) {
      let enrolledCourseCount = 0;
      // Convex has no count operator, so walk the rows.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _enrollment of ctx.db
        .query("enrollments")
        .withIndex("by_user_and_course", (q) => q.eq("userId", user._id))) {
        enrolledCourseCount++;
      }
      let totalSpentCents = 0;
      for await (const checkout of ctx.db
        .query("checkouts")
        .withIndex("by_user_and_status", (q) => q.eq("userId", user._id).eq("status", "paid"))) {
        totalSpentCents += checkout.amountPaidCents ?? 0;
      }
      await ctx.db.patch("users", user._id, {
        searchText: studentSearchText(user.name, user.email),
        enrolledCourseCount,
        totalSpentCents,
      });
      users++;
    }
    return { users };
  },
});
