import { describe, expect, it } from "vitest";
import {
  isValidSlug,
  slugify,
  validateResume,
} from "@/lib/validate-resume";

const validResume = () => ({
  name: "Ada Lovelace",
  initials: "AL",
  location: "London",
  locationLink: "",
  headline: "Engineer",
  about: "First programmer",
  summary: "Wrote the first algorithm.",
  personalWebsiteUrl: "",
  contact: { email: "ada@example.com", tel: "", social: [] },
  education: [],
  work: [
    {
      company: "Analytical Engines",
      link: "",
      badges: ["Math"],
      title: "Engineer",
      start: "1842",
      end: null,
      description: ["Wrote notes G."],
    },
  ],
  skills: ["Mathematics"],
  projects: [],
});

describe("validateResume", () => {
  it("accepts a complete resume", () => {
    expect(validateResume(validResume())).toEqual([]);
  });

  it("rejects non-objects", () => {
    expect(validateResume(null)).toEqual(["The JSON must be an object."]);
    expect(validateResume([])).toEqual(["The JSON must be an object."]);
    expect(validateResume("hi")).toEqual(["The JSON must be an object."]);
  });

  it("reports every missing required string at once", () => {
    const problems = validateResume({});
    for (const key of [
      "name",
      "initials",
      "location",
      "headline",
      "about",
      "summary",
    ]) {
      expect(problems).toContain(`"${key}" must be a non-empty string.`);
    }
  });

  it("rejects a blank string as missing", () => {
    const resume = { ...validResume(), name: "   " };
    expect(validateResume(resume)).toContain(
      '"name" must be a non-empty string.'
    );
  });

  it("requires the arrays the page maps over", () => {
    const resume = { ...validResume(), work: undefined, skills: "Go" };
    const problems = validateResume(resume);
    expect(problems).toContain('"work" must be an array.');
    expect(problems).toContain('"skills" must be an array.');
  });

  it("requires contact and contact.social", () => {
    expect(validateResume({ ...validResume(), contact: null })).toContain(
      '"contact" must be an object.'
    );
    expect(
      validateResume({
        ...validResume(),
        contact: { email: "", tel: "", social: "x" },
      })
    ).toContain('"contact.social" must be an array.');
  });

  it("accepts a known theme, no theme, but not an unknown theme", () => {
    expect(validateResume({ ...validResume(), theme: "graphite" })).toEqual([]);
    expect(validateResume({ ...validResume(), theme: "mono" })).toEqual([]);
    expect(validateResume(validResume())).toEqual([]);
    expect(
      validateResume({ ...validResume(), theme: "hotdog-stand" }).join(" ")
    ).toContain('"theme" must be one of');
  });

  it("checks each job's bullets and badges", () => {
    const resume = validResume();
    // @ts-expect-error deliberately malformed
    resume.work[0].description = "not an array";
    // @ts-expect-error deliberately malformed
    resume.work[0].badges = null;
    const problems = validateResume(resume);
    expect(problems).toContain(
      "work[0].description must be an array of bullets."
    );
    expect(problems).toContain("work[0].badges must be an array.");
  });
});

describe("slugify", () => {
  it("lowercases and joins with dashes", () => {
    expect(slugify("EN / Batumi / Go 2026")).toBe("en-batumi-go-2026");
  });

  it("trims leading and trailing separators", () => {
    expect(slugify("  ...My CV!  ")).toBe("my-cv");
  });

  it("caps the length at 60", () => {
    expect(slugify("x".repeat(100)).length).toBeLessThanOrEqual(60);
  });

  it("can produce an empty slug from symbols only", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("isValidSlug", () => {
  it("accepts simple dash-joined slugs", () => {
    expect(isValidSlug("my-cv")).toBe(true);
    expect(isValidSlug("cv2")).toBe(true);
  });

  it("rejects empty, spaced, or dangling-dash slugs", () => {
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("my cv")).toBe(false);
    expect(isValidSlug("-cv")).toBe(false);
    expect(isValidSlug("cv-")).toBe(false);
    expect(isValidSlug("CV")).toBe(false);
  });
});
