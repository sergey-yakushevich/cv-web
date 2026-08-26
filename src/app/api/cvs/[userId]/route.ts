import { type NextRequest, NextResponse } from "next/server";
import { createCv, listCvs, slugAvailable, userExists } from "@/lib/db/queries";
import type { EditableResume } from "@/lib/resume-json";
import { isValidSlug, slugify, validateResume } from "@/lib/validate-resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: { userId: string };
}

/**
 * Adds a CV to the workspace named in the URL.
 *
 * It lands in that workspace rather than the caller's own, so it appears in the
 * "My resumes" list they are looking at. Same rule as editing: the id in the
 * path is the credential, and holding it is permission enough.
 *
 * Slugs are unique per workspace, not globally, so two people can both have
 * /:their-id/senior-engineer.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  if (!userExists(params.userId)) {
    return NextResponse.json({ error: "Unknown workspace" }, { status: 404 });
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

  if (!slugAvailable(params.userId, slug)) {
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
    userId: params.userId,
    slug,
    label,
    data: body.data as EditableResume,
    position: listCvs(params.userId).length,
  });

  return NextResponse.json({ slug });
}
