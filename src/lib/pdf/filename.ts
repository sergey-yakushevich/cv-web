import { DEFAULT_VARIANT, type ResumeVariant } from "@/data/resumes";

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
 * A version with no headline falls back to the older scheme, which tags the
 * variant so the files stay distinct. That matters for `pnpm cv:pdf`: two
 * versions resolving to the same name would silently overwrite each other in
 * generated-cvs/.
 */
export function resumePdfFileName(variant: ResumeVariant): string {
  const name = sanitise(variant.data.name);
  const headline = sanitise(variant.data.headline ?? "");

  if (headline) {
    return `${name} — ${headline}.pdf`;
  }

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
