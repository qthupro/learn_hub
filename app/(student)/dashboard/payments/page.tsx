import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PaymentHistory } from "@/components/checkout/payment-history";

export const metadata: Metadata = {
  title: "Payment history",
};

export default function PaymentHistoryPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <AdminPageHeader title="Payment history" description="Courses you bought, with what you paid." />
      <PaymentHistory />
    </div>
  );
}
