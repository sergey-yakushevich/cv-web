import { type NextRequest, NextResponse } from "next/server";
import { getVariant } from "@/data/resumes";
import {
  editingEnabled,
  validateResume,
  writeVariantData,
} from "@/lib/resume-file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: { variant: string };
}

/**
 * Overwrites one CV version's data file with the JSON from the editor.
 *
 * The browser side is the Save button in src/components/resume-json-panel.tsx.
 * On success the client refreshes the route, so the CV tab re-renders from the
 * file that was just written.
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  if (!editingEnabled()) {
    return NextResponse.json(
      { error: "Editing is disabled on this instance." },
      { status: 403 }
    );
  }

  const variant = getVariant(params.variant);

  if (!variant) {
    return NextResponse.json({ error: "Unknown CV version" }, { status: 404 });
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

  try {
    // biome-ignore lint/suspicious/noExplicitAny: validateResume has checked the shape
    await writeVariantData(variant.slug, payload as any);
    return NextResponse.json({ slug: variant.slug });
  } catch (error) {
    console.error(`Saving /${variant.slug} failed:`, error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not save",
      },
      { status: 500 }
    );
  }
}
