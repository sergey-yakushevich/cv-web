import { type NextRequest, NextResponse } from "next/server";
import { getCv, renameCv, updateCv } from "@/lib/db/queries";
import type { EditableResume } from "@/lib/resume-json";
import { unwrapSavePayload, validateResume } from "@/lib/validate-resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: { userId: string; cvSlug: string };
}

/**
 * Overwrites one CV with the JSON from the editor.
 *
 * Anyone holding the URL may write, by design: there is no registration, so the
 * unguessable id in the path is the whole credential. Knowing the address of a
 * CV is knowing how to edit it, exactly as it is for reading it.
 *
 * The cookie is not consulted. It only remembers which workspace to send *you*
 * back to; it confers nothing, and a visitor editing a CV they arrived at by
 * link is the intended behaviour rather than an attack.
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  if (!getCv(params.userId, params.cvSlug)) {
    return NextResponse.json({ error: "Unknown CV" }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body is not JSON" }, { status: 400 });
  }

  const { resume, label } = unwrapSavePayload(payload);

  const problems = validateResume(resume);
  if (problems.length > 0) {
    return NextResponse.json({ error: problems.join(" ") }, { status: 422 });
  }

  updateCv(params.userId, params.cvSlug, resume as EditableResume);
  if (label) {
    renameCv(params.userId, params.cvSlug, label);
  }

  return NextResponse.json({ slug: params.cvSlug });
}
