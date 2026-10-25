"use client";

import Image from "next/image";
import Link from "next/link";
import { GraduationCapIcon } from "lucide-react";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import { cn } from "@/lib/utils";

/** The site's logo and name from the admin Settings page; the default mark when no logo is set. */
export function Logo({ className, labelClassName }: { className?: string; labelClassName?: string }) {
  const { siteName, logoUrl } = useSiteSettings();

  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 rounded-md text-[1.0625rem] font-bold tracking-heading outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      {logoUrl ? (
        // Logos come in any shape: fixed height, natural width up to a cap.
        <Image src={logoUrl} alt="" width={112} height={28} className="h-7 w-auto max-w-28 shrink-0 object-contain" />
      ) : (
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand text-brand-foreground">
          <GraduationCapIcon aria-hidden className="size-4" />
        </span>
      )}
      <span className={labelClassName}>{siteName}</span>
    </Link>
  );
}
