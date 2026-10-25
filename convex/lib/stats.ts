import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type Totals = Omit<Doc<"stats">, "_id" | "_creationTime">;

export const emptyTotals: Totals = { courses: 0, students: 0, revenueCents: 0, coursesSold: 0 };

export async function getTotals(ctx: QueryCtx): Promise<Totals> {
  const row = await ctx.db.query("stats").first();
  return row === null ? emptyTotals : { courses: row.courses, students: row.students, revenueCents: row.revenueCents, coursesSold: row.coursesSold };
}

/**
 * Adds to the dashboard totals. Call it in the same mutation as the write being counted, so the
 * totals can never drift from the data. Every call writes one shared row; fine at this scale,
 * switch to @convex-dev/aggregate if concurrent enrollments start conflicting.
 */
export async function adjustTotals(ctx: MutationCtx, delta: Partial<Totals>) {
  const row = await ctx.db.query("stats").first();
  const current = row ?? emptyTotals;
  const next: Totals = {
    courses: current.courses + (delta.courses ?? 0),
    students: current.students + (delta.students ?? 0),
    revenueCents: current.revenueCents + (delta.revenueCents ?? 0),
    coursesSold: current.coursesSold + (delta.coursesSold ?? 0),
  };
  if (row === null) {
    await ctx.db.insert("stats", next);
  } else {
    await ctx.db.patch("stats", row._id, next);
  }
}
