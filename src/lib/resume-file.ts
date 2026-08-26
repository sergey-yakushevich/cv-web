import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { EditableResume } from "@/lib/resume-json";

const DATA_DIR = join(process.cwd(), "src", "data");
const REGISTRY = join(DATA_DIR, "resumes.ts");

/**
 * Editing is a local authoring feature: these endpoints write into the repo's
 * own source tree. A deployed instance must never expose them, or anyone could
 * rewrite the CV. Production is refused unless the operator opts in explicitly.
 */
export function editingEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.CV_ENABLE_EDITING === "1"
  );
}

/** Slugs are used to build file paths, so they get a strict allowlist. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= 60;
}

/**
 * Checks a parsed JSON payload has the shape the CV renderer expects.
 *
 * Returns the problems rather than throwing, so the editor can show all of
 * them at once. This is not a full schema check: it covers the fields the page
 * would crash on, which are the arrays it maps over.
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
 * Renders an EditableResume as one of the data files under src/data.
 *
 * The avatar import is re-emitted rather than taken from the payload: the JSON
 * carries no avatarUrl, because the value in a running app is a build-hashed
 * path that would go stale. See the note on EditableResume.
 */
export function renderDataFile(data: EditableResume): string {
  const body = JSON.stringify(data, null, 2)
    .split("\n")
    .map((line, index) => (index === 0 ? line : `  ${line}`))
    .join("\n");

  return `import avatar from "@/images/avatar.jpg";
import type { ResumeData } from "@/lib/types";

export const RESUME_DATA: ResumeData = {
  ...(${body} as Omit<ResumeData, "avatarUrl">),
  avatarUrl: avatar.src,
};
`;
}

export function dataFilePath(slug: string): string {
  return join(DATA_DIR, `${slug}.tsx`);
}

export async function writeVariantData(
  slug: string,
  data: EditableResume
): Promise<void> {
  await writeFile(dataFilePath(slug), renderDataFile(data), "utf8");
}

const camelCase = (slug: string): string =>
  slug.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());

/**
 * Adds a variant to src/data/resumes.ts.
 *
 * The registry is hand-written TypeScript, so this splices into it at two
 * anchors rather than regenerating it: after the last import, and before the
 * closing bracket of RESUME_VARIANTS. It throws if either anchor is missing,
 * so a malformed registry fails loudly instead of being silently rewritten.
 */
export async function registerVariant(entry: {
  slug: string;
  label: string;
  note: string;
  location: string;
  experience: string;
}): Promise<void> {
  const source = await readFile(REGISTRY, "utf8");

  if (source.includes(`slug: "${entry.slug}"`)) {
    throw new Error(`"${entry.slug}" is already in the registry.`);
  }

  const identifier = camelCase(entry.slug);
  const importLine = `import { RESUME_DATA as ${identifier} } from "./${entry.slug}";\n`;

  const lastImport = source.lastIndexOf('} from "./');
  const lastImportEnd = source.indexOf("\n", lastImport) + 1;
  if (lastImport === -1 || lastImportEnd === 0) {
    throw new Error("Could not find the import block in resumes.ts.");
  }

  const arrayStart = source.indexOf("export const RESUME_VARIANTS");
  const arrayEnd = source.indexOf("\n];", arrayStart);
  if (arrayStart === -1 || arrayEnd === -1) {
    throw new Error("Could not find RESUME_VARIANTS in resumes.ts.");
  }

  const newEntry = `  {
    slug: ${JSON.stringify(entry.slug)},
    label: ${JSON.stringify(entry.label)},
    lang: "en",
    locale: "en_US",
    location: ${JSON.stringify(entry.location)},
    experience: ${JSON.stringify(entry.experience)},
    note: ${JSON.stringify(entry.note)},
    data: ${identifier},
  },`;

  const withImport =
    source.slice(0, lastImportEnd) + importLine + source.slice(lastImportEnd);

  // The array end moved by the length of the inserted import line.
  const shifted = arrayEnd + importLine.length;

  await writeFile(
    REGISTRY,
    `${withImport.slice(0, shifted + 1)}${newEntry}\n${withImport.slice(shifted + 1)}`,
    "utf8"
  );
}
