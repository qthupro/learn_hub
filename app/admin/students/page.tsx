import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata: Metadata = {
  title: "Students",
};

export default function AdminStudentsPage() {
  return (
    <AdminGate>
      <AdminPlaceholder title="Students" description="See who is enrolled and how far they have progressed." />
    </AdminGate>
  );
}
