import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DashboardStats } from "@/components/admin/dashboard-stats";

export const metadata: Metadata = {
  // The layout's title template only applies to child segments, not this page.
  title: "Dashboard · LearnHub Admin",
};

export default function AdminDashboardPage() {
  return (
    <AdminGate>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <AdminPageHeader title="Dashboard" description="An overview of courses, students and revenue." />
        <DashboardStats />
      </div>
    </AdminGate>
  );
}
