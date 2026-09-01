import type { EditableResume } from "@/lib/resume-json";
import { CV_THEMES, isCvThemeId } from "@/lib/themes";

/**
 * Checks a parsed JSON payload has the shape the CV renderer expects.
 *
 * Returns the problems rather than throwing, so the editor can show all of them
 * at once. This is not a full schema check: it covers the fields the page would
 * crash on, which are the arrays it maps over.
 */
export function validateResume(input: unknown): string[] {
  const problems: string[] = [];
  const data = input as Partial<EditableResume> | null;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return ["The JSON must be an object."];
  }

  const requiredStrings: (keyof EditableResume)[] = [
    "name",
    "initials",
    "location",
    "headline",
    "about",
    "summary",
  ];
  for (const key of requiredStrings) {
    if (typeof data[key] !== "string" || !(data[key] as string).trim()) {
      problems.push(`"${key}" must be a non-empty string.`);
    }
  }

  const requiredArrays: (keyof EditableResume)[] = [
    "work",
    "education",
    "skills",
    "projects",
  ];
  for (const key of requiredArrays) {
    if (!Array.isArray(data[key])) {
      problems.push(`"${key}" must be an array.`);
    }
  }

  if (!data.contact || typeof data.contact !== "object") {
    problems.push('"contact" must be an object.');
  } else if (!Array.isArray(data.contact.social)) {
    problems.push('"contact.social" must be an array.');
  }

  // theme is optional; when present it must name a palette that exists,
  // because the value round-trips into a data attribute on the page.
  if (data.theme !== undefined && !isCvThemeId(data.theme)) {
    problems.push(
      `"theme" must be one of: ${CV_THEMES.map((t) => t.id).join(", ")}.`
    );
  }

  if (Array.isArray(data.work)) {
    data.work.forEach((job, index) => {
      if (!Array.isArray(job?.description)) {
        problems.push(
          `work[${index}].description must be an array of bullets.`
        );
      }
      if (!Array.isArray(job?.badges)) {
        problems.push(`work[${index}].badges must be an array.`);
      }
    });
  }

  return problems;
}

/**
 * Splits a PUT body into the resume and an optional new label.
 *
 * Two shapes are accepted: the raw resume JSON (the original contract), or an
 * envelope { label?, data } from the save dialog. The resume shape has no
 * "data" key of its own, so the envelope check cannot misfire on one.
 */
export function unwrapSavePayload(payload: unknown): {
  resume: unknown;
  label?: string;
} {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    typeof (payload as { data: unknown }).data === "object"
  ) {
    const envelope = payload as { data: unknown; label?: unknown };
    const label =
      typeof envelope.label === "string" && envelope.label.trim()
        ? envelope.label.trim()
        : undefined;
    return { resume: envelope.data, label };
  }

  return { resume: payload };
}

/** Turns "EN / Batumi / Go 2026" into "en-batumi-go-2026". */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= 60;
}
