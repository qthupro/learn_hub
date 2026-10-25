import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckoutSuccess, CheckoutSuccessSkeleton } from "@/components/courses/checkout-success";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Payment received" };

async function CheckoutSuccessLoader({ searchParams }: Pick<PageProps<"/checkout/success">, "searchParams">) {
  const { session_id } = await searchParams;
  return <CheckoutSuccess sessionId={typeof session_id === "string" ? session_id : null} />;
}

export default function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <>
      <main className="flex-1">
        {/* The session ID is only known at request time. */}
        <Suspense fallback={<CheckoutSuccessSkeleton />}>
          <CheckoutSuccessLoader searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
