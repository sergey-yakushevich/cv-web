import { type NextRequest, NextResponse } from "next/server";
import { createCv, listCvs, slugAvailable } from "@/lib/db/queries";
import type { EditableResume } from "@/lib/resume-json";
import { currentUserId } from "@/lib/user";
import { isValidSlug, slugify, validateResume } from "@/lib/validate-resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Creates another CV for the signed-in browser.
 *
 * Slugs are unique per user, not globally, so two people can both have
 * /:their-id/senior-engineer without colliding.
 */
export async function POST(request: NextRequest) {
  const userId = currentUserId();

  if (!userId) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  let body: { label?: string; data?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body is not JSON" }, { status: 400 });
  }

  const label = body.label?.trim();
  if (!label) {
    return NextResponse.json({ error: "A name is required" }, { status: 400 });
  }

  const slug = slugify(label);
  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "That name has no letters or digits to build a URL from." },
      { status: 400 }
    );
  }

  if (!slugAvailable(userId, slug)) {
    return NextResponse.json(
      { error: `"${slug}" already exists. Pick another name.` },
      { status: 409 }
    );
  }

  const problems = validateResume(body.data);
  if (problems.length > 0) {
    return NextResponse.json({ error: problems.join(" ") }, { status: 422 });
  }

  createCv({
    userId,
    slug,
    label,
    data: body.data as EditableResume,
    position: listCvs(userId).length,
  });

  return NextResponse.json({ slug });
}
