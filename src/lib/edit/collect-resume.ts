import { setByPath } from "./set-by-path";

/**
 * Collects every edited element back into the CV JSON. The DOM is the form:
 * each data-edit-path element contributes its text at that path, so untouched
 * fields round-trip unchanged from the `json` snapshot. Used by Save,
 * Save-as-new and "add entry" alike.
 *
 * Takes the root element rather than reaching for document, so it can be
 * exercised against any DOM — including a synthetic one in tests.
 */
export function collectResumeFromDom(
  root: HTMLElement,
  json: string,
  pendingAvatar: string | null
  // biome-ignore lint/suspicious/noExplicitAny: the JSON is validated server-side
): any {
  const parsed = JSON.parse(json);

  /*
   * Entries can be added in the DOM (the "Add job" / "Add education"
   * controls), so the arrays must be grown to cover every original index
   * present before the indexed paths below can land in them.
   */
  const grow = (kind: "work" | "education", blank: () => unknown) => {
    const arr = parsed[kind];
    if (!Array.isArray(arr)) return;
    for (const el of root.querySelectorAll<HTMLElement>(
      `[data-entry="${kind}"]`
    )) {
      const index = Number(el.dataset.entryIndex) || 0;
      while (arr.length <= index) arr.push(blank());
    }
  };
  grow("work", () => ({
    company: "",
    link: "",
    badges: [],
    title: "",
    start: "",
    end: null,
    description: [],
  }));
  grow("education", () => ({ school: "", degree: "", start: "", end: "" }));

  for (const el of root.querySelectorAll<HTMLElement>("[data-edit-path]")) {
    const path = el.dataset.editPath;
    if (!path) continue;

    let value: string | null = (el.textContent ?? "")
      .replace(/\s+/g, " ")
      .trim();

    const format = el.dataset.editFormat;
    // Link text is shown bare (github.com/...); stored with a scheme.
    if (format === "url" && value && !/^https?:\/\//i.test(value)) {
      value = `https://${value}`;
    }
    // An open-ended job renders as "Present" but is stored as null.
    if (format === "present") {
      value = value === "" || /^present$/i.test(value) ? null : value;
    }

    setByPath(parsed, path, value);
  }

  /*
   * Badge lists are rebuilt wholesale rather than written by index: badges
   * can be added and deleted in the DOM, so the list itself — in DOM order,
   * blanks dropped — is the truth.
   */
  for (const list of root.querySelectorAll<HTMLElement>("[data-edit-list]")) {
    const path = list.dataset.editList;
    if (!path) continue;

    const values = Array.from(
      list.querySelectorAll<HTMLElement>("[data-edit-item]")
    )
      .map((el) => (el.textContent ?? "").replace(/\s+/g, " ").trim())
      .filter(Boolean);

    setByPath(parsed, path, values);
  }

  /*
   * Deletions are absences: a contact item removed from the DOM takes its
   * field with it. Email and phone blank out; a social entry is dropped —
   * but only the socials the header actually renders can be deleted this
   * way, so anything else (an icon the contact line does not show) is left
   * untouched.
   */
  if (parsed.contact && typeof parsed.contact === "object") {
    if (!root.querySelector('[data-edit-path="contact.email"]')) {
      parsed.contact.email = "";
    }
    if (!root.querySelector('[data-edit-path="contact.tel"]')) {
      parsed.contact.tel = "";
    }
    if (Array.isArray(parsed.contact.social)) {
      const rendered = new Set(["globe", "github", "linkedin"]);
      const surviving = new Set(
        Array.from(
          root.querySelectorAll<HTMLElement>("[data-edit-path]"),
          (el) =>
            el.dataset.editPath?.match(/^contact\.social\.(\d+)\.url$/)?.[1]
        ).filter(Boolean)
      );
      parsed.contact.social = parsed.contact.social.filter(
        (social: { icon?: string }, index: number) =>
          !rendered.has(social?.icon ?? "") || surviving.has(String(index))
      );
    }
  }

  /*
   * Jobs and education are rebuilt from the DOM: surviving entries in their
   * on-screen order, keyed by the original index each article carries — a
   * deleted entry simply is not in the list any more.
   */
  for (const kind of ["work", "education"] as const) {
    const arr = parsed[kind];
    if (!Array.isArray(arr)) continue;
    parsed[kind] = Array.from(
      root.querySelectorAll<HTMLElement>(`[data-entry="${kind}"]`),
      (el) => arr[Number(el.dataset.entryIndex) || 0]
    ).filter(Boolean);
  }

  if (pendingAvatar) parsed.avatarUrl = pendingAvatar;

  return parsed;
}
