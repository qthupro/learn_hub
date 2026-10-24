import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CreateCourseForm } from "@/components/admin/course-form";

export const metadata: Metadata = {
  title: "Create course",
};

export default function AdminCreateCoursePage() {
  return (
    <AdminGate>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <AdminPageHeader title="Create course" description="Set up a new course with its details, price and thumbnail." />
        <CreateCourseForm />
      </div>
    </AdminGate>
  );
}
