// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { collectResumeFromDom } from "@/lib/edit/collect-resume";

/*
 * The DOM is the form: these tests build the same markup shapes the resume
 * renderer emits (data-edit-path / data-edit-list / data-entry) and check the
 * edits collect back into the JSON exactly as the real editor relies on.
 */

const baseJson = () =>
  JSON.stringify({
    name: "Ada",
    contact: {
      email: "ada@example.com",
      tel: "+1",
      social: [
        { name: "GitHub", url: "https://github.com/ada", icon: "github" },
        { name: "Site", url: "https://ada.dev", icon: "globe" },
      ],
    },
    work: [
      {
        company: "Engines",
        link: "https://engines.example",
        badges: ["Math"],
        title: "Engineer",
        start: "1842",
        end: null,
        description: ["Notes"],
      },
    ],
    education: [{ school: "Home", degree: "Tutors", start: "", end: "" }],
  });

let root: HTMLElement;

beforeEach(() => {
  root = document.createElement("div");
  document.body.replaceChildren(root);
});

function contactMarkup() {
  return `
    <span data-edit-path="contact.email">ada@example.com</span>
    <span data-edit-path="contact.tel">+1</span>
    <span data-edit-path="contact.social.0.url" data-edit-format="url">github.com/ada</span>
    <span data-edit-path="contact.social.1.url" data-edit-format="url">https://ada.dev</span>
  `;
}

function entriesMarkup() {
  return `
    <article data-entry="work" data-entry-index="0">
      <span data-edit-path="work.0.title">Engineer</span>
      <span data-edit-path="work.0.end" data-edit-format="present">Present</span>
      <ul data-edit-list="work.0.badges">
        <li><span data-edit-item>Math</span></li>
      </ul>
    </article>
    <article data-entry="education" data-entry-index="0">
      <span data-edit-path="education.0.school">Home</span>
    </article>
  `;
}

describe("collectResumeFromDom", () => {
  it("round-trips untouched fields from the json snapshot", () => {
    root.innerHTML = contactMarkup() + entriesMarkup();
    const out = collectResumeFromDom(root, baseJson(), null);
    expect(out.name).toBe("Ada");
    expect(out.work[0].company).toBe("Engines");
  });

  it("collects edited text at its path, collapsing whitespace", () => {
    root.innerHTML = contactMarkup() + entriesMarkup();
    const title = root.querySelector('[data-edit-path="work.0.title"]');
    if (title) title.textContent = "  Chief \n Engineer ";
    const out = collectResumeFromDom(root, baseJson(), null);
    expect(out.work[0].title).toBe("Chief Engineer");
  });

  it("re-adds the scheme to bare link text", () => {
    root.innerHTML = contactMarkup() + entriesMarkup();
    const out = collectResumeFromDom(root, baseJson(), null);
    expect(out.contact.social[0].url).toBe("https://github.com/ada");
    expect(out.contact.social[1].url).toBe("https://ada.dev");
  });

  it('stores "Present" (or blank) as null for an open-ended job', () => {
    root.innerHTML = contactMarkup() + entriesMarkup();
    const out = collectResumeFromDom(root, baseJson(), null);
    expect(out.work[0].end).toBeNull();

    const end = root.querySelector('[data-edit-path="work.0.end"]');
    if (end) end.textContent = "2026";
    const dated = collectResumeFromDom(root, baseJson(), null);
    expect(dated.work[0].end).toBe("2026");
  });

  it("rebuilds badge lists from the DOM in order, dropping blanks", () => {
    root.innerHTML = contactMarkup() + entriesMarkup();
    const list = root.querySelector('[data-edit-list="work.0.badges"]');
    if (list) {
      list.innerHTML =
        "<li><span data-edit-item>Go</span></li>" +
        "<li><span data-edit-item>  </span></li>" +
        "<li><span data-edit-item>Ruby</span></li>";
    }
    const out = collectResumeFromDom(root, baseJson(), null);
    expect(out.work[0].badges).toEqual(["Go", "Ruby"]);
  });

  it("treats a removed contact as a deletion", () => {
    root.innerHTML = entriesMarkup(); // no contact markup at all
    const out = collectResumeFromDom(root, baseJson(), null);
    expect(out.contact.email).toBe("");
    expect(out.contact.tel).toBe("");
    // Both socials use rendered icons and neither survived in the DOM.
    expect(out.contact.social).toEqual([]);
  });

  it("keeps socials whose icon the header never renders", () => {
    const json = JSON.stringify({
      ...JSON.parse(baseJson()),
      contact: {
        email: "",
        tel: "",
        social: [{ name: "X", url: "https://x.com/ada", icon: "x" }],
      },
    });
    root.innerHTML = entriesMarkup();
    const out = collectResumeFromDom(root, json, null);
    expect(out.contact.social).toHaveLength(1);
  });

  it("drops a work entry deleted from the DOM and keeps DOM order", () => {
    const json = JSON.stringify({
      ...JSON.parse(baseJson()),
      work: [
        { company: "First", badges: [], description: [] },
        { company: "Second", badges: [], description: [] },
      ],
    });
    root.innerHTML = `
      <article data-entry="work" data-entry-index="1"></article>
    `;
    const out = collectResumeFromDom(root, json, null);
    expect(out.work.map((w: { company: string }) => w.company)).toEqual([
      "Second",
    ]);
  });

  it("grows arrays for entries added in the DOM", () => {
    root.innerHTML = `
      <article data-entry="work" data-entry-index="0"></article>
      <article data-entry="work" data-entry-index="1">
        <span data-edit-path="work.1.company">New Co</span>
      </article>
    `;
    const out = collectResumeFromDom(root, baseJson(), null);
    expect(out.work).toHaveLength(2);
    expect(out.work[1].company).toBe("New Co");
  });

  it("applies a pending avatar", () => {
    root.innerHTML = entriesMarkup();
    const out = collectResumeFromDom(root, baseJson(), "data:image/png;a");
    expect(out.avatarUrl).toBe("data:image/png;a");
  });
});
