"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ReceiptIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatUsd } from "@/lib/format";

function PaymentTable({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Course</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

/** The viewer's paid checkouts, newest first. Convex returns only their own. */
export function PaymentHistory() {
  const payments = useQuery(api.enrollments.myPayments);

  if (payments === undefined) {
    return (
      <PaymentTable>
        {Array.from({ length: 3 }, (_, i) => (
          <TableRow key={i} aria-hidden>
            <TableCell className="pl-4">
              <Skeleton className="h-4 w-48" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-12 rounded-full" />
            </TableCell>
            <TableCell className="pr-4">
              <Skeleton className="ml-auto h-4 w-14" />
            </TableCell>
          </TableRow>
        ))}
      </PaymentTable>
    );
  }
  if (payments.length === 0) {
    return (
      <EmptyState
        icon={ReceiptIcon}
        action={
          <Button nativeButton={false} render={<Link href="/#courses" />}>
            Browse courses
          </Button>
        }
      >
        You haven&apos;t bought any courses yet. Free enrollments don&apos;t appear here.
      </EmptyState>
    );
  }
  return (
    <PaymentTable>
      {payments.map((payment) => (
        <TableRow key={payment._id}>
          <TableCell className="max-w-72 truncate pl-4 font-medium">
            {payment.courseSlug ? (
              <Link href={`/courses/${payment.courseSlug}`} className="underline-offset-4 hover:underline">
                {payment.courseTitle}
              </Link>
            ) : (
              payment.courseTitle
            )}
          </TableCell>
          <TableCell className="text-muted-foreground">
            <time dateTime={new Date(payment.paidAt).toISOString()}>{formatDateTime(payment.paidAt)}</time>
          </TableCell>
          <TableCell>
            <Badge variant="secondary">Paid</Badge>
          </TableCell>
          <TableCell className="pr-4 text-right tabular-nums">{formatUsd(payment.amountCents)}</TableCell>
        </TableRow>
      ))}
    </PaymentTable>
  );
}
