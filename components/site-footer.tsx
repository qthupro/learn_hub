import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const columns = [
  {
    title: "Learn",
    links: [
      { href: "/#courses", label: "All courses" },
      { href: "/#categories", label: "Categories" },
      { href: "/#testimonials", label: "Reviews" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#benefits", label: "Why LearnHub" },
      { href: "/#faq", label: "FAQ" },
      { href: "/sign-up", label: "Create account" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
          <div className="max-w-xs space-y-4">
            <Logo />
            <p className="text-sm/relaxed text-muted-foreground">
              Expert-led video courses you pay for once and keep forever. No subscriptions.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title} className="space-y-3">
              <p className="text-sm font-semibold">{column.title}</p>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col-reverse items-start justify-between gap-4 border-t pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            © LearnHub. All rights reserved.
          </p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
