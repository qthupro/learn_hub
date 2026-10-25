import { cacheLife, cacheTag } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";

// Server only: it reads Convex from the Next.js server for metadata and the first render.

export type SiteSettings = FunctionReturnType<typeof api.settings.get>;

export const SITE_SETTINGS_TAG = "site-settings";

/**
 * The site settings, cached on the server so metadata and the favicon don't hit Convex on every
 * request. Saving on the admin Settings page expires the tag at once; the hourly life is a safety
 * net for edits made elsewhere, e.g. in the Convex dashboard.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(SITE_SETTINGS_TAG);
  cacheLife("hours");
  return await fetchQuery(api.settings.get, {});
}
