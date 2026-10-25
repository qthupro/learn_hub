"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { BookOpenIcon, DollarSignIcon, ShoppingBagIcon, UsersIcon, type LucideIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

type Totals = FunctionReturnType<typeof api.admin.dashboardStats>;

type Stat = {
  label: string;
  value: (totals: Totals) => string;
  icon: LucideIcon;
  /** Solid background and text colors, darker in dark mode so they don't glare. */
  colorClassName: string;
};

const stats: Stat[] = [
  {
    label: "Total courses",
    value: (totals) => formatNumber(totals.courses),
    icon: BookOpenIcon,
    colorClassName: "bg-indigo-600 text-white dark:bg-indigo-700",
  },
  {
    label: "Total students",
    value: (totals) => formatNumber(totals.students),
    icon: UsersIcon,
    colorClassName: "bg-sky-700 text-white dark:bg-sky-800",
  },
  {
    label: "Total revenue",
    value: (totals) => formatUsd(totals.revenueCents),
    icon: DollarSignIcon,
    colorClassName: "bg-emerald-700 text-white dark:bg-emerald-800",
  },
  {
    // Amber is too light for white text, so it takes dark text instead.
    label: "Courses sold",
    value: (totals) => formatNumber(totals.coursesSold),
    icon: ShoppingBagIcon,
    colorClassName: "bg-amber-400 text-amber-950 dark:bg-amber-600",
  },
];

/** Live totals from Convex. Render only for admins (inside AdminGate); the query requires it. */
export function DashboardStats() {
  const totals = useQuery(api.admin.dashboardStats);

  return (
    // Columns follow the available width, not the viewport, so the sidebar's state is accounted for.
    <div className="@container">
      <dl className="grid grid-cols-1 gap-4 @md:grid-cols-2 @4xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, colorClassName }) => (
          <div
            key={label}
            className={cn(
              "flex flex-col gap-4 rounded-xl p-5 shadow-sm ring-1 ring-black/5 dark:ring-white/10",
              colorClassName,
            )}
          >
            <span className="grid size-10 place-items-center rounded-lg bg-current/15">
              <Icon aria-hidden className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              {/* dt must precede dd in the markup; order-last puts the label under the value. */}
              <dt className="order-last text-sm font-medium opacity-85">{label}</dt>
              <dd className="text-3xl font-semibold tracking-heading tabular-nums">
                {totals === undefined ? (
                  // Same height as the number, so the cards don't jump when it loads.
                  <Skeleton className="h-9 w-24 bg-current/15" />
                ) : (
                  value(totals)
                )}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
