/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as chapters from "../chapters.js";
import type * as courses from "../courses.js";
import type * as crons from "../crons.js";
import type * as enrollments from "../enrollments.js";
import type * as http from "../http.js";
import type * as lessons from "../lessons.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_bunny from "../lib/bunny.js";
import type * as lib_order from "../lib/order.js";
import type * as lib_progress from "../lib/progress.js";
import type * as lib_stats from "../lib/stats.js";
import type * as lib_students from "../lib/students.js";
import type * as lib_validators from "../lib/validators.js";
import type * as progress from "../progress.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as stripe from "../stripe.js";
import type * as students from "../students.js";
import type * as users from "../users.js";
import type * as videos from "../videos.js";
import type * as visits from "../visits.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  chapters: typeof chapters;
  courses: typeof courses;
  crons: typeof crons;
  enrollments: typeof enrollments;
  http: typeof http;
  lessons: typeof lessons;
  "lib/access": typeof lib_access;
  "lib/auth": typeof lib_auth;
  "lib/bunny": typeof lib_bunny;
  "lib/order": typeof lib_order;
  "lib/progress": typeof lib_progress;
  "lib/stats": typeof lib_stats;
  "lib/students": typeof lib_students;
  "lib/validators": typeof lib_validators;
  progress: typeof progress;
  seed: typeof seed;
  settings: typeof settings;
  stripe: typeof stripe;
  students: typeof students;
  users: typeof users;
  videos: typeof videos;
  visits: typeof visits;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
