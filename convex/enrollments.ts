import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { getCurrentUser, requireUser } from "./lib/auth";
import { courseProgress, lessonIdCache } from "./lib/progress";
import { adjustTotals } from "./lib/stats";
import { courseCategoryValidator } from "./lib/validators";

// Mutations run as serializable transactions, so "look up by user and course, then insert" in a
// single mutation can never produce two enrollments, even when free enrollment and the webhook
// race or Stripe delivers the same event twice.

async function findEnrollment(ctx: QueryCtx, userId: Id<"users">, courseId: Id<"courses">) {
  return await ctx.db
    .query("enrollments")
    .withIndex("by_user_and_course", (q) => q.eq("userId", userId).eq("courseId", courseId))
    .unique();
}

async function requirePublishedCourse(ctx: QueryCtx, courseId: Id<"courses">): Promise<Doc<"courses">> {
  const course = await ctx.db.get("courses", courseId);
  if (course?.status !== "published") {
    throw new ConvexError({ code: "NOT_FOUND", message: "This course is no longer available." });
  }
  return course;
}

/** Inserts the enrollment unless the student already has one. Returns whether it was created. */
async function enrollOnce(
  ctx: MutationCtx,
  enrollment: Omit<Doc<"enrollments">, "_id" | "_creationTime">,
): Promise<boolean> {
  if ((await findEnrollment(ctx, enrollment.userId, enrollment.courseId)) !== null) {
    return false;
  }
  const firstEnrollment =
    (await ctx.db
      .query("enrollments")
      .withIndex("by_user_and_course", (q) => q.eq("userId", enrollment.userId))
      .first()) === null;
  await ctx.db.insert("enrollments", enrollment);
  if (firstEnrollment) {
    await adjustTotals(ctx, { students: 1 });
  }
  const student = await ctx.db.get("users", enrollment.userId);
  if (student !== null) {
    // Stored so the admin student list can sort by it.
    await ctx.db.patch("users", student._id, { enrolledCourseCount: (student.enrolledCourseCount ?? 0) + 1 });
  }
  return true;
}

/** Whether the viewer can enroll in, has enrolled in, or must sign in for this course. */
export const viewerStatus = query({
  args: { courseId: v.id("courses") },
  returns: v.union(v.literal("signed_out"), v.literal("enrolled"), v.literal("not_enrolled")),
  handler: async (ctx, { courseId }) => {
    if ((await ctx.auth.getUserIdentity()) === null) {
      return "signed_out";
    }
    // Signed in but not stored yet (first visit) means not enrolled.
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return "not_enrolled";
    }
    return (await findEnrollment(ctx, user._id, courseId)) === null ? "not_enrolled" : "enrolled";
  },
});

const MY_COURSES_LIMIT = 50;

/** A dashboard card: the course plus how far the viewer has got through it. */
const myCourseValidator = v.object({
  _id: v.id("courses"),
  slug: v.string(),
  title: v.string(),
  category: courseCategoryValidator,
  thumbnailUrl: v.union(v.string(), v.null()),
  lessonCount: v.number(),
  completedLessonCount: v.number(),
});

/** The viewer's enrolled courses, most recently enrolled first. Unpublished courses are hidden. */
export const listMine = query({
  args: {},
  returns: v.array(myCourseValidator),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return [];
    }
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_user_and_course", (q) => q.eq("userId", user._id))
      .take(MY_COURSES_LIMIT);
    enrollments.sort((a, b) => b._creationTime - a._creationTime);

    const lessonIds = lessonIdCache(ctx);
    const courses = await Promise.all(
      enrollments.map(async ({ courseId }) => {
        const course = await ctx.db.get("courses", courseId);
        if (course?.status !== "published") {
          return null;
        }
        const progress = await courseProgress(ctx, user._id, courseId, lessonIds);
        return {
          _id: course._id,
          slug: course.slug,
          title: course.title,
          category: course.category,
          thumbnailUrl: course.thumbnailId ? await ctx.storage.getUrl(course.thumbnailId) : null,
          lessonCount: progress.lessonCount,
          completedLessonCount: progress.completedLessonCount,
        };
      }),
    );
    return courses.filter((course) => course !== null);
  },
});

const PAYMENT_HISTORY_LIMIT = 50;

/** The viewer's paid checkouts, newest first. Pending and abandoned checkouts aren't listed. */
export const myPayments = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("checkouts"),
      courseTitle: v.string(),
      // Null when the course is no longer published, so there is no page to link to.
      courseSlug: v.union(v.string(), v.null()),
      amountCents: v.number(),
      paidAt: v.number(),
      status: v.literal("paid"),
    }),
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return [];
    }
    const checkouts = await ctx.db
      .query("checkouts")
      .withIndex("by_user_and_status", (q) => q.eq("userId", user._id).eq("status", "paid"))
      .order("desc")
      .take(PAYMENT_HISTORY_LIMIT);
    return await Promise.all(
      checkouts.map(async (checkout) => {
        const course = await ctx.db.get("courses", checkout.courseId);
        return {
          _id: checkout._id,
          // The student paid for it, so showing the title of a since-unpublished course is fine.
          courseTitle: course?.title ?? "Deleted course",
          courseSlug: course?.status === "published" ? course.slug : null,
          amountCents: checkout.amountPaidCents ?? checkout.amountCents,
          paidAt: checkout.paidAt ?? checkout._creationTime,
          status: "paid" as const,
        };
      }),
    );
  },
});

