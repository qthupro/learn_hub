import { InfinityIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function LifetimeAccessNote({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs font-medium text-brand", className)}>
      <InfinityIcon aria-hidden className="size-4" />
      Buy Once, Learn Forever
    </p>
  );
}
