"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavGroups, findAdminNavItem } from "@/components/admin/admin-nav";
import { Logo } from "@/components/logo";
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

/** The nav groups, with `activeHref` highlighted when known. */
function AdminNavGroups({ activeHref }: { activeHref?: string }) {
  const { isMobile, setOpenMobile } = useSidebar();

  return adminNavGroups.map((group) => (
    <SidebarGroup key={group.label}>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map(({ href, label, icon: Icon }) => (
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
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}

function ActiveAdminNavGroups() {
  const pathname = usePathname();
  return <AdminNavGroups activeHref={findAdminNavItem(pathname)?.href} />;
}

export function AdminSidebar() {
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
        {/* usePathname suspends while prerendering dynamic routes such as a course's edit page. */}
        <Suspense fallback={<AdminNavGroups />}>
          <ActiveAdminNavGroups />
        </Suspense>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
