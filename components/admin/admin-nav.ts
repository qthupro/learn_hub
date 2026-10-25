import {
  BookOpenIcon,
  LayoutDashboardIcon,
  PlusCircleIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

type AdminNavItem = { href: string; label: string; icon: LucideIcon };

export const adminNavGroups: { label: string; items: AdminNavItem[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/courses", label: "Courses", icon: BookOpenIcon },
      { href: "/admin/courses/new", label: "Create course", icon: PlusCircleIcon },
    ],
  },
  {
    label: "People",
    items: [{ href: "/admin/students", label: "Students", icon: UsersIcon }],
  },
  {
    label: "System",
    items: [{ href: "/admin/settings", label: "Settings", icon: SettingsIcon }],
  },
];

/** The nav item for a path: the longest href that matches it or one of its parents. */
export function findAdminNavItem(pathname: string): AdminNavItem | undefined {
  return adminNavGroups
    .flatMap((group) => group.items)
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
