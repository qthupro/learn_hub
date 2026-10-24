"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowLeftIcon, LayersIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { AdminLoading } from "@/components/admin/admin-gate";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CourseForm } from "@/components/admin/course-form";
import { Button } from "@/components/ui/button";

export function EditCourse({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const course = useQuery(api.courses.getForAdmin, { courseId });

  if (course === undefined) {
    return <AdminLoading className="min-h-64" />;
  }

  if (course === null) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
        <p className="font-medium">Course not found</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/courses" />}>
          <ArrowLeftIcon data-icon="inline-start" />
          Back to courses
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Edit course"
        description={course.title}
        action={
          <Button variant="outline" nativeButton={false} render={<Link href={`/admin/courses/${course._id}/content`} />}>
            <LayersIcon data-icon="inline-start" />
            Manage content
          </Button>
        }
      />
      {/* Keyed so switching courses resets the form state. */}
      <CourseForm key={course._id} course={course} />
    </div>
  );
}
