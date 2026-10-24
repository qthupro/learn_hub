import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CoursesTable } from "@/components/admin/courses-table";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Courses",
};

export default function AdminCoursesPage() {
  return (
    <AdminGate>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <AdminPageHeader
          title="Courses"
          description="Browse, publish and organize every course on the platform."
          action={
            <Button nativeButton={false} render={<Link href="/admin/courses/new" />}>
              <PlusIcon data-icon="inline-start" />
              New course
            </Button>
          }
        />
        <CoursesTable />
      </div>
    </AdminGate>
  );
}
