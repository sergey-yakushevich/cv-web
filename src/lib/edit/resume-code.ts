/**
 * The "{} Code" view of a CV: the resume JSON with a comment block on top
 * that doubles as an AI prompt. Pure string logic, so it is testable and the
 * dialog component stays presentation-only.
 */

/**
 * Shown above the JSON and included in what the copy button copies: pasted
 * into a chat together with an old resume, it tells the AI exactly what to
 * produce. parseResumeCode strips it back out, so the comment really is
 * "part of the JSON" without breaking JSON.parse.
 */
export const CODE_PROMPT_COMMENT = `// This is my resume as JSON, in the exact format this CV builder uses.
// AI: I will also give you my old resume. Rewrite my old resume into a
// new JSON with exactly this structure — same keys, same nesting, same
// value types. Reply with only the JSON, no explanations.
// Me: when the AI is done, paste its JSON back here and press "Apply changes".`;

/** The comment block plus the pretty-printed resume JSON. */
export function resumeToCode(resume: unknown): string {
  return `${CODE_PROMPT_COMMENT}\n${JSON.stringify(resume, null, 2)}\n`;
}

/**
 * Parses the editor text back to a resume object.
 *
 * Tolerant of what actually gets pasted: the comment block (or any // line)
 * is dropped, and text around the outermost { ... } — a stray "Here is your
 * JSON:" or a trailing code fence — is trimmed away. Throws on anything that
 * still is not valid JSON; the dialog shows the message.
 */
export function parseResumeCode(text: string): unknown {
  const withoutComments = text
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");

  const start = withoutComments.indexOf("{");
  const end = withoutComments.lastIndexOf("}");
  const body =
    start !== -1 && end > start
      ? withoutComments.slice(start, end + 1)
      : withoutComments;

  return JSON.parse(body);
}

/**
 * The resume-card preview: the first `max` characters of the About text,
 * cut on a word boundary where one is near, with an ellipsis when trimmed.
 */
export function previewText(text: string, max = 140): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;

  const slice = clean.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`;
}
