"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { findStudentNavItem, studentNavItems } from "@/components/layout/student-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

/** The nav menu, with `activeHref` highlighted when known. */
function StudentNavMenu({ activeHref }: { activeHref?: string }) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {studentNavItems.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton
            isActive={href === activeHref}
            tooltip={label}
            render={
              <Link
                href={href}
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
              />
            }
          >
            <Icon />
            <span>{label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function ActiveStudentNavMenu() {
  const pathname = usePathname();
  return <StudentNavMenu activeHref={findStudentNavItem(pathname)?.href} />;
}

export function StudentSidebar() {
  return (
    <Sidebar collapsible="icon">
      {/* Same height as the top bar so their bottom borders line up. */}
      <SidebarHeader className="h-14 justify-center border-b">
        {/* In icon mode only the mark remains, centered over the menu icons. */}
        <Logo
          className="overflow-hidden whitespace-nowrap group-data-[collapsible=icon]:justify-center"
          labelClassName="group-data-[collapsible=icon]:sr-only"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Learning</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* usePathname suspends while prerendering dynamic routes. */}
            <Suspense fallback={<StudentNavMenu />}>
              <ActiveStudentNavMenu />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
