"use client";

import { Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { findStudentNavItem } from "@/components/layout/student-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

function StudentPageTitle() {
  const pathname = usePathname();
  return findStudentNavItem(pathname)?.label ?? "Dashboard";
}

/** Reads the profile from Clerk, so it shows right after sign-in, before the Convex record syncs. */
function StudentAccountMenu() {
  const { isLoaded, user } = useUser();
  if (!isLoaded) {
    return <Skeleton className="size-8 rounded-full" />;
  }
  if (!user) {
    return null;
  }
  const email = user.primaryEmailAddress?.emailAddress ?? null;
  return (
    <UserMenu
      name={user.fullName || user.username || email || "Student"}
      email={email}
      imageUrl={user.hasImage ? user.imageUrl : null}
    />
  );
}

export function StudentTopbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-lg supports-backdrop-filter:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      {/* mr-1.5 matches the trigger's built-in icon padding, so the divider sits midway between icon and title. */}
      <Separator orientation="vertical" className="mr-1.5 data-vertical:h-4 data-vertical:self-center" />
      <h1 className="truncate text-sm font-medium">
        {/* usePathname suspends while prerendering dynamic routes. */}
        <Suspense fallback="Dashboard">
          <StudentPageTitle />
        </Suspense>
      </h1>
      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <StudentAccountMenu />
      </div>
    </header>
  );
}
