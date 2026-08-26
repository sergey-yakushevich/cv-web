import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResumeView } from "@/components/resume-view";
import { getCv, listCvs } from "@/lib/db/queries";
import { currentUserId } from "@/lib/user";

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
 * Anyone with the URL can read it — the id is the only thing protecting it, and
 * a UUIDv7 has enough randomness not to be guessable. Editing is a different
 * matter: only the owner gets the controls, and the API checks ownership again
 * regardless of what the page decides to render.
 */
export default function CvPage({ params }: PageProps) {
  const cv = getCv(params.userId, params.cvSlug);

  if (!cv) {
    notFound();
  }

  const isOwner = currentUserId() === params.userId;

  return (
    <ResumeView
      cv={cv}
      cvs={listCvs(params.userId)}
      userId={params.userId}
      canEdit={isOwner}
    />
  );
}
