import { NextResponse } from "next/server";
import { RESUME_VARIANTS } from "@/data/resumes";
import { createCv, listCvs, slugAvailable } from "@/lib/db/queries";
import { toEditableResume } from "@/lib/resume-json";
import { currentUserId } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Loads the CVs committed under src/data into the calling browser's account.
 *
 * Those files are Sergey's real résumés. They are deliberately not what a new
 * visitor is seeded with — that is STARTER_TEMPLATE, which is nobody's CV — so
 * this is the one-off route that gets the real ones into an account. Driven by
 * `pnpm cv:import <userId>`.
 *
 * Local only. On a deployed instance this would let anyone claim a copy of
 * someone else's CV, contact details included.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Import is only available locally." },
      { status: 403 }
    );
  }

  const userId = currentUserId();

  if (!userId) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  const imported: { slug: string; label: string }[] = [];
  let position = listCvs(userId).length;

  for (const variant of RESUME_VARIANTS) {
    if (!slugAvailable(userId, variant.slug)) {
      continue;
    }

    createCv({
      userId,
      slug: variant.slug,
      label: variant.label,
      data: toEditableResume(variant.data),
      position: position++,
    });

    imported.push({ slug: variant.slug, label: variant.label });
  }

  return NextResponse.json({ imported });
}
