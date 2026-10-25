"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { ArrowLeftIcon, ArrowRightIcon, LoaderCircleIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Eyebrow } from "@/components/landing/section";
import { Button } from "@/components/ui/button";

const buttonClass = "mt-10 h-13 rounded-full bg-brand px-7 text-base font-bold text-brand-foreground hover:bg-brand/85";

/**
 * Shown after Stripe Checkout. It never enrolls anyone itself: it waits, live, for the verified
 * webhook to record the enrollment.
 */
export function CheckoutSuccess({ sessionId }: { sessionId: string | null }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const checkout = useQuery(
    api.enrollments.checkoutStatus,
    sessionId !== null && isAuthenticated ? { stripeSessionId: sessionId } : "skip",
  );

  if (sessionId !== null && (isLoading || (isAuthenticated && checkout === undefined))) {
    return <Message eyebrow="Checkout" title="Checking your payment…" pending />;
  }
  if (checkout == null) {
    return (
      <Message
        eyebrow="Checkout"
        title="We couldn't find this checkout."
        description="Make sure you're signed in with the account you paid with. If you were charged, your enrollment will appear on the course page shortly."
      >
        <Button size="lg" className={buttonClass} nativeButton={false} render={<Link href="/#courses" />}>
          <ArrowLeftIcon data-icon="inline-start" />
          Browse courses
        </Button>
      </Message>
    );
  }
  if (checkout.status === "pending") {
    return (
      <Message
        eyebrow="Payment received"
        title="Confirming your enrollment…"
        description={`We're waiting for Stripe to confirm your payment for ${checkout.courseTitle}. This page updates on its own, usually within a few seconds.`}
        pending
      />
    );
  }
  return (
    <Message eyebrow="You're in" title={`Welcome to ${checkout.courseTitle}.`} description="Your enrollment is confirmed.">
      <Button
        size="lg"
        className={buttonClass}
        nativeButton={false}
        render={<Link href={`/courses/${checkout.courseSlug}`} />}
      >
        Go to course
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
    </Message>
  );
}

/** Shown while the page reads the session ID from the URL at request time. */
export function CheckoutSuccessSkeleton() {
  return <Message eyebrow="Checkout" title="Checking your payment…" pending />;
}

function Message({
  eyebrow,
  title,
  description,
  pending = false,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  pending?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8" aria-live="polite">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-8 flex max-w-3xl items-center gap-4 text-5xl leading-[0.92] font-black tracking-[-0.05em] sm:text-7xl">
        {title}
        {pending ? <LoaderCircleIcon aria-hidden className="size-10 shrink-0 animate-spin" /> : null}
      </h1>
      {description ? <p className="mt-6 max-w-xl text-lg/relaxed font-medium opacity-80">{description}</p> : null}
      {children}
    </div>
  );
}
