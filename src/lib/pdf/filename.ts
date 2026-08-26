import { DEFAULT_VARIANT, type ResumeVariant } from "@/data/resumes";

/** Strip anything a filesystem or a Content-Disposition header would choke on. */
function sanitise(value: string): string {
  return value
    .replace(/[/\\?%*:|"<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The name a recruiter sees in their inbox, so it leads with the person and
 * not with a URL slug.
 *
 *   default      -> "Sergey Yakushevich - CV.pdf"
 *   other        -> "Sergey Yakushevich - CV (Go ATS).pdf"
 *
 * The tag comes from the last segment of the variant label, which is the part
 * that says what makes that version different. New variants get a sensible
 * name with no extra wiring.
 */
export function resumePdfFileName(variant: ResumeVariant): string {
  const name = sanitise(variant.data.name);

  if (variant.slug === DEFAULT_VARIANT.slug) {
    return `${name} - CV.pdf`;
  }

  const lastSegment = variant.label.split("/").pop() ?? variant.slug;
  const tag = sanitise(lastSegment.replace(/[()]/g, ""));

  return tag ? `${name} - CV (${tag}).pdf` : `${name} - CV.pdf`;
}

/**
 * RFC 6266 / RFC 5987 attachment header. The plain `filename` is the ASCII
 * fallback; `filename*` carries the real one for browsers that read it.
 */
export function attachmentHeader(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");

  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
