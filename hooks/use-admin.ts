"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * The signed-in admin's profile, null for signed-out users and non-admins,
 * or undefined while still loading. For UI only; Convex enforces access.
 */
export function useAdmin() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const admin = useQuery(api.admin.viewer, isAuthenticated ? {} : "skip");
  if (!isLoading && !isAuthenticated) {
    return null;
  }
  return admin;
}