/** Enrolls the signed-in student in a free course immediately. Paid courses go through Stripe. */
export const enrollFree = mutation({
  args: { courseId: v.id("courses") },
  returns: v.null(),
  handler: async (ctx, { courseId }) => {
    const user = await requireUser(ctx);
    const course = await requirePublishedCourse(ctx, courseId);
    if (course.priceCents !== 0) {
      throw new ConvexError({ code: "FORBIDDEN", message: "This course must be purchased." });
    }
    await enrollOnce(ctx, { userId: user._id, courseId, source: "free" });
    return null;
  },
});

/** The success page's view of one of the viewer's checkouts; null if it isn't theirs or unknown. */
export const checkoutStatus = query({
  args: { stripeSessionId: v.string() },
  returns: v.union(
    v.object({
      status: v.union(v.literal("pending"), v.literal("enrolled")),
      courseTitle: v.string(),
      courseSlug: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, { stripeSessionId }) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return null;
    }
    const checkout = await ctx.db
      .query("checkouts")
      .withIndex("by_stripe_session_id", (q) => q.eq("stripeSessionId", stripeSessionId))
      .unique();
    if (checkout === null || checkout.userId !== user._id) {
      return null;
    }
    const course = await ctx.db.get("courses", checkout.courseId);
    if (course === null) {
      return null;
    }
    // Enrolled covers both this payment and an enrollment that already existed.
    const enrolled = (await findEnrollment(ctx, user._id, course._id)) !== null;
    return { status: enrolled ? ("enrolled" as const) : ("pending" as const), courseTitle: course.title, courseSlug: course.slug };
  },
});

/**
 * What the checkout action needs to start a Stripe session for the signed-in student. Throws when
 * the course can't be bought: missing, draft, free, or already owned.
 */
export const getCheckoutContext = internalQuery({
  args: { courseId: v.id("courses") },
  returns: v.object({
    userId: v.id("users"),
    email: v.optional(v.string()),
    course: v.object({ title: v.string(), slug: v.string(), priceCents: v.number() }),
  }),
  handler: async (ctx, { courseId }) => {
    const user = await requireUser(ctx);
    const course = await requirePublishedCourse(ctx, courseId);
    if (course.priceCents === 0) {
      throw new ConvexError({ code: "CONFLICT", message: "This course is free. Enroll directly instead." });
    }
    if ((await findEnrollment(ctx, user._id, courseId)) !== null) {
      throw new ConvexError({ code: "CONFLICT", message: "You're already enrolled in this course." });
    }
    return {
      userId: user._id,
      email: user.email,
      course: { title: course.title, slug: course.slug, priceCents: course.priceCents },
    };
  },
});

/** Records a Checkout Session right after Stripe creates it, before the student is redirected. */
export const recordCheckout = internalMutation({
  args: {
    stripeSessionId: v.string(),
    userId: v.id("users"),
    courseId: v.id("courses"),
    amountCents: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("checkouts", { ...args, status: "pending" });
    return null;
  },
});

/**
 * Grants access for a paid Checkout Session. Only called by the Stripe webhook after the event
 * signature is verified and the session is re-fetched from Stripe as paid. Safe to run any number
 * of times for the same session.
 */
export const fulfillCheckout = internalMutation({
  args: { stripeSessionId: v.string(), amountPaidCents: v.number() },
  returns: v.union(v.literal("enrolled"), v.literal("already_fulfilled"), v.literal("already_enrolled")),
  handler: async (ctx, { stripeSessionId, amountPaidCents }) => {
    const checkout = await ctx.db
      .query("checkouts")
      .withIndex("by_stripe_session_id", (q) => q.eq("stripeSessionId", stripeSessionId))
      .unique();
    if (checkout === null) {
      // Thrown so the webhook responds 500 and Stripe retries rather than dropping a payment.
      throw new Error(`No checkout recorded for Stripe session ${stripeSessionId}`);
    }
    if (checkout.status === "paid") {
      return "already_fulfilled";
    }
    await ctx.db.patch("checkouts", checkout._id, { status: "paid", amountPaidCents, paidAt: Date.now() });
    // Counted once per checkout: a paid session returns early above on repeat deliveries.
    await adjustTotals(ctx, { revenueCents: amountPaidCents, coursesSold: 1 });
    const buyer = await ctx.db.get("users", checkout.userId);
    if (buyer !== null) {
      await ctx.db.patch("users", buyer._id, { totalSpentCents: (buyer.totalSpentCents ?? 0) + amountPaidCents });
    }
    const created = await enrollOnce(ctx, {
      userId: checkout.userId,
      courseId: checkout.courseId,
      source: "stripe",
      checkoutId: checkout._id,
    });
    if (!created) {
      // Paid for a course they already had (e.g. two checkout tabs). Needs a manual refund.
      console.warn(`Checkout ${checkout._id} paid for a course user ${checkout.userId} already owns`);
    }
    return created ? "enrolled" : "already_enrolled";
  },
});
