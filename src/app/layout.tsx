import type { Metadata, Viewport } from "next";

import "./globals.css";
import type React from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { VisitTracker } from "@/components/visit-tracker";

/*
 * Site-wide defaults only.
 *
 * These used to be built from Sergey's CV — his name as the author, his about
 * line as the description, his personal site as the canonical URL. With one CV
 * per user that is wrong on every page but his, so the shell is now neutral and
 * each CV page supplies its own title and description.
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://buildcv.cc"),
  /*
   * The path contains the id that grants edit access to a CV, so it must never
   * travel to another site. This is the browser default in current Chrome and
   * Firefox, but the default is not something to rely on when leaking it hands
   * a stranger write access.
   */
  referrer: "strict-origin-when-cross-origin",
  title: {
    default: "Free CV Builder — buildcv",
    template: "%s — buildcv",
  },
  description:
    "Free online CV builder with no sign-up. Write your CV once as structured data and download an ATS-friendly PDF a résumé parser can actually read.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://buildcv.cc",
    siteName: "buildcv",
    title: "Free CV Builder — buildcv",
    description:
      "Free online CV builder with no sign-up. Write your CV once as structured data and download an ATS-friendly PDF a résumé parser can actually read.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
        <VisitTracker />
      </body>
    </html>
  );
}
