import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { ResumeView } from "@/components/resume-view";
import { WelcomeDialog } from "@/components/shadcn-space/dialog/dialog-07";
import { getCounter, getCv, listCvs } from "@/lib/db/queries";
import { themeFontPreloads } from "@/lib/theme-fonts";

// Reads per-user rows, so there is nothing to pre-render.
export const dynamic = "force-dynamic";

interface PageProps {
  params: { userId: string; cvSlug: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const cv = getCv(params.userId, params.cvSlug);

  if (!cv) {
    return {};
  }

  return {
    title: cv.data.headline,
    description: cv.data.about,
    // Someone else's CV is not ours to put in a search index, and these URLs
    // are only as private as the link. Keep them out entirely.
    robots: { index: false, follow: false },
  };
}

/**
 * One CV.
 *
 * Anyone with the URL can read *and* edit it. There is no registration, so the
 * unguessable id in the path is the whole credential — holding the link is the
 * permission. The cookie only remembers which workspace to send a returning
 * visitor back to.
 */
export default function CvPage({ params }: PageProps) {
  const cv = getCv(params.userId, params.cvSlug);

  if (!cv) {
    notFound();
  }

  // The theme's own typefaces, fetched from the first bytes of the response
  // for the same reason the layout preloads Inter: the first paint should
  // already be in the final fonts. Only this page knows the CV's theme, so
  // the per-theme preloads live here rather than in the layout.
  for (const href of themeFontPreloads(cv.data.theme)) {
    preload(href, {
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
      fetchPriority: "high",
    });
  }

  // Set by /api/session/start when it mints a brand-new user; the dialog
  // deletes it on dismiss, and it expires on its own regardless.
  const showWelcome = cookies().get("cv_welcome")?.value === "1";

  return (
    <>
      <ResumeView cv={cv} cvs={listCvs(params.userId)} userId={params.userId} />
      {showWelcome && (
        <WelcomeDialog resumesGenerated={getCounter("resumes_generated")} />
      )}
    </>
  );
}
