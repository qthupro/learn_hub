import { BookOpenIcon, DollarSignIcon, ShoppingBagIcon, UsersIcon, type LucideIcon } from "lucide-react";
import { formatNumber, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

// Placeholder figures until the courses, enrollments and payments tables land.
const placeholderStats = {
  totalCourses: 24,
  totalStudents: 1284,
  totalRevenueCents: 4825000,
  coursesSold: 963,
};

type Stat = {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Solid background and text colors, darker in dark mode so they don't glare. */
  colorClassName: string;
};

const stats: Stat[] = [
  {
    label: "Total courses",
    value: formatNumber(placeholderStats.totalCourses),
    icon: BookOpenIcon,
    colorClassName: "bg-indigo-600 text-white dark:bg-indigo-700",
  },
  {
    label: "Total students",
    value: formatNumber(placeholderStats.totalStudents),
    icon: UsersIcon,
    colorClassName: "bg-sky-700 text-white dark:bg-sky-800",
  },
  {
    label: "Total revenue",
    value: formatUsd(placeholderStats.totalRevenueCents),
    icon: DollarSignIcon,
    colorClassName: "bg-emerald-700 text-white dark:bg-emerald-800",
  },
  {
    // Amber is too light for white text, so it takes dark text instead.
    label: "Courses sold",
    value: formatNumber(placeholderStats.coursesSold),
    icon: ShoppingBagIcon,
    colorClassName: "bg-amber-400 text-amber-950 dark:bg-amber-600",
  },
];

export function DashboardStats() {
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
              <dd className="text-3xl font-semibold tracking-heading tabular-nums">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
