"use client";

import { useSiteSettings } from "@/components/providers/site-settings-provider";

/** Text with "{siteName}" replaced by the site name from the admin Settings page. */
export function SiteText({ text }: { text: string }) {
  const { siteName } = useSiteSettings();
  return text.replaceAll("{siteName}", siteName);
}

/** The site description from the admin Settings page. */
export function SiteDescription() {
  return useSiteSettings().description;
}
