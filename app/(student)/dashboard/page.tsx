import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EnrolledCourses } from "@/components/learn/enrolled-courses";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function StudentDashboardPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <AdminPageHeader title="Dashboard" description="Pick up where you left off and track your progress." />
      <EnrolledCourses />
    </div>
  );
}
