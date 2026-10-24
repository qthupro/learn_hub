import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminGate, AdminLoading } from "@/components/admin/admin-gate";
import { CourseOutline } from "@/components/admin/course-outline";

export const metadata: Metadata = {
  title: "Course content",
};

export default function AdminCourseContentPage({ params }: PageProps<"/admin/courses/[courseId]/content">) {
  return (
    <AdminGate>
      <div className="mx-auto max-w-5xl">
        {/* The course id is only known at request time. */}
        <Suspense fallback={<AdminLoading className="min-h-64" />}>
          <CourseOutline params={params} />
        </Suspense>
      </div>
    </AdminGate>
  );
}
