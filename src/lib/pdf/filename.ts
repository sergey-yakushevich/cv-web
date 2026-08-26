import type { EditableResume } from "@/lib/resume-json";

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
 * Both fields are required on a CV, so the fallbacks below only bite if a
 * record is hand-edited to empty strings.
 */
export function resumePdfFileName(data: EditableResume): string {
  const name = sanitise(data.name) || "CV";
  const headline = sanitise(data.headline);

  return headline ? `${name} — ${headline}.pdf` : `${name}.pdf`;
}

/**
 * RFC 6266 / RFC 5987 attachment header. The plain `filename` is the ASCII
 * fallback; `filename*` carries the real one for browsers that read it.
 */
export function attachmentHeader(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");

  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
