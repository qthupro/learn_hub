import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-gate";
import { LearnShell } from "@/components/learn/learn-shell";

export default function LearnLayout({ children, params }: LayoutProps<"/learn/[slug]">) {
  return (
    // The slug is only known at request time.
    <Suspense fallback={<AdminLoading className="min-h-svh" />}>
      <LearnShell params={params}>{children}</LearnShell>
    </Suspense>
  );
}
