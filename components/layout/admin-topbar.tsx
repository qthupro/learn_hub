"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { findAdminNavItem } from "@/components/admin/admin-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdmin } from "@/hooks/use-admin";

function AdminPageTitle() {
  const pathname = usePathname();
  return findAdminNavItem(pathname)?.label ?? "Admin";
}

export function AdminTopbar() {
  const admin = useAdmin();

  return (
    // Outside the scrolling content area, so it stays put without being sticky.
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      {/* mr-1.5 matches the trigger's built-in icon padding, so the divider sits midway between icon and title. */}
      <Separator orientation="vertical" className="mr-1.5 data-vertical:h-4 data-vertical:self-center" />
      <h1 className="truncate text-sm font-medium">
        {/* usePathname suspends while prerendering dynamic routes such as a course's edit page. */}
        <Suspense fallback="Admin">
          <AdminPageTitle />
        </Suspense>
      </h1>
      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        {admin === undefined ? (
          <Skeleton className="size-8 rounded-full" />
        ) : admin ? (
          <UserMenu {...admin} />
        ) : null}
      </div>
    </header>
  );
}
