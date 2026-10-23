"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";

/** Shows whether Convex sees the caller as signed in, and their stored user record. */
export function ConvexAuthStatus() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");

  if (isLoading) {
    return <Badge variant="outline">Convex: checking…</Badge>;
  }
  if (!isAuthenticated) {
    return <Badge variant="secondary">Convex: signed out</Badge>;
  }
  if (!user) {
    return <Badge className="bg-info text-info-foreground">Convex: syncing user…</Badge>;
  }
  return (
    <Badge className="bg-success text-success-foreground">
      Convex: {user.name} ({user.role})
    </Badge>
  );
}
