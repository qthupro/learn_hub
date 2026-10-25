import { CompassIcon, HistoryIcon, LayoutDashboardIcon, ReceiptIcon, type LucideIcon } from "lucide-react";

type StudentNavItem = { href: string; label: string; icon: LucideIcon };

export const studentNavItems: StudentNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/dashboard/learning", label: "Learning history", icon: HistoryIcon },
  { href: "/dashboard/payments", label: "Payment history", icon: ReceiptIcon },
  { href: "/#courses", label: "Browse courses", icon: CompassIcon },
];

/** The nav item for a path: the longest href that matches it or one of its parents. */
export function findStudentNavItem(pathname: string): StudentNavItem | undefined {
  return studentNavItems
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
