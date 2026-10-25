/** Landing page anchors; absolute so they also work from other routes. Render labels with SiteText. */
export const siteNavLinks = [
  { href: "/#courses", label: "Courses" },
  { href: "/#categories", label: "Categories" },
  { href: "/#benefits", label: "Why {siteName}" },
  { href: "/#testimonials", label: "Reviews" },
  { href: "/#faq", label: "FAQ" },
] as const;
