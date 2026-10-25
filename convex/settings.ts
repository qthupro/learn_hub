import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import {
  defaultSiteSettings,
  invalidSiteSetting,
  siteImageError,
  siteSettingsFieldError,
} from "./lib/validators";

const siteSettingsValidator = v.object({
  siteName: v.string(),
  description: v.string(),
  logoUrl: v.union(v.string(), v.null()),
  faviconUrl: v.union(v.string(), v.null()),
});

/** The public site settings: name, description and image URLs. Anyone can read them. */
export const get = query({
  args: {},
  returns: siteSettingsValidator,
  handler: async (ctx) => {
    const row = await ctx.db.query("siteSettings").first();
    return {
      siteName: row?.siteName ?? defaultSiteSettings.siteName,
      description: row?.description ?? defaultSiteSettings.description,
      logoUrl: row?.logoId ? await ctx.storage.getUrl(row.logoId) : null,
      faviconUrl: row?.faviconId ? await ctx.storage.getUrl(row.faviconId) : null,
    };
  },
});

/** A one-time URL to upload a logo or favicon to. Admin only. */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Checks an uploaded file is an accepted image type within the size limit for its slot. */
async function assertSiteImage(ctx: MutationCtx, kind: "logo" | "favicon", storageId: Id<"_storage">) {
  const file = await ctx.db.system.get("_storage", storageId);
  if (file === null) {
    invalidSiteSetting(kind, "The uploaded image was not found. Please upload it again.");
  }
  const error = siteImageError(kind, { type: file.contentType ?? "", size: file.size });
  if (error !== null) {
    invalidSiteSetting(kind, error);
  }
}

// For each image: omit to keep the current one, null to remove it, or a new upload to replace it.
const imageChange = v.optional(v.union(v.id("_storage"), v.null()));

/** Saves the site settings. Replaced or removed images are deleted from storage. Admin only. */
export const update = mutation({
  args: { siteName: v.string(), description: v.string(), logoId: imageChange, faviconId: imageChange },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const siteName = args.siteName.trim();
    const description = args.description.trim();
    for (const [field, value] of [["siteName", siteName], ["description", description]] as const) {
      const error = siteSettingsFieldError(field, value);
      if (error !== null) {
        invalidSiteSetting(field, error);
      }
    }
    if (args.logoId) {
      await assertSiteImage(ctx, "logo", args.logoId);
    }
    if (args.faviconId) {
      await assertSiteImage(ctx, "favicon", args.faviconId);
    }

    const row = await ctx.db.query("siteSettings").first();
    // undefined keeps the current image; null removes it.
    const logoId = args.logoId === undefined ? row?.logoId : (args.logoId ?? undefined);
    const faviconId = args.faviconId === undefined ? row?.faviconId : (args.faviconId ?? undefined);
    for (const [previous, next] of [[row?.logoId, logoId], [row?.faviconId, faviconId]] as const) {
      if (previous !== undefined && previous !== next) {
        await ctx.storage.delete(previous);
      }
    }

    const fields = {
      siteName,
      // An empty description falls back to the default rather than leaving pages without one.
      description: description || defaultSiteSettings.description,
      logoId,
      faviconId,
      updatedAt: Date.now(),
      updatedBy: admin._id,
    };
    if (row === null) {
      await ctx.db.insert("siteSettings", fields);
    } else {
      await ctx.db.replace("siteSettings", row._id, fields);
    }
    return null;
  },
});
