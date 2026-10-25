"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { SiteSettings } from "@/lib/site-settings";

const SiteSettingsContext = createContext<SiteSettings | null>(null);

const DEFAULT_FAVICON = "/favicon.ico";

/** The title with a stale site name swapped for the current one, in each form the layouts use. */
function retitle(title: string, from: string, to: string) {
  if (from === to) {
    return title;
  }
  if (title === from) {
    return to;
  }
  for (const suffix of [` · ${from} Admin`, ` · ${from}`]) {
    if (title.endsWith(suffix)) {
      return title.slice(0, -suffix.length) + suffix.replace(from, to);
    }
  }
  return title;
}

/**
 * Keeps the tab's favicon and title in step with the live settings. The server renders them from a
 * cached copy, and pages already loaded in the browser's router keep whatever they were rendered
 * with, so after a save they can lag. Watching <head> re-applies the live values whenever a
 * navigation writes the old ones back.
 */
function SyncDocumentHead({ settings, serverSiteName }: { settings: SiteSettings; serverSiteName: string }) {
  const favicon = settings.faviconUrl ?? DEFAULT_FAVICON;
  const { siteName } = settings;

  useEffect(() => {
    function sync() {
      const icons = document.head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]');
      if (icons.length === 0) {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = favicon;
        document.head.appendChild(link);
      }
      for (const icon of icons) {
        if (icon.getAttribute("href") !== favicon) {
          icon.setAttribute("href", favicon);
        }
      }
      const title = retitle(document.title, serverSiteName, siteName);
      if (title !== document.title) {
        document.title = title;
      }
    }

    sync();
    // Writes made by sync() match on the next pass, so this settles instead of looping.
    const observer = new MutationObserver(sync);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["href"],
    });
    return () => observer.disconnect();
  }, [favicon, siteName, serverSiteName]);

  return null;
}

/**
 * Serves the site settings to client components: the server's cached copy for the first render,
 * then the live Convex query, so a save shows up at once in every open tab, including the favicon
 * and title.
 */
export function SiteSettingsProvider({ initial, children }: { initial: SiteSettings; children: ReactNode }) {
  const live = useQuery(api.settings.get);
  const settings = live ?? initial;
  return (
    <SiteSettingsContext.Provider value={settings}>
      <SyncDocumentHead settings={settings} serverSiteName={initial.siteName} />
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  const settings = useContext(SiteSettingsContext);
  if (settings === null) {
    throw new Error("useSiteSettings must be used inside SiteSettingsProvider");
  }
  return settings;
}
