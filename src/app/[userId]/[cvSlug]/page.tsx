import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResumeView } from "@/components/resume-view";
import { getCv, listCvs } from "@/lib/db/queries";

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

  return (
    <ResumeView cv={cv} cvs={listCvs(params.userId)} userId={params.userId} />
  );
}
