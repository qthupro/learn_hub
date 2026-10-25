import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, query } from "./_generated/server";
import { getCurrentAdmin, requireAdmin } from "./lib/auth";
import { emptyTotals, getTotals } from "./lib/stats";

/**
 * The signed-in admin's profile, or null for anyone else. Returns null instead
 * of throwing so the admin UI can redirect non-admins without an error boundary.
 */
export const viewer = query({
  args: {},
  returns: v.union(
    v.object({
      name: v.string(),
      email: v.union(v.string(), v.null()),
      imageUrl: v.union(v.string(), v.null()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const admin = await getCurrentAdmin(ctx);
    if (admin === null) {
      return null;
    }
    return { name: admin.name, email: admin.email ?? null, imageUrl: admin.imageUrl ?? null };
  },
});

const totalsValidator = v.object({
  courses: v.number(),
  students: v.number(),
  revenueCents: v.number(),
  coursesSold: v.number(),
});

/** The dashboard overview: total courses, enrolled students, revenue and courses sold. Admin only. */
export const dashboardStats = query({
  args: {},
  returns: totalsValidator,
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await getTotals(ctx);
  },
});

/**
 * Rebuilds the dashboard totals from the data, e.g. to backfill rows written before the totals
 * existed: `npx convex run admin:recomputeStats`. Reads every course, enrollment and checkout in
 * one transaction, so it suits this app's size; batch it once those tables grow large.
 */
export const recomputeStats = internalMutation({
  args: {},
  returns: totalsValidator,
  handler: async (ctx) => {
    const totals = { ...emptyTotals };
    // Convex has no count operator, so walk the rows.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _course of ctx.db.query("courses")) {
      totals.courses++;
    }
    const students = new Set<Id<"users">>();
    for await (const enrollment of ctx.db.query("enrollments")) {
      students.add(enrollment.userId);
    }
    totals.students = students.size;
    for await (const checkout of ctx.db.query("checkouts")) {
      if (checkout.status === "paid") {
        totals.coursesSold++;
        totals.revenueCents += checkout.amountPaidCents ?? 0;
      }
    }

    const row = await ctx.db.query("stats").first();
    if (row === null) {
      await ctx.db.insert("stats", totals);
    } else {
      await ctx.db.replace("stats", row._id, totals);
    }
    return totals;
  },
});
