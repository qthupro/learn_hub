import type { Metadata } from "next";
import { CheckoutSuccess } from "@/components/courses/checkout-success";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Payment received" };

export default async function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const { session_id } = await searchParams;
  return (
    <>
      <main className="flex-1">
        <CheckoutSuccess sessionId={typeof session_id === "string" ? session_id : null} />
      </main>
      <SiteFooter />
    </>
  );
}
