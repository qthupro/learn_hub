import { ConvexError, v, type Infer } from "convex/values";

export const courseCategories = ["development", "design", "data", "ai", "business", "photography"] as const;
export const courseLevels = ["beginner", "intermediate", "advanced"] as const;
export const courseStatuses = ["draft", "published"] as const;
export const videoStatuses = ["uploading", "processing", "ready", "failed"] as const;

export const courseCategoryValidator = v.union(...courseCategories.map((c) => v.literal(c)));
export const courseLevelValidator = v.union(...courseLevels.map((l) => v.literal(l)));
export const courseStatusValidator = v.union(...courseStatuses.map((s) => v.literal(s)));
export const videoStatusValidator = v.union(...videoStatuses.map((s) => v.literal(s)));

export type CourseCategory = Infer<typeof courseCategoryValidator>;
export type CourseLevel = Infer<typeof courseLevelValidator>;
export type CourseStatus = Infer<typeof courseStatusValidator>;
export type VideoStatus = Infer<typeof videoStatusValidator>;

/** Shared with the admin form so client and server reject the same input. */
export const courseLimits = {
  titleMin: 3,
  titleMax: 120,
  descriptionMax: 2000,
  minPaidPriceCents: 50,
  maxPriceCents: 100000,
  thumbnailMaxBytes: 2 * 1024 * 1024,
} as const;

/** Shared with the course content editor. */
export const contentLimits = {
  titleMin: 1,
  titleMax: 120,
  lessonDescriptionMax: 5000,
  chaptersPerCourse: 100,
  lessonsPerChapter: 200,
} as const;

export type CourseField = "title" | "description" | "priceCents" | "thumbnail";
export type LessonField = "title" | "description" | "bunnyVideoId";

/** The ConvexError payload for rejected input; `field` lets the form highlight it. */
export type InvalidInputError = { code: "INVALID_INPUT"; field: string; message: string };

function invalid(field: string, message: string): never {
  throw new ConvexError({ code: "INVALID_INPUT", field, message } satisfies InvalidInputError);
}

/** Returns the error message for a course field, or null when it is valid. */
export function courseFieldError(field: "title" | "description" | "priceCents", value: string | number): string | null {
  if (field === "title") {
    const length = String(value).trim().length;
    if (length < courseLimits.titleMin || length > courseLimits.titleMax) {
      return `Title must be ${courseLimits.titleMin}–${courseLimits.titleMax} characters.`;
    }
  } else if (field === "description") {
    if (String(value).trim().length > courseLimits.descriptionMax) {
      return `Description must be at most ${courseLimits.descriptionMax} characters.`;
    }
  } else {
    const cents = Number(value);
    if (
      !Number.isInteger(cents) ||
      cents < 0 ||
      (cents > 0 && cents < courseLimits.minPaidPriceCents) ||
      cents > courseLimits.maxPriceCents
    ) {
      return "Price must be free ($0) or between $0.50 and $1,000.";
    }
  }
  return null;
}

/** Trims and validates course text and price, throwing INVALID_INPUT on the first bad field. */
export function parseCourseInput(input: { title: string; description: string; priceCents: number }) {
  const parsed = { title: input.title.trim(), description: input.description.trim(), priceCents: input.priceCents };
  for (const field of ["title", "description", "priceCents"] as const) {
    const error = courseFieldError(field, parsed[field]);
    if (error !== null) {
      invalid(field, error);
    }
  }
  return parsed;
}

export function invalidThumbnail(message: string): never {
  invalid("thumbnail", message);
}

/** Returns the error message for a chapter or lesson title, or null when it is valid. */
export function contentTitleError(title: string): string | null {
  const length = title.trim().length;
  return length < contentLimits.titleMin || length > contentLimits.titleMax
    ? `Title must be ${contentLimits.titleMin}–${contentLimits.titleMax} characters.`
    : null;
}

export function lessonDescriptionError(description: string): string | null {
  return description.trim().length > contentLimits.lessonDescriptionMax
    ? `Description must be at most ${contentLimits.lessonDescriptionMax} characters.`
    : null;
}

/** Bunny Stream video ids are GUIDs. */
export function bunnyVideoIdError(bunnyVideoId: string): string | null {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bunnyVideoId.trim())
    ? null
    : "Enter a Bunny Stream video ID like 1b2c3d4e-0000-4000-8000-000000000001.";
}

/** Trims and validates a chapter title, throwing INVALID_INPUT when it is bad. */
export function parseChapterTitle(title: string) {
  const trimmed = title.trim();
  const error = contentTitleError(trimmed);
  if (error !== null) {
    invalid("title", error);
  }
  return trimmed;
}

/** Trims and validates lesson text; an empty description or video id becomes undefined. */
export function parseLessonInput(input: { title: string; description: string; bunnyVideoId: string }) {
  const title = input.title.trim();
  const description = input.description.trim();
  const bunnyVideoId = input.bunnyVideoId.trim().toLowerCase();
  const titleError = contentTitleError(title);
  if (titleError !== null) {
    invalid("title", titleError);
  }
  const descriptionError = lessonDescriptionError(description);
  if (descriptionError !== null) {
    invalid("description", descriptionError);
  }
  if (bunnyVideoId !== "") {
    const videoError = bunnyVideoIdError(bunnyVideoId);
    if (videoError !== null) {
      invalid("bunnyVideoId", videoError);
    }
  }
  return { title, description: description || undefined, bunnyVideoId: bunnyVideoId || undefined };
}

/** For limits that aren't tied to one form field. */
export function invalidContent(message: string): never {
  invalid("form", message);
}
