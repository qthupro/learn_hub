"use server";

import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { updateTag } from "next/cache";
import { api } from "@/convex/_generated/api";
import { SITE_SETTINGS_TAG } from "@/lib/site-settings";

/**
 * The caller's Convex token, fetched the way ConvexProviderWithClerk does: Clerk's native Convex
 * integration issues session tokens with `aud: "convex"` and has no "convex" JWT template, and
 * asking for a missing template throws. Null when signed out or the token can't be had.
 */
async function convexToken() {
  const { sessionClaims, getToken } = await auth();
  try {
    return sessionClaims?.aud === "convex" ? await getToken() : await getToken({ template: "convex" });
  } catch (error) {
    console.error("Couldn't get a Convex token for the site settings refresh", error);
    return null;
  }
}

/**
 * Expires the server's cached site settings after an admin saves them, so server-rendered metadata
 * and the favicon change on the next request. Convex already saved the change; this only clears
 * the cache, and does nothing unless Convex confirms the caller is an admin. Returns whether the
 * cache was cleared.
 */
export async function refreshSiteSettings(): Promise<boolean> {
  const token = await convexToken();
  if (!token) {
    return false;
  }
  const admin = await fetchQuery(api.admin.viewer, {}, { token });
  if (admin === null) {
    return false;
  }
  updateTag(SITE_SETTINGS_TAG);
  return true;
}
