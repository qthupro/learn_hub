"use client";

import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

/** Admin app shell. Always renders `children`; each page guards itself with AdminGate. */
export function AdminShell({ defaultOpen, children }: { defaultOpen: boolean; children: ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AdminSidebar />
        <SidebarInset>
          <AdminTopbar />
          <div className="flex-1 p-4 sm:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
