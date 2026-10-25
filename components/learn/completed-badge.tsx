import { CircleCheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Shown once a student has completed every lesson in a course. */
export function CompletedBadge({ className }: { className?: string }) {
  return (
    <Badge className={cn("bg-brand text-brand-foreground", className)}>
      <CircleCheckIcon data-icon="inline-start" />
      Completed
    </Badge>
  );
}
