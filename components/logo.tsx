import Link from "next/link";
import { GraduationCapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, labelClassName }: { className?: string; labelClassName?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 rounded-md text-[1.0625rem] font-bold tracking-heading outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand text-brand-foreground">
        <GraduationCapIcon aria-hidden className="size-4" />
      </span>
      <span className={labelClassName}>LearnHub</span>
    </Link>
  );
}
