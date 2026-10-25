import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { SiteSettingsProvider } from "@/components/providers/site-settings-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getSiteSettings } from "@/lib/site-settings";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  // Optical sizing keeps small text open and large headings tight.
  axes: ["opsz"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Site name, description and favicon come from the admin Settings page. */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    // Pages set just their own name, e.g. "Dashboard"; the site name is appended here.
    title: { template: `%s · ${settings.siteName}`, default: settings.siteName },
    description: settings.description,
    // The default lives in public/ rather than app/, so the file convention doesn't add a second icon.
    icons: { icon: settings.faviconUrl ?? "/favicon.ico" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Cached, so this doesn't block prerendering; see lib/site-settings.ts.
  const settings = await getSiteSettings();

  return (
    <html
      lang="en"
      // next-themes sets the theme class on <html> before hydration.
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ClerkProvider appearance={{ theme: shadcn }}>
            <ConvexClientProvider>
              <SiteSettingsProvider initial={settings}>{children}</SiteSettingsProvider>
            </ConvexClientProvider>
            <Toaster />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
