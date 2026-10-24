import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentAdmin } from "./lib/auth";

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
