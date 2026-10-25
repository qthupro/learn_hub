import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** A dashed placeholder for a list with nothing in it yet, with an optional next step. */
export function EmptyState({ icon: Icon, children, action }: { icon: LucideIcon; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
      <Icon className="size-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{children}</p>
      {action}
    </div>
  );
}
