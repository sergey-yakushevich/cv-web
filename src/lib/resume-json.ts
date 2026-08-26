import { type ResumeData, reactToString } from "@/lib/types";

/**
 * The editable shape of a CV.
 *
 * This is what the JSON tab shows and what the save endpoints accept, so it has
 * to round-trip. Two fields are deliberately not part of it:
 *
 *  - `summary` is JSX in the data files. It is flattened to a string here, and
 *    written back as a string, which ResumeData allows. A summary that was JSX
 *    does not come back as JSX.
 *  - `avatarUrl` is a build-hashed path produced by importing the image. Editing
 *    it would be meaningless and writing it back would break on the next build,
 *    so the avatar stays in code.
 */
export type EditableResume = Omit<ResumeData, "summary" | "avatarUrl"> & {
  summary: string;
};

export function toEditableResume(data: ResumeData): EditableResume {
  const { summary, avatarUrl: _avatarUrl, ...rest } = data;

  return { ...rest, summary: reactToString(summary) };
}

export function resumeToJson(data: ResumeData): string {
  return JSON.stringify(toEditableResume(data), null, 2);
}
