import type { Metadata, Viewport } from "next";

import "./globals.css";
import type React from "react";
import { ErrorBoundary } from "@/components/error-boundary";

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
  title: "buildcv",
  description:
    "Write your CV once as structured data and download a PDF a résumé parser can read.",
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
    title: "buildcv",
    description:
      "Write your CV once as structured data and download a PDF a résumé parser can read.",
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
      </body>
    </html>
  );
}
