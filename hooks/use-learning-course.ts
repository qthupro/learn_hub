"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * The course outline and the viewer's progress for the learning page; null when the viewer can't
 * watch it, undefined while loading. Waits for auth so a signed-in student never sees a false "no access".
 */
export function useLearningCourse(slug: string) {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.progress.courseForLearning, isAuthenticated ? { slug } : "skip");
}
