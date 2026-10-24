import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminGate, AdminLoading } from "@/components/admin/admin-gate";
import { EditCourse } from "@/components/admin/edit-course";

export const metadata: Metadata = {
  title: "Edit course",
};

export default function AdminEditCoursePage({ params }: PageProps<"/admin/courses/[courseId]/edit">) {
  return (
    <AdminGate>
      <div className="mx-auto max-w-6xl">
        {/* The course id is only known at request time. */}
        <Suspense fallback={<AdminLoading className="min-h-64" />}>
          <EditCourse params={params} />
        </Suspense>
      </div>
    </AdminGate>
  );
}
