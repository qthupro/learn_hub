import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, query } from "./_generated/server";
import { getCurrentUser, requireIdentity } from "./lib/auth";
import { studentSearchText } from "./lib/students";
import schema from "./schema";

/** The signed-in user's record, or null when signed out or not stored yet. */
export const current = query({
  args: {},
  returns: v.union(schema.doc("users"), v.null()),
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

type ClerkUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  image_url: string | null;
  primary_email_address_id: string | null;
  email_addresses: { id: string; email_address: string }[];
};

/**
 * Loads the profile from Clerk's Backend API. The session token Clerk issues
 * for Convex carries no name/email/picture claims, so the identity alone is
 * not enough to build a profile.
 */
async function fetchClerkUser(clerkUserId: string): Promise<ClerkUser> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing CLERK_SECRET_KEY. Set it with `npx convex env set CLERK_SECRET_KEY <key>`.");
  }
  const response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(clerkUserId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!response.ok) {
    throw new ConvexError({ code: "CLERK_USER_FETCH_FAILED", status: response.status });
  }
  return (await response.json()) as ClerkUser;
}

/**
 * Creates or refreshes the caller's user record from their Clerk profile.
 * New users are always students; admins are promoted out of band.
 */
export const store = action({
  args: {},
  returns: v.id("users"),
  handler: async (ctx): Promise<Id<"users">> => {
    const identity = await requireIdentity(ctx);
    const clerkUser = await fetchClerkUser(identity.subject);

    const email =
      clerkUser.email_addresses.find((e) => e.id === clerkUser.primary_email_address_id)?.email_address ??
      clerkUser.email_addresses[0]?.email_address;
    const fullName = [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ").trim();

    return await ctx.runMutation(internal.users.upsert, {
      tokenIdentifier: identity.tokenIdentifier,
      clerkUserId: identity.subject,
      name: fullName || clerkUser.username || email || "Anonymous",
      email,
      imageUrl: clerkUser.image_url ?? undefined,
    });
  },
});

export const upsert = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    clerkUserId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, { tokenIdentifier, ...profile }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    const searchText = studentSearchText(profile.name, profile.email);

    if (existing !== null) {
      if (
        existing.clerkUserId !== profile.clerkUserId ||
        existing.name !== profile.name ||
        existing.email !== profile.email ||
        existing.imageUrl !== profile.imageUrl ||
        existing.searchText !== searchText
      ) {
        await ctx.db.patch("users", existing._id, { ...profile, searchText });
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier,
      ...profile,
      searchText,
      role: "student",
      enrolledCourseCount: 0,
      totalSpentCents: 0,
    });
  },
});
