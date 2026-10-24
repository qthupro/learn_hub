import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata: Metadata = {
  title: "Lessons",
};

export default function AdminLessonsPage() {
  return (
    <AdminGate>
      <AdminPlaceholder title="Lessons" description="Manage chapters, lessons and their videos across courses." />
    </AdminGate>
  );
}
