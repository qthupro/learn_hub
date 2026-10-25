import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLoading } from "@/components/admin/admin-gate";
import { AdminShell } from "@/components/layout/admin-shell";
import { getSiteSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteSettings();
  return { title: { template: `%s · ${siteName} Admin`, default: `${siteName} Admin` } };
}

async function AdminShellWithSidebarState({ children }: { children: React.ReactNode }) {
  // Written by the shadcn sidebar when it is toggled.
  const sidebarState = (await cookies()).get("sidebar_state")?.value;
  return <AdminShell defaultOpen={sidebarState !== "false"}>{children}</AdminShell>;
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    // Reading cookies is request-time data, so it streams in under Suspense.
    <Suspense fallback={<AdminLoading className="min-h-svh" />}>
      <AdminShellWithSidebarState>{children}</AdminShellWithSidebarState>
    </Suspense>
  );
}
