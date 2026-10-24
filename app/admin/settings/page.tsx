import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata: Metadata = {
  title: "Settings",
};

export default function AdminSettingsPage() {
  return (
    <AdminGate>
      <AdminPlaceholder title="Settings" description="Configure platform-wide options." />
    </AdminGate>
  );
}
