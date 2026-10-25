import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";

export const metadata: Metadata = {
  title: "Settings",
};

export default function AdminSettingsPage() {
  return (
    <AdminGate>
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <AdminPageHeader title="Settings" description="Your site's name, description, logo and favicon." />
        <SiteSettingsForm />
      </div>
    </AdminGate>
  );
}
