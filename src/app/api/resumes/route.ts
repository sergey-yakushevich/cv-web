import { type NextRequest, NextResponse } from "next/server";
import { getVariant } from "@/data/resumes";
import {
  editingEnabled,
  isValidSlug,
  registerVariant,
  validateResume,
  writeVariantData,
} from "@/lib/resume-file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Turns "EN / Batumi / Go 2026" into "en-batumi-go-2026". */
function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Creates a new CV version: writes src/data/<slug>.tsx and adds it to the
 * registry in src/data/resumes.ts.
 *
 * The browser side is the "Save as new" popover in
 * src/components/resume-json-panel.tsx. It sends the edited JSON plus the name
 * typed into the popover, and navigates to the returned slug on success.
 */
export async function POST(request: NextRequest) {
  if (!editingEnabled()) {
    return NextResponse.json(
      { error: "Editing is disabled on this instance." },
      { status: 403 }
    );
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

  if (getVariant(slug)) {
    return NextResponse.json(
      { error: `"${slug}" already exists. Pick another name.` },
      { status: 409 }
    );
  }

  const problems = validateResume(body.data);
  if (problems.length > 0) {
    return NextResponse.json({ error: problems.join(" ") }, { status: 422 });
  }

  // biome-ignore lint/suspicious/noExplicitAny: validateResume has checked the shape
  const data = body.data as any;

  try {
    await writeVariantData(slug, data);
    await registerVariant({
      slug,
      label,
      note: `Created from the JSON editor.`,
      location: data.location ?? "",
      experience: "",
    });

    return NextResponse.json({ slug });
  } catch (error) {
    console.error(`Creating /${slug} failed:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create" },
      { status: 500 }
    );
  }
}
