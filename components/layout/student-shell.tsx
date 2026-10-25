"use client";

import type { ReactNode } from "react";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { StudentTopbar } from "@/components/layout/student-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

/** Student app shell. Sign-in is enforced by proxy.ts; Convex enforces data access. */
export function StudentShell({ defaultOpen, children }: { defaultOpen: boolean; children: ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <StudentSidebar />
        <SidebarInset>
          <StudentTopbar />
          <div className="flex-1 p-4 sm:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
