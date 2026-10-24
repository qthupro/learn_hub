import type { ReactNode } from "react";
import { ConstructionIcon } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

/** Stand-in for admin sections that are not built yet. */
export function AdminPlaceholder({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <AdminPageHeader title={title} description={description} />
      {children}
      <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        <ConstructionIcon className="size-5" />
        Coming soon
      </div>
    </div>
  );
}
