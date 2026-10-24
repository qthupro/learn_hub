"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/hooks/use-admin";

export function AdminLoading({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" role="status">
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}

/**
 * Wraps each admin page's content. Shows it only once Convex confirms the
 * admin role; signed-out users and non-admins are sent home. This is UI only:
 * every admin Convex function must still call requireAdmin.
 *
 * The guard lives in pages, not the admin layout, because a layout that skips
 * `{children}` drops the page from prerendering and breaks instant-navigation
 * validation.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const admin = useAdmin();
  const denied = admin === null;

  useEffect(() => {
    if (denied) {
      router.replace("/");
    }
  }, [denied, router]);

  if (!admin) {
    return <AdminLoading className="min-h-64" />;
  }
  return children;
}
