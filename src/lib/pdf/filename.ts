import {
  DEFAULT_VARIANT,
  RESUME_VARIANTS,
  type ResumeVariant,
} from "@/data/resumes";

/** Strip anything a filesystem or a Content-Disposition header would choke on. */
function sanitise(value: string): string {
  return value
    .replace(/[/\\?%*:|"<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The name a recruiter sees in their inbox: the person, an em dash, then the
 * role the CV is aimed at.
 *
 *   "Sergey Yakushevich — Senior Backend Engineer (Go, Ruby).pdf"
 *
 * Two versions can legitimately share a headline. They must not share a
 * filename: `pnpm cv:pdf` writes them all into generated-cvs/, so a duplicate
 * would silently overwrite the other. A shared headline therefore gets the
 * variant tag appended.
 */
export function resumePdfFileName(variant: ResumeVariant): string {
  const name = sanitise(variant.data.name);
  const headline = sanitise(variant.data.headline ?? "");

  if (headline) {
    const shared = RESUME_VARIANTS.some(
      (other) =>
        other.slug !== variant.slug &&
        sanitise(other.data.headline ?? "") === headline
    );

    return shared
      ? `${name} — ${headline} (${variantTag(variant)}).pdf`
      : `${name} — ${headline}.pdf`;
  }

  // headline is required, so this is only reached if a file is hand-edited to
  // an empty one. Keep the versions distinguishable rather than colliding.
  if (variant.slug === DEFAULT_VARIANT.slug) {
    return `${name} - CV.pdf`;
  }

  return `${name} - CV (${variantTag(variant)}).pdf`;
}

/** The last segment of the label — the part that says what this version is. */
function variantTag(variant: ResumeVariant): string {
  const lastSegment = variant.label.split("/").pop() ?? variant.slug;

  return sanitise(lastSegment.replace(/[()]/g, "")) || variant.slug;
}

/**
 * RFC 6266 / RFC 5987 attachment header. The plain `filename` is the ASCII
 * fallback; `filename*` carries the real one for browsers that read it.
 */
export function attachmentHeader(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");

  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
