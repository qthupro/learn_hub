import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-heading">{title}</h2>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
