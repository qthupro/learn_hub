"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const VISITOR_KEY = "learnhub_visitor_id";

let fallbackVisitorId: string | null = null;

/**
 * A random id for this browser, kept in localStorage so a visitor counts once per page per day.
 * It identifies nothing about the person. Without storage (private mode, blocked site data) it
 * lasts for this page load only.
 */
function visitorId() {
  try {
    const stored = localStorage.getItem(VISITOR_KEY);
    if (stored) {
      return stored;
    }
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    fallbackVisitorId ??= crypto.randomUUID();
    return fallbackVisitorId;
  }
}

/** Records a visit whenever the page changes. Convex dedupes per visitor, page and day. */
export function PageViewTracker() {
  const pathname = usePathname();
  const record = useMutation(api.visits.record);

  useEffect(() => {
    record({ path: pathname, visitorId: visitorId() }).catch((error: unknown) => {
      console.error("Failed to record page visit", error);
    });
  }, [pathname, record]);

  return null;
}
