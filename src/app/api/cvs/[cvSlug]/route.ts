import { type NextRequest, NextResponse } from "next/server";
import { getCv, updateCv } from "@/lib/db/queries";
import type { EditableResume } from "@/lib/resume-json";
import { currentUserId } from "@/lib/user";
import { validateResume } from "@/lib/validate-resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: { cvSlug: string };
}

/**
 * Overwrites one CV with the JSON from the editor.
 *
 * The owner comes from the cookie, never from the URL or the body — a request
 * cannot name whose CV it is editing. The page hides the save controls for
 * non-owners, but that is presentation; this is the check that matters.
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const userId = currentUserId();

  if (!userId) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  if (!getCv(userId, params.cvSlug)) {
    // Same answer whether it is missing or somebody else's: a stranger should
    // not be able to probe which slugs exist in another account.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body is not JSON" }, { status: 400 });
  }

  const problems = validateResume(payload);
  if (problems.length > 0) {
    return NextResponse.json({ error: problems.join(" ") }, { status: 422 });
  }

  updateCv(userId, params.cvSlug, payload as EditableResume);

  return NextResponse.json({ slug: params.cvSlug });
}
