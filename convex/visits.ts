import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

// Visits are counted once per visitor, per page, per UTC day. The visitor id is a random UUID the
// browser keeps in localStorage; Convex never sees IP addresses and nothing here stores one.

const VISITOR_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const PATH_MAX = 200;
const DAY_MS = 24 * 60 * 60 * 1000;
const CLEANUP_BATCH = 500;

function utcDay(time: number) {
  return new Date(time).toISOString().slice(0, 10);
}

/** "/courses/x/" → "/courses/x"; query strings and hashes never reach here. */
function normalizePath(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/**
 * Records a page view. Anyone can call it, signed in or not. Admin pages aren't counted, so staff
 * browsing doesn't inflate the numbers. Repeat views of a page by the same visitor on the same day
 * are ignored.
 */
export const record = mutation({
  args: { path: v.string(), visitorId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const path = normalizePath(args.path);
    if (!VISITOR_ID.test(args.visitorId) || !path.startsWith("/") || path.length > PATH_MAX) {
      throw new ConvexError({ code: "INVALID_INPUT" });
    }
    if (path === "/admin" || path.startsWith("/admin/")) {
      return null;
    }

    const day = utcDay(Date.now());
    const seen = await ctx.db
      .query("pageVisits")
      .withIndex("by_visitor_id_and_path_and_day", (q) =>
        q.eq("visitorId", args.visitorId).eq("path", path).eq("day", day),
      )
      .unique();
    if (seen !== null) {
      return null;
    }
    await ctx.db.insert("pageVisits", { day, path, visitorId: args.visitorId });

    const total = await ctx.db
      .query("dailyVisits")
      .withIndex("by_day", (q) => q.eq("day", day))
      .unique();
    if (total === null) {
      await ctx.db.insert("dailyVisits", { day, visits: 1 });
    } else {
      await ctx.db.patch("dailyVisits", total._id, { visits: total.visits + 1 });
    }
    return null;
  },
});

/**
 * Visits per day for the `days` days ending on `endDay` (the caller's UTC today, since queries
 * can't read the clock), oldest first, with zero for days without visits. Admin only.
 */
export const daily = query({
  args: { endDay: v.string(), days: v.union(v.literal(7), v.literal(30), v.literal(90)) },
  returns: v.array(v.object({ day: v.string(), visits: v.number() })),
  handler: async (ctx, { endDay, days }) => {
    await requireAdmin(ctx);
    const end = Date.parse(`${endDay}T00:00:00Z`);
    if (!DAY.test(endDay) || Number.isNaN(end)) {
      throw new ConvexError({ code: "INVALID_INPUT" });
    }
    const startDay = utcDay(end - (days - 1) * DAY_MS);
    const rows = await ctx.db
      .query("dailyVisits")
      .withIndex("by_day", (q) => q.gte("day", startDay).lte("day", endDay))
      .take(days);
    const visitsByDay = new Map(rows.map((row) => [row.day, row.visits]));
    return Array.from({ length: days }, (_, i) => {
      const day = utcDay(end - (days - 1 - i) * DAY_MS);
      return { day, visits: visitsByDay.get(day) ?? 0 };
    });
  },
});

/** Deletes per-visitor rows from before yesterday; the daily totals are kept. Run by crons.ts. */
export const deleteOldVisits = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const cutoff = utcDay(Date.now() - DAY_MS);
    const old = await ctx.db
      .query("pageVisits")
      .withIndex("by_day", (q) => q.lt("day", cutoff))
      .take(CLEANUP_BATCH);
    for (const row of old) {
      await ctx.db.delete("pageVisits", row._id);
    }
    if (old.length === CLEANUP_BATCH) {
      await ctx.scheduler.runAfter(0, internal.visits.deleteOldVisits, {});
    }
    return null;
  },
});
