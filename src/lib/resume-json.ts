import { type ResumeData, reactToString } from "@/lib/types";

/**
 * The editable shape of a CV, and what is stored in the database.
 *
 * `summary` is the one field that changes shape: the seed files write it as
 * JSX, and it is flattened to a string here and stored as a string. A summary
 * that was JSX does not come back as JSX.
 *
 * `avatarUrl` is a plain URL the user can set or leave empty. It used to be
 * excluded because it was a build-hashed path from importing a bundled image;
 * with one CV per user there is no bundled image to point at, so it is now just
 * another editable field.
 */
export type EditableResume = Omit<ResumeData, "summary"> & {
  summary: string;
};

export function toEditableResume(data: ResumeData): EditableResume {
  return { ...data, summary: reactToString(data.summary) };
}

export function resumeToJson(data: ResumeData): string {
  return JSON.stringify(toEditableResume(data), null, 2);
}
