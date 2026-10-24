"use client";

import Link from "next/link";
import { useAdmin } from "@/hooks/use-admin";

/** Renders a link to /admin for admins only; hidden while loading and for everyone else. */
export function AdminNavLink({ className, onClick }: { className: string; onClick?: () => void }) {
  const admin = useAdmin();
  if (!admin) {
    return null;
  }
  return (
    <Link href="/admin" onClick={onClick} className={className}>
      Admin
    </Link>
  );
}
