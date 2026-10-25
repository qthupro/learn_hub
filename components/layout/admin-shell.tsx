"use client";

import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Admin app shell. Always renders `children`; each page guards itself with AdminGate.
 *
 * Exactly one viewport tall: the sidebar and topbar stay put and only the content area scrolls.
 * dvh tracks mobile browser bars, so no gap opens below the shell when the address bar hides.
 */
export function AdminShell({ defaultOpen, children }: { defaultOpen: boolean; children: ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen} className="h-dvh min-h-0 overflow-hidden">
        <AdminSidebar />
        <SidebarInset className="min-h-0 overflow-hidden">
          <AdminTopbar />
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
