import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { currentUserId, firstCvSlug } from "@/lib/user";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "Free CV Builder — No Sign-Up, ATS-Friendly PDF | buildcv",
  },
  description:
    "Free CV builder, online, no sign-up. Write your CV once as structured data, keep several versions, and download a PDF whose text layer a résumé parser can actually read.",
  alternates: {
    canonical: "/",
  },
};

/*
 * WebApplication schema with a zero-price offer — the structured-data way to
 * say "free CV builder", which is the query this page targets.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "buildcv",
  url: "https://buildcv.cc",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Free online CV builder. Edit your CV as structured data and download an ATS-friendly PDF. No sign-up.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

/**
 * The landing page, and the door back in for returning visitors.
 *
 * Anyone who already has a session is sent straight to their CV; there is no
 * reason to show them the pitch. Everyone else gets one button, which hands off
 * to /api/session/start — a route handler, because that is the only place a
 * cookie can be set during a plain navigation.
 */
export default function LandingPage() {
  const userId = currentUserId();

  if (userId) {
    const slug = firstCvSlug(userId);

    if (slug) {
      redirect(`/${userId}/${slug}`);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 p-8">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, no user input
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          The free CV builder that prints itself
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Build your CV online, free, with no sign-up. Write it once as
          structured data, edit it as JSON, keep as many versions as you need,
          and download a PDF whose text layer a résumé parser can actually read
          — not a picture of one.
        </p>
      </div>

      <ul className="space-y-2 text-sm text-muted-foreground">
        <li>· Several versions of the same CV, each at its own URL</li>
        <li>· Edit the data directly, no form to fight</li>
        <li>· PDFs printed by a real browser, so they match what you see</li>
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild={true} size="lg">
          <Link href="/api/session/start">Start building</Link>
        </Button>
        <span className="text-xs text-muted-foreground">
          No sign-up. Your CVs are kept against this browser.
        </span>
      </div>
    </main>
  );
}
