import { Suspense } from "react";
import { cookies } from "next/headers";
import { AdminLoading } from "@/components/admin/admin-gate";
import { StudentShell } from "@/components/layout/student-shell";

async function StudentShellWithSidebarState({ children }: { children: React.ReactNode }) {
  // Written by the shadcn sidebar when it is toggled.
  const sidebarState = (await cookies()).get("sidebar_state")?.value;
  return <StudentShell defaultOpen={sidebarState !== "false"}>{children}</StudentShell>;
}

export default function StudentLayout({ children }: LayoutProps<"/">) {
  return (
    // Reading cookies is request-time data, so it streams in under Suspense.
    <Suspense fallback={<AdminLoading className="min-h-svh" />}>
      <StudentShellWithSidebarState>{children}</StudentShellWithSidebarState>
    </Suspense>
  );
}
