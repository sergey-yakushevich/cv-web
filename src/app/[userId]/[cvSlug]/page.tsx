import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { ResumeView } from "@/components/resume-view";
import { WelcomeDialog } from "@/components/shadcn-space/dialog/dialog-07";
import { type CvRow, getCounter, getCv, listCvs } from "@/lib/db/queries";
import {
  stripWatermarks,
  summarizeWatermarksReport,
} from "@/lib/pdf/strip-watermarks";
import { themeFontPreloads } from "@/lib/theme-fonts";

// Reads per-user rows, so there is nothing to pre-render.
export const dynamic = "force-dynamic";

interface PageProps {
  params: { userId: string; cvSlug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

/** The ?print=1 body: clean the CV for the PDF, leaving a server-log trace. */
async function stripForPrint(cv: CvRow): Promise<CvRow> {
  const { data, report } = await stripWatermarks(cv.data);
  console.info(`[watermarks] ${summarizeWatermarksReport(report)}`);
  return { ...cv, data };
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
export default async function CvPage({ params, searchParams }: PageProps) {
  const cv = getCv(params.userId, params.cvSlug);

  if (!cv) {
    notFound();
  }

  /*
   * ?print=1 is set by the PDF render (render-resume.ts), and turns this
   * server render into the final step of resume generation: the CV is run
   * through the watermark-removal layers before Chrome prints it, so the
   * downloaded file carries no AI provenance marks. Screen views never set
   * the flag, so what a visitor sees on screen is exactly what is stored —
   * the stored data itself is never modified by a download.
   */
  const renderCv = searchParams?.print === "1" ? await stripForPrint(cv) : cv;

  // The theme's own typefaces, fetched from the first bytes of the response
  // for the same reason the layout preloads Inter: the first paint should
  // already be in the final fonts. Only this page knows the CV's theme, so
  // the per-theme preloads live here rather than in the layout.
  for (const href of themeFontPreloads(renderCv.data.theme)) {
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
      <ResumeView
        cv={renderCv}
        cvs={listCvs(params.userId)}
        userId={params.userId}
      />
      {showWelcome && (
        <WelcomeDialog resumesGenerated={getCounter("resumes_generated")} />
      )}
    </>
  );
}
