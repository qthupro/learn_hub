import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StudentsTable } from "@/components/admin/students-table";

export const metadata: Metadata = {
  title: "Students",
};

export default function AdminStudentsPage() {
  return (
    <AdminGate>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <AdminPageHeader title="Students" description="See who is enrolled and how far they have progressed." />
        <StudentsTable />
      </div>
    </AdminGate>
  );
}
