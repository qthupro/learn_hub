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
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_clerk_user_id", ["clerkUserId"]),

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
});
