import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  courseCategoryValidator,
  courseLevelValidator,
  courseStatusValidator,
  videoStatusValidator,
} from "./lib/validators";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    clerkUserId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("student")),
    // Name plus email (and its parts) for the admin student search; kept in step by users.upsert.
    searchText: v.optional(v.string()),
    // Kept in step with enrollments and paid checkouts so the admin student list can sort by them.
    // Unset only on rows from before they existed; `npx convex run students:backfill` fills them.
    enrolledCourseCount: v.optional(v.number()),
    totalSpentCents: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_role", ["role"])
    .index("by_role_and_name", ["role", "name"])
    .index("by_role_and_enrolled_course_count", ["role", "enrolledCourseCount"])
    .index("by_role_and_total_spent_cents", ["role", "totalSpentCents"])
    .searchIndex("search_text", { searchField: "searchText", filterFields: ["role"] }),

  courses: defineTable({
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    status: courseStatusValidator,
    priceCents: v.number(),
    category: courseCategoryValidator,
    level: courseLevelValidator,
    thumbnailId: v.optional(v.id("_storage")),
    position: v.number(),
    createdBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status_position", ["status", "position"])
    .index("by_position", ["position"]),

  chapters: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    position: v.number(),
  }).index("by_course_position", ["courseId", "position"]),

  lessons: defineTable({
    // Copied from the chapter on the server; never accepted from the client.
    courseId: v.id("courses"),
    chapterId: v.id("chapters"),
    title: v.string(),
    description: v.optional(v.string()),
    // Lets anyone watch this lesson without enrolling.
    isFreePreview: v.boolean(),
    position: v.number(),
    videoId: v.optional(v.id("videos")),
  })
    .index("by_chapter_position", ["chapterId", "position"])
    .index("by_course", ["courseId"]),

  videos: defineTable({
    lessonId: v.id("lessons"),
    bunnyVideoId: v.string(),
    status: videoStatusValidator,
    uploadedBy: v.id("users"),
    durationSeconds: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_bunny_video_id", ["bunnyVideoId"])
    .index("by_lesson", ["lessonId"])
    .index("by_status", ["status"]),

  // One row per student per course; enrollments.ts keeps it unique.
  enrollments: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    source: v.union(v.literal("free"), v.literal("stripe")),
    // The paid checkout that granted access; unset for free enrollments.
    checkoutId: v.optional(v.id("checkouts")),
  })
    .index("by_user_and_course", ["userId", "courseId"])
    .index("by_course", ["courseId"]),

  // One row per student per lesson they have started watching. Written by the lesson player.
  lessonProgress: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    lessonId: v.id("lessons"),
    // Where playback last was, to resume from.
    positionSeconds: v.optional(v.number()),
    // Seconds actually played (seeking doesn't count); completes the lesson at 90% of its length.
    watchedSeconds: v.optional(v.number()),
    // Set once, when the lesson is completed; never cleared by watching again.
    completedAt: v.optional(v.number()),
    // Last save; the most recent row in a course is the lesson to reopen.
    updatedAt: v.optional(v.number()),
  })
    .index("by_user_and_lesson", ["userId", "lessonId"])
    .index("by_user_and_course", ["userId", "courseId"])
    .index("by_user_and_updated_at", ["userId", "updatedAt"]),

  // A single row of running totals for the admin dashboard, kept in step by convex/lib/stats.ts in
  // the same mutation as each write it counts. Rebuild with `npx convex run admin:recomputeStats`.
  stats: defineTable({
    courses: v.number(),
    // Users with at least one enrollment.
    students: v.number(),
    revenueCents: v.number(),
    // Paid checkouts.
    coursesSold: v.number(),
  }),

  // A single row of site-wide settings, edited on the admin Settings page. Until it exists,
  // defaultSiteSettings in lib/validators.ts applies.
  siteSettings: defineTable({
    siteName: v.string(),
    description: v.string(),
    logoId: v.optional(v.id("_storage")),
    faviconId: v.optional(v.id("_storage")),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }),

  // One row per visitor per page per UTC day, only so each is counted once. The visitor id is a
  // random id from the browser; no IP address or other personal data is stored. Rows older than
  // yesterday are deleted daily by crons.ts.
  pageVisits: defineTable({
    day: v.string(),
    path: v.string(),
    visitorId: v.string(),
  })
    .index("by_visitor_id_and_path_and_day", ["visitorId", "path", "day"])
    .index("by_day", ["day"]),

  // Unique page visits per UTC day ("YYYY-MM-DD"), for the admin visits chart.
  dailyVisits: defineTable({
    day: v.string(),
    visits: v.number(),
  }).index("by_day", ["day"]),

  // Every Stripe Checkout Session we create. The webhook only fulfills sessions recorded here, and
  // takes the student and course from this row rather than from Stripe metadata.
  checkouts: defineTable({
    stripeSessionId: v.string(),
    userId: v.id("users"),
    courseId: v.id("courses"),
    amountCents: v.number(),
    status: v.union(v.literal("pending"), v.literal("paid")),
    // What Stripe reported as charged, set when the paid webhook is processed.
    amountPaidCents: v.optional(v.number()),
    // When the paid webhook was processed. Unset on checkouts paid before it was recorded.
    paidAt: v.optional(v.number()),
  })
    .index("by_stripe_session_id", ["stripeSessionId"])
    .index("by_user_and_status", ["userId", "status"]),
});
