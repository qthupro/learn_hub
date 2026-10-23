"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAction, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";

/** Syncs the signed-in user's Convex record on sign-in, account switch, or Clerk profile edits. */
export function useStoreUser() {
  const { isAuthenticated } = useConvexAuth();
  const { user } = useUser();
  const storeUser = useAction(api.users.store);
  const updatedAt = user?.updatedAt?.getTime();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    storeUser({}).catch((error: unknown) => {
      console.error("Failed to store user", error);
    });
  }, [isAuthenticated, storeUser, user?.id, updatedAt]);
}
